'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { loginSchema, registerSchema } from '@/lib/validations/auth'

type ActionResult = { success: boolean; error?: string }

/**
 * Registers a new user with status = "pending" and no role.
 * The account must be approved by an admin before it can be used.
 */
export async function register(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { success: false, error: firstError }
  }

  const { fullName, email, password } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) {
    return { success: false, error: 'An account with this email already exists' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      // status defaults to "pending" per the schema
      // role is intentionally left null — admin assigns it on approval
    },
  })

  return {
    success: true,
  }
}

/**
 * Authenticates an existing, approved user and writes a session cookie.
 * Redirects to /dashboard on success.
 */
export async function login(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { success: false, error: firstError }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
    },
  })

  // Deliberate: identical error for "not found" and "wrong password" to
  // prevent user enumeration attacks.
  if (!user) {
    return { success: false, error: 'Invalid credentials' }
  }

  if (user.status === 'pending') {
    return { success: false, error: 'Your account is pending approval' }
  }

  if (user.status === 'inactive') {
    return { success: false, error: 'Your account has been deactivated' }
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return { success: false, error: 'Invalid credentials' }
  }

  const session = await getSession()
  session.userId = user.id
  await session.save()

  redirect('/dashboard')
}

/**
 * Destroys the current session and redirects to /login.
 */
export async function logout(): Promise<never> {
  const session = await getSession()
  session.destroy()
  redirect('/login')
}

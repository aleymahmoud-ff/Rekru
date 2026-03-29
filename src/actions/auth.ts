'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { loginSchema, registerSchema } from '@/lib/validations/auth'
import { slugifyOrgName } from '@/lib/validations/auth'

type ActionResult = { success: boolean; error?: string }

/**
 * Registers a new organization with its first admin user.
 * The user is created with status = "active" and role = "admin" since they
 * are bootstrapping their own org — no separate approval step is needed.
 */
export async function register(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    orgName: formData.get('orgName'),
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { success: false, error: firstError }
  }

  const { orgName, fullName, email, password } = parsed.data

  const orgSlug = slugifyOrgName(orgName)

  // Check for slug collision before entering the transaction
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (existingOrg) {
    return { success: false, error: 'An organization with that name already exists' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  let createdOrgId: string
  let createdOrgSlug: string
  let createdUserId: string

  try {
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName, slug: orgSlug },
      })

      const user = await tx.user.create({
        data: {
          orgId: org.id,
          fullName,
          email,
          passwordHash,
          role: 'admin',
          status: 'active',
        },
      })

      return { org, user }
    })

    createdOrgId = result.org.id
    createdOrgSlug = result.org.slug
    createdUserId = result.user.id
  } catch {
    return { success: false, error: 'Registration failed. The email may already be in use.' }
  }

  // Write session immediately so the user lands on their dashboard
  const session = await getSession()
  session.userId = createdUserId
  session.orgId = createdOrgId
  session.orgSlug = createdOrgSlug
  await session.save()

  redirect(`/org/${createdOrgSlug}/dashboard`)
}

/**
 * Authenticates an existing, approved user and writes a session cookie.
 * Redirects to the user's org dashboard on success.
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

  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      orgId: true,
      organization: { select: { slug: true } },
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
  session.orgId = user.orgId
  session.orgSlug = user.organization.slug
  await session.save()

  redirect(`/org/${user.organization.slug}/dashboard`)
}

/**
 * Destroys the current session and redirects to /login.
 */
export async function logout(): Promise<never> {
  const session = await getSession()
  session.destroy()
  redirect('/login')
}

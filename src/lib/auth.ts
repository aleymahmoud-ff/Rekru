import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import type { SessionData, AuthUser } from '@/types/auth'

export const SESSION_OPTIONS = {
  cookieName: 'rekru-session',
  password: process.env.SESSION_SECRET as string,
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
}

/**
 * Returns the iron-session instance for the current request.
 * Must be called inside a Server Action or Route Handler.
 */
export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)
}

/**
 * Reads the current session and fetches the corresponding user from the DB.
 * Returns null if there is no session or the user no longer exists.
 * The password hash is never included in the returned object.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession()

  if (!session.userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
    },
  })

  return user
}

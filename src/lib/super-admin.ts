import { getCurrentUser } from '@/lib/auth'
import type { AuthUser } from '@/types/auth'

export async function requireSuperAdmin(): Promise<{ error: string | null; user: AuthUser | null }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated', user: null }
  if (!user.isSuperAdmin) return { error: 'Super admin access required', user: null }
  return { error: null, user }
}

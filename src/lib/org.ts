import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Returns the org context for the current user, verifying they belong to
 * the org identified by slug. Redirects to /login if not authenticated or
 * if the slug doesn't match the user's org.
 */
export async function getOrgContext(slug: string) {
  const user = await getCurrentUser()
  if (!user || user.orgSlug !== slug) redirect('/login')
  return { orgId: user.orgId, userId: user.id, user }
}

/**
 * Builds an org-scoped path for use in redirects and revalidation tags.
 * Example: orgPath('acme', '/dashboard') → '/org/acme/dashboard'
 */
export function orgPath(slug: string, path: string): string {
  return `/org/${slug}${path}`
}

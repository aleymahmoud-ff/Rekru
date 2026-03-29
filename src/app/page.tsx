import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

// Root page: super admin → /super, tenant user → /{slug}/dashboard
export default async function RootPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.isSuperAdmin) {
    redirect('/super')
  }

  redirect(`/${user.orgSlug}/dashboard`)
}

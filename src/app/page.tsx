import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

// Root page: signed-in users land on the dashboard, everyone else on /login.
export default async function RootPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  redirect('/dashboard')
}

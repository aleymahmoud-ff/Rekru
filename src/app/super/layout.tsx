import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { SuperSidebar } from '@/components/super/super-sidebar'

type Props = {
  children: React.ReactNode
}

export default async function SuperAdminLayout({ children }: Props) {
  const user = await getCurrentUser()

  if (!user || !user.isSuperAdmin) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f8f7f4' }}>
      <SuperSidebar user={user} />

      <div className="flex flex-1 flex-col pl-60">
        <main className="flex-1 px-6 py-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

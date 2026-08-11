import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f8f7f4' }}>
      <Sidebar user={user} />

      {/* Offset for fixed sidebar */}
      <div className="flex flex-1 flex-col pl-60">
        <main className="flex-1 px-6 py-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

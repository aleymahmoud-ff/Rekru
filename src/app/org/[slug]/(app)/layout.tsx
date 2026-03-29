import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'

type Props = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function OrgAppLayout({ children, params }: Props) {
  const { slug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user belongs to this org
  if (user.orgSlug !== slug) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f8f7f4' }}>
      <Sidebar user={user} orgSlug={user.orgSlug} />

      {/* Offset for fixed sidebar */}
      <div className="flex flex-1 flex-col pl-60">
        <main className="flex-1 px-6 py-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

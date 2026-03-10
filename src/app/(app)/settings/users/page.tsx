import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getCurrentUser } from '@/lib/auth'
import { getAllUsers } from '@/actions/settings'
import { UserRow } from '@/components/settings/user-row'

export const metadata: Metadata = {
  title: 'User Management — Rekru',
}

export default async function UsersPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/dashboard')

  const users = await getAllUsers()

  const pending = users.filter((u) => u.status === 'pending')
  const active = users.filter((u) => u.status === 'active')
  const inactive = users.filter((u) => u.status === 'inactive')

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Approve new users and manage access"
      />

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-lg font-semibold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
          >
            Pending Approval ({pending.length})
          </h2>
          <div
            className="rounded-xl border overflow-hidden divide-y"
            style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
          >
            {pending.map((u) => (
              <UserRow key={u.id} userData={u} currentUserId={user.id} />
            ))}
          </div>
        </div>
      )}

      {/* Active users */}
      <div className="mb-8">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
        >
          Active Users ({active.length})
        </h2>
        <div
          className="rounded-xl border overflow-hidden divide-y"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
        >
          {active.map((u) => (
            <UserRow key={u.id} userData={u} currentUserId={user.id} />
          ))}
        </div>
      </div>

      {/* Inactive users */}
      {inactive.length > 0 && (
        <div>
          <h2
            className="text-lg font-semibold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
          >
            Inactive ({inactive.length})
          </h2>
          <div
            className="rounded-xl border overflow-hidden divide-y"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0', opacity: 0.6 }}
          >
            {inactive.map((u) => (
              <UserRow key={u.id} userData={u} currentUserId={user.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

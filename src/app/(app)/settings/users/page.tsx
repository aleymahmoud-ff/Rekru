import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getCurrentUser } from '@/lib/auth'
import { getAllUsers, getActiveStagesBasic } from '@/actions/settings'
import { getJobs } from '@/actions/jobs'
import { UserRow } from '@/components/settings/user-row'
import { CreateUserDialog } from '@/components/settings/create-user-dialog'

export const metadata: Metadata = {
  title: 'User Management — Rekru',
}

export default async function UsersPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/dashboard')

  const [users, allStages, allJobs] = await Promise.all([
    getAllUsers(),
    getActiveStagesBasic(),
    getJobs('open'),
  ])

  const pending = users.filter((u) => u.status === 'pending')
  const active = users.filter((u) => u.status === 'active')
  const inactive = users.filter((u) => u.status === 'inactive')

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Approve new users and manage access"
        action={<CreateUserDialog />}
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
              <UserRow key={u.id} userData={u} currentUserId={user.id} allStages={allStages} allJobs={allJobs.map((j) => ({ id: j.id, title: j.title }))} />
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
            <UserRow key={u.id} userData={u} currentUserId={user.id} allStages={allStages} allJobs={allJobs.map((j) => ({ id: j.id, title: j.title }))} />
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
              <UserRow key={u.id} userData={u} currentUserId={user.id} allStages={allStages} allJobs={allJobs.map((j) => ({ id: j.id, title: j.title }))} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

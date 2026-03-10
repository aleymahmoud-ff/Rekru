'use client'

import { useTransition } from 'react'
import { approveUser, updateUserStatus } from '@/actions/settings'
import { UserAccessDialog } from '@/components/settings/user-access-dialog'

type Stage = { id: string; name: string }
type Job = { id: string; title: string }

type UserData = {
  id: string
  fullName: string
  email: string
  role: string | null
  status: string
  createdAt: Date
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  pending: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  active: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  inactive: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

export function UserRow({ userData, currentUserId, allStages, allJobs }: { userData: UserData; currentUserId: string; allStages: Stage[]; allJobs: Job[] }) {
  const [isPending, startTransition] = useTransition()
  const isSelf = userData.id === currentUserId
  const st = STATUS_STYLES[userData.status] ?? STATUS_STYLES.active

  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}>
            {userData.fullName}
          </p>
          {isSelf && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ color: '#3b82f6', backgroundColor: '#eff6ff' }}
            >
              You
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
          {userData.email} · {userData.role ?? 'No role'} · Joined {new Date(userData.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
          style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}
        >
          {userData.status.charAt(0).toUpperCase() + userData.status.slice(1)}
        </span>

        {/* Access management button for non-admin active users */}
        {userData.role !== 'admin' && userData.status === 'active' && (
          <UserAccessDialog
            userId={userData.id}
            userName={userData.fullName}
            allStages={allStages}
            allJobs={allJobs}
          />
        )}

        {userData.status === 'pending' && (
          <div className="flex gap-1.5">
            <button
              disabled={isPending}
              onClick={() => startTransition(async () => { await approveUser({ userId: userData.id, role: 'user' }) })}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#059669', fontFamily: 'var(--font-body)' }}
            >
              Approve as User
            </button>
            <button
              disabled={isPending}
              onClick={() => startTransition(async () => { await approveUser({ userId: userData.id, role: 'admin' }) })}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
            >
              Approve as Admin
            </button>
          </div>
        )}

        {userData.status === 'active' && !isSelf && (
          <button
            disabled={isPending}
            onClick={() => startTransition(async () => { await updateUserStatus({ userId: userData.id, status: 'inactive' }) })}
            className="rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-red-50 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#dc2626' }}
          >
            Deactivate
          </button>
        )}

        {userData.status === 'inactive' && (
          <button
            disabled={isPending}
            onClick={() => startTransition(async () => { await updateUserStatus({ userId: userData.id, status: 'active' }) })}
            className="rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-green-50 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#059669' }}
          >
            Reactivate
          </button>
        )}
      </div>
    </div>
  )
}

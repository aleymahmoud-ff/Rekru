'use client'

import { useState, useTransition } from 'react'
import { getJobAssignedUsers, setJobAssignments } from '@/actions/settings'
import { Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type User = { id: string; fullName: string; email: string }

type Props = {
  jobId: string
  jobTitle: string
  allUsers: User[]
}

export function ManageTeamDialog({ jobId, jobTitle, allUsers }: Props) {
  const [open, setOpen] = useState(false)
  const [userIds, setUserIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleOpen() {
    setOpen(true)
    if (!loaded) {
      startTransition(async () => {
        const users = await getJobAssignedUsers(jobId)
        setUserIds(new Set(users.map((u) => u.id)))
        setLoaded(true)
      })
    }
  }

  function toggleUser(id: string) {
    setUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await setJobAssignments({ jobId, userIds: Array.from(userIds) })
      if (result.success) setOpen(false)
      else setError(result.error ?? 'Failed to save')
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#faf9f7]"
        style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#6b6560' }}
      >
        <Users className="h-4 w-4" />
        Team
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>
              Assign Team: {jobTitle}
            </DialogTitle>
          </DialogHeader>

          {!loaded && isPending ? (
            <p className="text-sm py-4 text-center" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
              Loading...
            </p>
          ) : (
            <div className="space-y-4 mt-2">
              <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
                Select users who can see and work on this job.
              </p>

              {allUsers.length === 0 ? (
                <p className="text-sm" style={{ color: '#9c9690' }}>No users available</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {allUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-[#faf9f7] transition-colors"
                      style={{ borderColor: '#e8e5e0' }}
                    >
                      <input
                        type="checkbox"
                        checked={userIds.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: '#1e3a5f' }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}>
                          {u.fullName}
                        </p>
                        <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                          {u.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
              )}

              <button
                disabled={isPending}
                onClick={handleSave}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
              >
                {isPending ? 'Saving...' : 'Save Team'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

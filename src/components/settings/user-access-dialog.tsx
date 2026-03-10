'use client'

import { useState, useTransition } from 'react'
import { getUserAccess, setUserAccess } from '@/actions/settings'
import { Shield } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Stage = { id: string; name: string }
type Job = { id: string; title: string }

type Props = {
  userId: string
  userName: string
  allStages: Stage[]
  allJobs: Job[]
}

export function UserAccessDialog({ userId, userName, allStages, allJobs }: Props) {
  const [open, setOpen] = useState(false)
  const [stageIds, setStageIds] = useState<Set<string>>(new Set())
  const [jobIds, setJobIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleOpen() {
    setOpen(true)
    if (!loaded) {
      startTransition(async () => {
        const access = await getUserAccess(userId)
        setStageIds(new Set(access.stageIds))
        setJobIds(new Set(access.jobIds))
        setLoaded(true)
      })
    }
  }

  function toggleStage(id: string) {
    setStageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleJob(id: string) {
    setJobIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await setUserAccess({
        userId,
        stageIds: Array.from(stageIds),
        jobIds: Array.from(jobIds),
      })
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error ?? 'Failed to save')
      }
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[#f0eeeb]"
        style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#1e3a5f' }}
      >
        <Shield className="h-3 w-3 inline mr-1" />
        Access
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>
              Access: {userName}
            </DialogTitle>
          </DialogHeader>

          {!loaded && isPending ? (
            <p className="text-sm py-4 text-center" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
              Loading...
            </p>
          ) : (
            <div className="space-y-5 mt-2">
              {/* Stage access */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                  Interview Stages
                </p>
                {allStages.length === 0 ? (
                  <p className="text-sm" style={{ color: '#9c9690' }}>No active stages</p>
                ) : (
                  <div className="space-y-1.5">
                    {allStages.map((stage) => (
                      <label
                        key={stage.id}
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer hover:bg-[#faf9f7] transition-colors"
                        style={{ borderColor: '#e8e5e0' }}
                      >
                        <input
                          type="checkbox"
                          checked={stageIds.has(stage.id)}
                          onChange={() => toggleStage(stage.id)}
                          className="h-4 w-4 rounded"
                          style={{ accentColor: '#1e3a5f' }}
                        />
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}>
                          {stage.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Job assignments */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                  Job Assignments
                </p>
                {allJobs.length === 0 ? (
                  <p className="text-sm" style={{ color: '#9c9690' }}>No open jobs</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {allJobs.map((job) => (
                      <label
                        key={job.id}
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer hover:bg-[#faf9f7] transition-colors"
                        style={{ borderColor: '#e8e5e0' }}
                      >
                        <input
                          type="checkbox"
                          checked={jobIds.has(job.id)}
                          onChange={() => toggleJob(job.id)}
                          className="h-4 w-4 rounded"
                          style={{ accentColor: '#1e3a5f' }}
                        />
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}>
                          {job.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
              )}

              <button
                disabled={isPending}
                onClick={handleSave}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
              >
                {isPending ? 'Saving...' : 'Save Access'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useTransition } from 'react'
import { toggleJobStatus } from '@/actions/jobs'

export function JobStatusToggle({
  jobId,
  currentStatus,
}: {
  jobId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await toggleJobStatus(jobId) })}
      className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#faf9f7] disabled:opacity-50"
      style={{
        fontFamily: 'var(--font-body)',
        borderColor: '#e8e5e0',
        color: '#6b6560',
      }}
    >
      {isPending ? 'Updating...' : currentStatus === 'open' ? 'Close Job' : 'Reopen Job'}
    </button>
  )
}

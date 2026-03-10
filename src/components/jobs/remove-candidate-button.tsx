'use client'

import { useTransition } from 'react'
import { removeJobCandidate } from '@/actions/candidates'
import { UserMinus } from 'lucide-react'

export function RemoveCandidateButton({
  jobCandidateId,
  jobId,
  candidateName,
}: {
  jobCandidateId: string
  jobId: string
  candidateName: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Remove "${candidateName}" from this job? Their interview history for this job will be deleted.`)) return
        startTransition(async () => {
          await removeJobCandidate(jobCandidateId, jobId)
        })
      }}
      className="p-1.5 rounded-md transition-colors hover:bg-red-50 disabled:opacity-40"
      title="Remove candidate from this job"
    >
      <UserMinus className="h-3.5 w-3.5" style={{ color: '#dc2626' }} />
    </button>
  )
}

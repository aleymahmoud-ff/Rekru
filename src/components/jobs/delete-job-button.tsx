'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteJob } from '@/actions/jobs'
import { Trash2 } from 'lucide-react'

export function DeleteJobButton({
  jobId,
  jobTitle,
  candidateCount,
  variant = 'icon',
}: {
  jobId: string
  jobTitle: string
  candidateCount: number
  variant?: 'icon' | 'button'
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (candidateCount > 0) {
      setError(`Cannot delete: ${candidateCount} candidate${candidateCount !== 1 ? 's' : ''} linked`)
      return
    }
    if (!confirm(`Delete job "${jobTitle}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteJob(jobId)
      if (result.success) {
        router.push('/jobs')
      } else {
        setError(result.error ?? 'Failed to delete')
      }
    })
  }

  if (variant === 'button') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          disabled={isPending || candidateCount > 0}
          onClick={handleDelete}
          title={candidateCount > 0 ? `Cannot delete: ${candidateCount} candidate${candidateCount !== 1 ? 's' : ''} linked` : 'Delete job'}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-body)', borderColor: '#fecaca', color: '#dc2626' }}
        >
          <Trash2 className="h-4 w-4" />
          {isPending ? 'Deleting...' : 'Delete'}
        </button>
        {error && <p className="text-xs text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <button
        disabled={isPending || candidateCount > 0}
        onClick={handleDelete}
        title={candidateCount > 0 ? `Cannot delete: ${candidateCount} candidate${candidateCount !== 1 ? 's' : ''} linked` : 'Delete job'}
        className="p-1.5 rounded-md transition-colors hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-3.5 w-3.5" style={{ color: '#dc2626' }} />
      </button>
      {error && <p className="text-xs text-red-600 mt-1" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>}
    </div>
  )
}

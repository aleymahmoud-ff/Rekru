'use client'

import { useTransition } from 'react'
import { updateStage, deleteStage } from '@/actions/settings'
import { Trash2, Eye, EyeOff } from 'lucide-react'

type Stage = {
  id: string
  name: string
  isActive: boolean
  _count: { jobCandidates: number }
}

export function StageActions({ stage }: { stage: Stage }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => { await updateStage({ id: stage.id, isActive: !stage.isActive }) })
        }
        className="p-1.5 rounded-md transition-colors hover:bg-[#f3f2ef]"
        title={stage.isActive ? 'Deactivate' : 'Activate'}
      >
        {stage.isActive ? (
          <Eye className="h-3.5 w-3.5" style={{ color: '#6b6560' }} />
        ) : (
          <EyeOff className="h-3.5 w-3.5" style={{ color: '#9c9690' }} />
        )}
      </button>
      {stage._count.jobCandidates === 0 && (
        <button
          disabled={isPending}
          onClick={() => {
            if (confirm(`Delete stage "${stage.name}"?`)) {
              startTransition(async () => { await deleteStage(stage.id) })
            }
          }}
          className="p-1.5 rounded-md transition-colors hover:bg-red-50"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" style={{ color: '#dc2626' }} />
        </button>
      )}
    </div>
  )
}

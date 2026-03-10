'use client'

import { useActionState } from 'react'
import { createStage } from '@/actions/settings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateStageForm({ nextOrder }: { nextOrder: number }) {
  const [state, formAction, isPending] = useActionState(createStage, { success: false })

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>Stage Name</Label>
        <Input name="name" placeholder="e.g. Technical Interview" required style={{ fontFamily: 'var(--font-body)' }} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>Sort Order</Label>
        <Input name="sortOrder" type="number" defaultValue={nextOrder} required style={{ fontFamily: 'var(--font-body)' }} />
      </div>
      {state.error && (
        <p className="text-xs text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{state.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
      >
        {isPending ? 'Adding...' : 'Add Stage'}
      </button>
    </form>
  )
}

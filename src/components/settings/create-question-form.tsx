'use client'

import { useActionState } from 'react'
import { createQuestion } from '@/actions/settings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateQuestionForm({ stageId, nextOrder }: { stageId: string; nextOrder: number }) {
  const [state, formAction, isPending] = useActionState(createQuestion, { success: false })

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="stageId" value={stageId} />
      <div className="space-y-1.5">
        <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>Question Text</Label>
        <Input name="questionText" placeholder="e.g. Communication Skills" required style={{ fontFamily: 'var(--font-body)' }} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>Sort Order</Label>
        <Input name="sortOrder" type="number" defaultValue={nextOrder} required style={{ fontFamily: 'var(--font-body)' }} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>Scope</Label>
        <select
          name="scope"
          defaultValue="universal"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
          style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#1a1a1a' }}
        >
          <option value="universal">Universal — asked for all jobs</option>
          <option value="job_specific">Job-specific — selected per job</option>
        </select>
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
        {isPending ? 'Adding...' : 'Add Question'}
      </button>
    </form>
  )
}

'use client'

import { useActionState, useTransition } from 'react'
import { createOption, deleteQuestion, deleteOption, updateQuestion } from '@/actions/settings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Eye, EyeOff, Plus } from 'lucide-react'

type Option = { id: string; label: string; value: number; sortOrder: number }
type Question = {
  id: string
  questionText: string
  sortOrder: number
  isActive: boolean
  options: Option[]
}

export function QuestionCard({ question, stageId }: { question: Question; stageId: string }) {
  const [isPending, startTransition] = useTransition()
  const [optionState, optionAction, isAddingOption] = useActionState(createOption, { success: false })

  return (
    <div
      className="rounded-xl border bg-white overflow-hidden"
      style={{ borderColor: '#e8e5e0', opacity: question.isActive ? 1 : 0.5 }}
    >
      {/* Question header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: '#e8e5e0' }}>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium"
            style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
          >
            {question.questionText}
          </p>
          <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
            Order: {question.sortOrder} · {question.options.length} option{question.options.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => { await updateQuestion({ id: question.id, isActive: !question.isActive }) })
            }
            className="p-1.5 rounded-md transition-colors hover:bg-[#f3f2ef]"
          >
            {question.isActive ? (
              <Eye className="h-3.5 w-3.5" style={{ color: '#6b6560' }} />
            ) : (
              <EyeOff className="h-3.5 w-3.5" style={{ color: '#9c9690' }} />
            )}
          </button>
          <button
            disabled={isPending}
            onClick={() => {
              if (confirm('Delete this question and all its options?')) {
                startTransition(async () => {
                  await deleteQuestion(question.id)
                  window.location.reload()
                })
              }
            }}
            className="p-1.5 rounded-md transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" style={{ color: '#dc2626' }} />
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="px-5 py-3 space-y-2">
        {question.options.map((option) => (
          <div
            key={option.id}
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ backgroundColor: '#faf9f7' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded text-xs font-semibold"
                style={{ backgroundColor: '#e8e5e0', color: '#6b6560', fontFamily: 'var(--font-body)' }}
              >
                {option.value}
              </span>
              <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}>
                {option.label}
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm(`Delete option "${option.label}"?`)) {
                  startTransition(async () => {
                    await deleteOption(option.id)
                    window.location.reload()
                  })
                }
              }}
              className="p-1 rounded hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" style={{ color: '#dc2626' }} />
            </button>
          </div>
        ))}

        {/* Add option inline form */}
        <form action={optionAction} className="flex items-end gap-2 pt-2">
          <input type="hidden" name="questionId" value={question.id} />
          <input type="hidden" name="sortOrder" value={question.options.length + 1} />
          <div className="flex-1 space-y-1">
            <Label className="text-[10px]" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>Label</Label>
            <Input name="label" placeholder="Option label" required className="h-8 text-xs" style={{ fontFamily: 'var(--font-body)' }} />
          </div>
          <div className="w-16 space-y-1">
            <Label className="text-[10px]" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>Value</Label>
            <Input name="value" type="number" placeholder="1" required className="h-8 text-xs" style={{ fontFamily: 'var(--font-body)' }} />
          </div>
          <button
            type="submit"
            disabled={isAddingOption}
            className="h-8 px-2.5 rounded-md text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#e8913a' }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </form>
        {optionState.error && (
          <p className="text-xs text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{optionState.error}</p>
        )}
      </div>
    </div>
  )
}

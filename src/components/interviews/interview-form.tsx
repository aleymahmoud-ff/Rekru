'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { conductInterview } from '@/actions/interviews'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Pencil, UserCheck, UserX } from 'lucide-react'

type Question = {
  id: string
  questionText: string
  options: { id: string; label: string; value: number }[]
}

type InitialData = {
  interviewId: string
  outcome: 'pass' | 'fail' | 'on_hold'
  overallNotes: string | null
  answers: { questionId: string; optionId: string; notes: string | null }[]
  conductedAt: Date | string
  interviewer: { fullName: string }
  updatedAt: Date | string | null
  updatedBy: { fullName: string } | null
}

export function InterviewForm({
  stageId,
  jobCandidateId,
  questions,
  initialData,
  redirectTo,
  isFinalStage = false,
  orgSlug,
}: {
  stageId: string
  jobCandidateId: string
  questions: Question[]
  initialData?: InitialData | null
  redirectTo?: string
  isFinalStage?: boolean
  orgSlug?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!initialData

  const [answers, setAnswers] = useState<Record<string, { optionId: string; notes: string }>>(
    () => {
      if (initialData) {
        const map: Record<string, { optionId: string; notes: string }> = {}
        for (const q of questions) {
          const saved = initialData.answers.find((a) => a.questionId === q.id)
          map[q.id] = {
            optionId: saved?.optionId ?? '',
            notes: saved?.notes ?? '',
          }
        }
        return map
      }
      return Object.fromEntries(
        questions.map((q) => [q.id, { optionId: '', notes: '' }])
      )
    }
  )
  const [outcome, setOutcome] = useState<'pass' | 'fail' | 'on_hold' | ''>(
    initialData?.outcome ?? ''
  )
  const [hireDecision, setHireDecision] = useState<boolean | null>(null)
  const [overallNotes, setOverallNotes] = useState(initialData?.overallNotes ?? '')

  const handleSubmit = () => {
    if (!outcome) {
      setError('Please select an outcome')
      return
    }

    if (isFinalStage && hireDecision === null) {
      setError('Please make a hiring decision')
      return
    }

    const unanswered = questions.filter((q) => !answers[q.id]?.optionId)
    if (unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} remaining)`)
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await conductInterview({
        jobCandidateId,
        stageId,
        outcome,
        overallNotes: overallNotes || undefined,
        interviewId: initialData?.interviewId,
        hireDecision: isFinalStage ? (hireDecision ?? undefined) : undefined,
        answers: questions.map((q) => ({
          questionId: q.id,
          optionId: answers[q.id].optionId,
          notes: answers[q.id].notes || undefined,
        })),
      })

      if (result.success) {
        const fallback = orgSlug
          ? `/org/${orgSlug}/interviews/${stageId}`
          : `/interviews/${stageId}`
        router.push(redirectTo ?? fallback)
      } else {
        setError(result.error ?? 'Something went wrong')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Edit badge */}
      {isEdit && initialData.updatedAt && (
        <div
          className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs"
          style={{
            fontFamily: 'var(--font-body)',
            backgroundColor: '#fffbeb',
            borderColor: '#fde68a',
            color: '#92400e',
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>
            Last edited by <span className="font-semibold">{initialData.updatedBy?.fullName ?? 'Unknown'}</span>
            {' '}on {new Date(initialData.updatedAt).toLocaleDateString()} at{' '}
            {new Date(initialData.updatedAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      {isEdit && !initialData.updatedAt && (
        <div
          className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs"
          style={{
            fontFamily: 'var(--font-body)',
            backgroundColor: '#eff6ff',
            borderColor: '#bfdbfe',
            color: '#1e40af',
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>
            Originally conducted by <span className="font-semibold">{initialData.interviewer.fullName}</span>
            {' '}on {new Date(initialData.conductedAt).toLocaleDateString()}
            {' — You are editing this interview'}
          </span>
        </div>
      )}

      {/* Questions */}
      {questions.map((question, qi) => (
        <div
          key={question.id}
          className="rounded-xl border bg-white p-6"
          style={{ borderColor: '#e8e5e0' }}
        >
          <p
            className="text-base font-semibold mb-4"
            style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
          >
            {qi + 1}. {question.questionText}
          </p>

          {/* Options as big selectable cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {question.options.map((option) => {
              const selected = answers[question.id]?.optionId === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: { ...prev[question.id], optionId: option.id },
                    }))
                  }
                  className={cn(
                    'rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all duration-150',
                    selected
                      ? 'scale-[1.02]'
                      : 'hover:bg-[#faf9f7]'
                  )}
                  style={{
                    fontFamily: 'var(--font-body)',
                    borderColor: selected ? '#e8913a' : '#e8e5e0',
                    backgroundColor: selected ? '#fef6ee' : '#ffffff',
                    color: selected ? '#e8913a' : '#6b6560',
                  }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          {/* Per-question notes */}
          <div className="space-y-1.5">
            <Label
              className="text-xs"
              style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
            >
              Notes (optional)
            </Label>
            <Textarea
              rows={2}
              placeholder="Add notes for this question..."
              value={answers[question.id]?.notes ?? ''}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [question.id]: { ...prev[question.id], notes: e.target.value },
                }))
              }
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
        </div>
      ))}

      {/* Overall notes */}
      <div
        className="rounded-xl border bg-white p-6"
        style={{ borderColor: '#e8e5e0' }}
      >
        <Label
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
        >
          Overall Notes (optional)
        </Label>
        <Textarea
          rows={3}
          className="mt-3"
          placeholder="General observations about the candidate..."
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>

      {/* Outcome */}
      <div
        className="rounded-xl border bg-white p-6"
        style={{ borderColor: '#e8e5e0' }}
      >
        <p
          className="text-base font-semibold mb-4"
          style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
        >
          Interview Outcome
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'pass' as const, label: 'Pass', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
            { value: 'fail' as const, label: 'Fail', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            { value: 'on_hold' as const, label: 'On Hold', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
          ].map((o) => {
            const selected = outcome === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setOutcome(o.value)}
                className="rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all duration-150"
                style={{
                  fontFamily: 'var(--font-body)',
                  borderColor: selected ? o.color : '#e8e5e0',
                  backgroundColor: selected ? o.bg : '#ffffff',
                  color: selected ? o.color : '#6b6560',
                }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hire decision — always visible on final stage */}
      {isFinalStage && (
        <div
          className="rounded-xl border bg-white p-6"
          style={{ borderColor: '#e8e5e0' }}
        >
          <p
            className="text-base font-semibold mb-4"
            style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
          >
            Hire this candidate?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setHireDecision(true)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all duration-150'
              )}
              style={{
                fontFamily: 'var(--font-body)',
                borderColor: hireDecision === true ? '#059669' : '#e8e5e0',
                backgroundColor: hireDecision === true ? '#ecfdf5' : '#ffffff',
                color: hireDecision === true ? '#059669' : '#6b6560',
              }}
            >
              <UserCheck className="h-4 w-4" />
              Yes, Hire
            </button>
            <button
              type="button"
              onClick={() => setHireDecision(false)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all duration-150'
              )}
              style={{
                fontFamily: 'var(--font-body)',
                borderColor: hireDecision === false ? '#9c9690' : '#e8e5e0',
                backgroundColor: hireDecision === false ? '#f5f5f4' : '#ffffff',
                color: hireDecision === false ? '#1a1a1a' : '#6b6560',
              }}
            >
              <UserX className="h-4 w-4" />
              Not Yet
            </button>
          </div>
        </div>
      )}

      {/* Error + Submit */}
      {error && (
        <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-[#faf9f7]"
          style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#6b6560' }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleSubmit}
          className="flex-1 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
        >
          {isPending
            ? (isEdit ? 'Saving...' : 'Submitting...')
            : (isEdit ? 'Save Changes' : 'Submit Interview')
          }
        </button>
      </div>
    </div>
  )
}

'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createJob, linkJobQuestions } from '@/actions/jobs'
import { Plus, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type JobSpecificQuestion = { id: string; questionText: string; sortOrder: number }
type QuestionsByStage = { stage: { id: string; name: string; sortOrder: number }; questions: JobSpecificQuestion[] }[]

export function CreateJobDialog({ jobSpecificQuestions }: { jobSpecificQuestions: QuestionsByStage }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [jobId, setJobId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [linkError, setLinkError] = useState<string | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(
    async (prev: { success: boolean; error?: string; id?: string }, formData: FormData) => {
      const result = await createJob(prev, formData)
      if (result.success && result.id) {
        if (jobSpecificQuestions.length > 0) {
          setJobId(result.id)
          setSelected(new Set())
          setStep(2)
        } else {
          setOpen(false)
          router.push(`/jobs/${result.id}`)
        }
      }
      return result
    },
    { success: false }
  )

  function toggleQuestion(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function handleLinkAndFinish() {
    if (!jobId) return
    setIsLinking(true)
    setLinkError(null)
    const result = await linkJobQuestions({ jobId, questionIds: Array.from(selected) })
    setIsLinking(false)
    if (!result.success) { setLinkError(result.error ?? 'Failed to save questions'); return }
    setOpen(false)
    router.push(`/jobs/${jobId}`)
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) { setStep(1); setJobId(null); setSelected(new Set()); setLinkError(null) }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
          />
        }
      >
        <Plus className="h-4 w-4" />
        New Job
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>
            {step === 1 ? 'Create New Job' : 'Job-specific Questions'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <form action={formAction} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="title" style={{ fontFamily: 'var(--font-body)' }}>Job Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Senior Developer"
                required
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" style={{ fontFamily: 'var(--font-body)' }}>
                Description <span style={{ color: '#9c9690', fontWeight: 400 }}>(optional)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Job description..."
                rows={3}
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
            {state.error && (
              <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
            >
              {isPending
                ? 'Creating...'
                : jobSpecificQuestions.length > 0
                  ? 'Next: Select Questions →'
                  : 'Create Job'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-2">
            <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
              Select which job-specific questions apply to this role. Universal questions are always included.
            </p>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {jobSpecificQuestions.map(({ stage, questions }) => (
                <div key={stage.id}>
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                  >
                    {stage.name}
                  </p>
                  <div className="space-y-1.5">
                    {questions.map((q) => (
                      <label
                        key={q.id}
                        className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors"
                        style={{
                          borderColor: selected.has(q.id) ? '#e8913a' : '#e8e5e0',
                          backgroundColor: selected.has(q.id) ? '#fdf3e7' : '#faf9f7',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(q.id)}
                          onChange={() => toggleQuestion(q.id)}
                          className="mt-0.5 accent-[#e8913a]"
                        />
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}>
                          {q.questionText}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {linkError && (
              <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{linkError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                disabled={isLinking}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#f3f2ef] disabled:opacity-50"
                style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                onClick={handleLinkAndFinish}
                disabled={isLinking}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
              >
                {isLinking ? 'Saving...' : `Create Job${selected.size > 0 ? ` with ${selected.size} question${selected.size !== 1 ? 's' : ''}` : ''}`}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

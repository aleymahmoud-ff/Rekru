'use client'

import { useActionState, useState } from 'react'
import { updateJob } from '@/actions/jobs'
import { Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Job = { id: string; title: string; description: string | null }

export function EditJobDialog({ job, variant = 'icon' }: { job: Job; variant?: 'icon' | 'button' }) {
  const [open, setOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (prev: { success: boolean; error?: string; id?: string }, formData: FormData) => {
      const result = await updateJob({
        id: job.id,
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || undefined,
      })
      if (result.success) setOpen(false)
      return result
    },
    { success: false }
  )

  return (
    <>
      {variant === 'button' ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#faf9f7]"
          style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#6b6560' }}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(true) }}
          className="p-1.5 rounded-md transition-colors hover:bg-[#f3f2ef]"
          title="Edit job"
        >
          <Pencil className="h-3.5 w-3.5" style={{ color: '#6b6560' }} />
        </button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Edit Job</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-title" style={{ fontFamily: 'var(--font-body)' }}>Job Title</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={job.title}
              required
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description" style={{ fontFamily: 'var(--font-body)' }}>
              Description <span style={{ color: '#9c9690', fontWeight: 400 }}>(optional)</span>
            </Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={job.description ?? ''}
              rows={3}
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          {state.error && (
            <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{state.error}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </DialogContent>
      </Dialog>
    </>
  )
}

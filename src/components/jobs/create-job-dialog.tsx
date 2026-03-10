'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createJob } from '@/actions/jobs'
import { Plus } from 'lucide-react'
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

export function CreateJobDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(
    async (prev: { success: boolean; error?: string; id?: string }, formData: FormData) => {
      const result = await createJob(prev, formData)
      if (result.success && result.id) {
        setOpen(false)
        router.push(`/jobs/${result.id}`)
      }
      return result
    },
    { success: false }
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Create New Job</DialogTitle>
        </DialogHeader>
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
              Description <span className="text-[#9c9690] font-normal">(optional)</span>
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
            {isPending ? 'Creating...' : 'Create Job'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

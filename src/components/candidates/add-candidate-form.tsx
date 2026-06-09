'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { addCandidateToJob } from '@/actions/candidates'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AddCandidateForm({ jobId }: { jobId: string }) {
  const router = useRouter()
  const boundAction = addCandidateToJob.bind(null, jobId)

  const [state, formAction, isPending] = useActionState(
    async (prev: { success: boolean; error?: string }, formData: FormData) => {
      const result = await boundAction(prev, formData)
      if (result.success) {
        router.push(`/jobs/${jobId}`)
      }
      return result
    },
    { success: false }
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" style={{ fontFamily: 'var(--font-body)' }}>Full Name</Label>
        <Input id="fullName" name="fullName" placeholder="Ahmed Mohamed" required style={{ fontFamily: 'var(--font-body)' }} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" style={{ fontFamily: 'var(--font-body)' }}>Email</Label>
        <Input id="email" name="email" type="email" placeholder="ahmed@example.com" required style={{ fontFamily: 'var(--font-body)' }} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" style={{ fontFamily: 'var(--font-body)' }}>Phone</Label>
        <Input id="phone" name="phone" placeholder="+20 xxx xxx xxxx" required style={{ fontFamily: 'var(--font-body)' }} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cv" style={{ fontFamily: 'var(--font-body)' }}>
          CV <span className="text-[#9c9690] font-normal">(optional · PDF or Word, max 8 MB)</span>
        </Label>
        <Input
          id="cv"
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx"
          className="file:mr-3 file:rounded-md file:border-0 file:bg-[#f0eeeb] file:px-3 file:py-1 file:text-sm file:text-[#1e3a5f] hover:file:bg-[#e8e5e0]"
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{state.error}</p>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#faf9f7]"
          style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#6b6560' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
        >
          {isPending ? 'Adding...' : 'Add Candidate'}
        </button>
      </div>
    </form>
  )
}

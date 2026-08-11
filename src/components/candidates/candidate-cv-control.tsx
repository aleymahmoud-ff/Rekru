'use client'

import { useActionState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2 } from 'lucide-react'
import { uploadCandidateCv } from '@/actions/candidates'
import { CvViewLink } from '@/components/candidates/cv-view-link'

interface CandidateCvControlProps {
  candidateId: string
  jobId: string
  /** Resolved signed/external URL for an existing CV, or null. */
  cvUrl: string | null
  /** Whether the CV renders inline (self-hosted PDF) or opens in a new tab. */
  cvPreviewable: boolean
  /** Candidate name, used as the inline viewer's title. */
  candidateName: string
  /** Whether CV storage is configured on the server. */
  uploadEnabled: boolean
}

export function CandidateCvControl({
  candidateId,
  jobId,
  cvUrl,
  cvPreviewable,
  candidateName,
  uploadEnabled,
}: CandidateCvControlProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, isPending] = useActionState(
    async (prev: { success: boolean; error?: string }, formData: FormData) => {
      const result = await uploadCandidateCv(candidateId, jobId, prev, formData)
      if (result.success) router.refresh()
      return result
    },
    { success: false }
  )

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      {cvUrl && (
        <CvViewLink
          url={cvUrl}
          title={`${candidateName} — CV`}
          canPreview={cvPreviewable}
          className="text-xs font-medium"
        />
      )}

      {uploadEnabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            name="cv"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={() => formRef.current?.requestSubmit()}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-[#f0eeeb] disabled:opacity-50"
            style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
            title={cvUrl ? 'Replace CV' : 'Upload CV'}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {cvUrl ? 'Replace' : 'Upload CV'}
          </button>
        </>
      )}

      {state.error && (
        <span className="text-xs text-red-600" style={{ fontFamily: 'var(--font-body)' }}>
          {state.error}
        </span>
      )}
    </form>
  )
}

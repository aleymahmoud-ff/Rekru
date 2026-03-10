import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getJobWithCandidates } from '@/actions/jobs'
import { Plus, Pencil } from 'lucide-react'
import { JobStatusToggle } from '@/components/jobs/job-status-toggle'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const job = await getJobWithCandidates(id)
  return { title: job ? `${job.title} — Rekru` : 'Job Not Found' }
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  active: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  hired: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  rejected: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  on_hold: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
}

const OUTCOME_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pass: { label: 'Pass', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  fail: { label: 'Fail', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  on_hold: { label: 'On Hold', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const job = await getJobWithCandidates(id)

  if (!job) notFound()

  return (
    <div>
      <PageHeader
        title={job.title}
        description={job.description || `Created by ${job.createdBy.fullName} · ${new Date(job.createdAt).toLocaleDateString()}`}
        action={
          <div className="flex items-center gap-3">
            <JobStatusToggle jobId={job.id} currentStatus={job.status} />
            {job.status === 'open' && (
              <Link
                href={`/jobs/${job.id}/candidates/new`}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
              >
                <Plus className="h-4 w-4" />
                Add Candidate
              </Link>
            )}
          </div>
        }
      />

      {job.jobCandidates.length === 0 ? (
        <div
          className="rounded-xl border p-12 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
        >
          <p
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
          >
            No candidates yet
          </p>
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
          >
            Add candidates to start the interview process
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {job.jobCandidates.map((jc) => {
            const st = STATUS_STYLES[jc.status] ?? STATUS_STYLES.active
            return (
              <div
                key={jc.id}
                className="rounded-xl border bg-white overflow-hidden"
                style={{ borderColor: '#e8e5e0' }}
              >
                {/* Candidate header row */}
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #e8e5e0' }}>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                    >
                      {jc.candidate.fullName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                      {jc.candidate.email} · {jc.candidate.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
                      {jc.currentStage?.name ?? (jc.status === 'hired' ? 'Completed' : '—')}
                    </p>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
                      style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}
                    >
                      {jc.status === 'on_hold' ? 'On Hold' : jc.status.charAt(0).toUpperCase() + jc.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Interview history */}
                {jc.interviews.length > 0 && (
                  <div className="px-5 py-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                      Interviews
                    </p>
                    {jc.interviews.map((interview) => {
                      const os = OUTCOME_STYLES[interview.outcome] ?? OUTCOME_STYLES.on_hold
                      return (
                        <div
                          key={interview.id}
                          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#faf9f7] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border shrink-0"
                              style={{ color: os.color, backgroundColor: os.bg, borderColor: os.border }}
                            >
                              {os.label}
                            </span>
                            <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
                              {interview.stage.name}
                            </p>
                            <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                              {new Date(interview.conductedAt).toLocaleDateString()}
                            </p>
                            {interview.updatedAt && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
                                style={{ color: '#92400e', backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
                              >
                                <Pencil className="h-2.5 w-2.5" />
                                Edited{interview.updatedBy ? ` by ${interview.updatedBy.fullName}` : ''}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/interviews/edit/${interview.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[#f0eeeb] shrink-0"
                            style={{ fontFamily: 'var(--font-body)', color: '#e8913a' }}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getJobWithCandidates } from '@/actions/jobs'
import { Plus, ArrowRight } from 'lucide-react'
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
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e5e0' }}>
                {['Candidate', 'Email', 'Phone', 'Current Stage', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#e8e5e0' }}>
              {job.jobCandidates.map((jc) => {
                const st = STATUS_STYLES[jc.status] ?? STATUS_STYLES.active
                return (
                  <tr key={jc.id} className="hover:bg-[#faf9f7] transition-colors">
                    <td className="px-5 py-3.5">
                      <p
                        className="text-sm font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                      >
                        {jc.candidate.fullName}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
                        {jc.candidate.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
                        {jc.candidate.phone}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
                        {jc.currentStage?.name ?? (jc.status === 'hired' ? 'Completed' : '—')}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
                        style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}
                      >
                        {jc.status === 'on_hold' ? 'On Hold' : jc.status.charAt(0).toUpperCase() + jc.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

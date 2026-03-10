import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { getJobs } from '@/actions/jobs'
import { getJobSpecificQuestions } from '@/actions/settings'
import { Briefcase, ChevronRight } from 'lucide-react'
import { CreateJobDialog } from '@/components/jobs/create-job-dialog'
import { EditJobDialog } from '@/components/jobs/edit-job-dialog'
import { DeleteJobButton } from '@/components/jobs/delete-job-button'

export const metadata: Metadata = {
  title: 'Jobs — Rekru',
}

type Props = {
  searchParams: Promise<{ status?: string; sub?: string }>
}

export default async function JobsPage({ searchParams }: Props) {
  const { status, sub } = await searchParams
  const tab = status === 'closed' ? 'closed' : 'open'
  const closedSub = sub === 'pending' ? 'pending' : sub === 'completed' ? 'completed' : 'all'

  const [allJobs, jobSpecificQuestions] = await Promise.all([
    getJobs(tab),
    getJobSpecificQuestions(),
  ])

  // For closed tab, derive completed/pending from hired candidate presence
  const jobs = tab === 'closed' && closedSub !== 'all'
    ? allJobs.filter((j) =>
        closedSub === 'completed' ? j.jobCandidates.length > 0 : j.jobCandidates.length === 0
      )
    : allJobs

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Manage your job openings"
        action={<CreateJobDialog jobSpecificQuestions={jobSpecificQuestions} />}
      />

      {/* Main tab switcher */}
      <div
        className="flex gap-1 mb-4 p-1 rounded-lg w-fit"
        style={{ backgroundColor: '#f3f2ef' }}
      >
        <Link
          href="/jobs"
          className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={
            tab === 'open'
              ? { backgroundColor: '#ffffff', color: '#1a1a1a', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontFamily: 'var(--font-body)' }
              : { color: '#6b6560', fontFamily: 'var(--font-body)' }
          }
        >
          Open
        </Link>
        <Link
          href="/jobs?status=closed"
          className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={
            tab === 'closed'
              ? { backgroundColor: '#ffffff', color: '#1a1a1a', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontFamily: 'var(--font-body)' }
              : { color: '#6b6560', fontFamily: 'var(--font-body)' }
          }
        >
          Closed
        </Link>
      </div>

      {/* Closed sub-filter */}
      {tab === 'closed' && (
        <div className="flex gap-2 mb-5">
          {(['all', 'completed', 'pending'] as const).map((s) => (
            <Link
              key={s}
              href={s === 'all' ? '/jobs?status=closed' : `/jobs?status=closed&sub=${s}`}
              className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
              style={
                closedSub === s
                  ? { backgroundColor: '#1e3a5f', color: '#ffffff', borderColor: '#1e3a5f', fontFamily: 'var(--font-body)' }
                  : { backgroundColor: '#ffffff', color: '#6b6560', borderColor: '#e8e5e0', fontFamily: 'var(--font-body)' }
              }
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>
      )}

      {jobs.length === 0 ? (
        <div
          className="rounded-xl border p-12 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
            style={{ backgroundColor: '#eef2f7' }}
          >
            <Briefcase className="h-6 w-6" style={{ color: '#1e3a5f' }} />
          </div>
          <p
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
          >
            No {tab === 'closed' && closedSub !== 'all' ? closedSub : tab} jobs
          </p>
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
          >
            {tab === 'open' ? 'Create your first job to start adding candidates' : 'No jobs in this category'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => {
            const isCompleted = job.status === 'closed' && job.jobCandidates.length > 0
            const isPending = job.status === 'closed' && job.jobCandidates.length === 0

            const statusBadge =
              job.status === 'open'
                ? { label: 'Open', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' }
                : isCompleted
                ? { label: 'Completed', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' }
                : isPending
                ? { label: 'Pending', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
                : { label: 'Closed', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' }

            return (
              <div
                key={job.id}
                className="flex items-center rounded-xl border bg-white transition-all duration-200 hover:shadow-md"
                style={{ borderColor: '#e8e5e0' }}
              >
                <Link
                  href={`/jobs/${job.id}`}
                  className="group flex items-center justify-between flex-1 min-w-0 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p
                        className="text-base font-semibold truncate"
                        style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                      >
                        {job.title}
                      </p>
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border shrink-0"
                        style={{ color: statusBadge.color, backgroundColor: statusBadge.bg, borderColor: statusBadge.border }}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <p
                      className="text-xs"
                      style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                    >
                      {job._count.jobCandidates} candidate{job._count.jobCandidates !== 1 ? 's' : ''} · Created by {job.createdBy.fullName} · {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 ml-4"
                    style={{ color: '#9c9690' }}
                  />
                </Link>
                <div className="flex items-center gap-1 pr-3 shrink-0">
                  <EditJobDialog job={job} variant="icon" />
                  <DeleteJobButton
                    jobId={job.id}
                    jobTitle={job.title}
                    candidateCount={job._count.jobCandidates}
                    variant="icon"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

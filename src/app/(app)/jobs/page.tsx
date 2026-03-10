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

export default async function JobsPage() {
  const [jobs, jobSpecificQuestions] = await Promise.all([getJobs(), getJobSpecificQuestions()])

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Manage your job openings"
        action={<CreateJobDialog jobSpecificQuestions={jobSpecificQuestions} />}
      />

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
            No jobs yet
          </p>
          <p
            className="text-sm mb-4"
            style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
          >
            Create your first job to start adding candidates
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
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
                      style={
                        job.status === 'open'
                          ? { color: '#059669', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
                          : { color: '#6b7280', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }
                      }
                    >
                      {job.status === 'open' ? 'Open' : 'Closed'}
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
          ))}
        </div>
      )}
    </div>
  )
}

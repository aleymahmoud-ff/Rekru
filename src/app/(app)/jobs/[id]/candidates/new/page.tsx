import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AddCandidateForm } from '@/components/candidates/add-candidate-form'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  title: 'Add Candidate — Rekru',
}

export default async function AddCandidatePage({ params }: Props) {
  const { id } = await params
  const [job, user] = await Promise.all([
    prisma.job.findUnique({ where: { id }, select: { id: true, title: true, status: true } }),
    getCurrentUser(),
  ])

  if (!job) notFound()
  if (job.status === 'closed') notFound()

  // Non-admin must be assigned to this job
  if (user && user.role !== 'admin') {
    const assigned = await prisma.jobAssignment.findUnique({
      where: { userId_jobId: { userId: user.id, jobId: id } },
    })
    if (!assigned) notFound()
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Add Candidate"
        description={`Adding candidate to: ${job.title}`}
      />

      <div
        className="rounded-xl border bg-white p-6"
        style={{ borderColor: '#e8e5e0' }}
      >
        <AddCandidateForm jobId={job.id} />
      </div>
    </div>
  )
}

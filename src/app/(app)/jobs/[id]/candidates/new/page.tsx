import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { prisma } from '@/lib/db'
import { AddCandidateForm } from '@/components/candidates/add-candidate-form'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  title: 'Add Candidate — Rekru',
}

export default async function AddCandidatePage({ params }: Props) {
  const { id } = await params
  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, title: true, status: true },
  })

  if (!job) notFound()
  if (job.status === 'closed') notFound()

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

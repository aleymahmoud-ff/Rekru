import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getInterviewFormData } from '@/actions/interviews'
import { prisma } from '@/lib/db'
import { InterviewForm } from '@/components/interviews/interview-form'

type Props = { params: Promise<{ stageId: string; jobCandidateId: string }> }

export const metadata: Metadata = {
  title: 'Conduct Interview — Rekru',
}

export default async function ConductInterviewPage({ params }: Props) {
  const { stageId, jobCandidateId } = await params

  const [stage, jobCandidate] = await Promise.all([
    getInterviewFormData(stageId),
    prisma.jobCandidate.findUnique({
      where: { id: jobCandidateId },
      include: {
        candidate: { select: { fullName: true, email: true } },
        job: { select: { title: true } },
      },
    }),
  ])

  if (!stage || !jobCandidate) notFound()
  if (jobCandidate.currentStageId !== stageId) notFound()
  if (jobCandidate.status !== 'active') notFound()

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Interview: ${jobCandidate.candidate.fullName}`}
        description={`${stage.name} · ${jobCandidate.job.title}`}
      />

      <InterviewForm
        stageId={stageId}
        jobCandidateId={jobCandidateId}
        questions={stage.questions}
      />
    </div>
  )
}

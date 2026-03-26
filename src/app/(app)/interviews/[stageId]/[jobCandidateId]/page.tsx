import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getInterviewFormData, getExistingInterview } from '@/actions/interviews'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { InterviewForm } from '@/components/interviews/interview-form'
import { CandidateProfileCard } from '@/components/interviews/candidate-profile-card'

type Props = { params: Promise<{ stageId: string; jobCandidateId: string }> }

export const metadata: Metadata = {
  title: 'Conduct Interview — Rekru',
}

export default async function ConductInterviewPage({ params }: Props) {
  const { stageId, jobCandidateId } = await params

  const [jobCandidate, existingInterview, user] = await Promise.all([
    prisma.jobCandidate.findUnique({
      where: { id: jobCandidateId },
      include: {
        candidate: { select: { fullName: true, email: true, phone: true, cvLink: true, createdAt: true } },
        job: { select: { id: true, title: true } },
      },
    }),
    getExistingInterview(jobCandidateId, stageId),
    getCurrentUser(),
  ])

  if (!jobCandidate) notFound()

  // Non-admin: if they have any stage access entries, restrict to only those stages
  if (user && user.role !== 'admin') {
    const [stageAccess, totalAccess] = await Promise.all([
      prisma.userStageAccess.findUnique({
        where: { userId_stageId: { userId: user.id, stageId } },
      }),
      prisma.userStageAccess.count({ where: { userId: user.id } }),
    ])
    if (totalAccess > 0 && !stageAccess) notFound()
  }
  const stage = await getInterviewFormData(stageId, jobCandidate.jobId)

  if (!stage) notFound()
  if (jobCandidate.currentStageId !== stageId) notFound()
  if (jobCandidate.status !== 'active') notFound()

  // Prepare initial data from existing on_hold interview
  const initialData = existingInterview
    ? {
        interviewId: existingInterview.id,
        outcome: existingInterview.outcome as 'pass' | 'fail' | 'on_hold',
        overallNotes: existingInterview.overallNotes,
        answers: existingInterview.answers.map((a) => ({
          questionId: a.question.id,
          optionId: a.option.id,
          notes: a.notes,
        })),
        conductedAt: existingInterview.conductedAt,
        interviewer: existingInterview.interviewer,
        updatedAt: existingInterview.updatedAt,
        updatedBy: existingInterview.updatedBy,
      }
    : null

  return (
    <div>
      <PageHeader
        title={`${existingInterview ? 'Re-interview' : 'Interview'}: ${jobCandidate.candidate.fullName}`}
        description={`${stage.name} · ${jobCandidate.job.title}`}
      />

      <div className="flex gap-6 items-start">
        {/* Interview form — left side */}
        <div className="flex-1 min-w-0">
          <InterviewForm
            stageId={stageId}
            jobCandidateId={jobCandidateId}
            questions={stage.questions}
            initialData={initialData}
          />
        </div>

        {/* Candidate profile — right side (sticky) */}
        <div className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-6">
            <CandidateProfileCard
              candidate={jobCandidate.candidate}
              jobTitle={jobCandidate.job.title}
              stageName={stage.name}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

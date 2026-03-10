import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getInterviewById } from '@/actions/interviews'
import { InterviewForm } from '@/components/interviews/interview-form'

type Props = { params: Promise<{ interviewId: string }> }

export const metadata: Metadata = {
  title: 'Edit Interview — Rekru',
}

export default async function EditInterviewPage({ params }: Props) {
  const { interviewId } = await params

  const interview = await getInterviewById(interviewId)
  if (!interview) notFound()

  const initialData = {
    interviewId: interview.id,
    outcome: interview.outcome as 'pass' | 'fail' | 'on_hold',
    overallNotes: interview.overallNotes,
    answers: interview.answers.map((a) => ({
      questionId: a.question.id,
      optionId: a.option.id,
      notes: a.notes,
    })),
    conductedAt: interview.conductedAt,
    interviewer: interview.interviewer,
    updatedAt: interview.updatedAt,
    updatedBy: interview.updatedBy,
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Edit Interview: ${interview.jobCandidate.candidate.fullName}`}
        description={`${interview.stage.name} · ${interview.jobCandidate.job.title}`}
      />

      <InterviewForm
        stageId={interview.stage.id}
        jobCandidateId={interview.jobCandidate.id}
        questions={interview.stage.questions}
        initialData={initialData}
        redirectTo={`/jobs/${interview.jobCandidate.job.id}`}
      />
    </div>
  )
}

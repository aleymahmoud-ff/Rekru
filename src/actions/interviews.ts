'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { conductInterviewSchema } from '@/lib/validations/interview'

type ActionResult = { success: boolean; error?: string }

export async function conductInterview(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = conductInterviewSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { jobCandidateId, stageId, outcome, overallNotes, answers, interviewId } = parsed.data

  // Verify the job candidate exists
  const jobCandidate = await prisma.jobCandidate.findUnique({
    where: { id: jobCandidateId },
    select: { id: true, currentStageId: true, status: true, jobId: true },
  })

  if (!jobCandidate) return { success: false, error: 'Candidate not found' }

  // --- EDIT MODE ---
  if (interviewId) {
    const existing = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { id: true, outcome: true, jobCandidateId: true, stageId: true },
    })
    if (!existing) return { success: false, error: 'Interview not found' }

    // Delete old answers and create new ones, update interview
    await prisma.$transaction(async (tx) => {
      await tx.interviewAnswer.deleteMany({ where: { interviewId } })
      await tx.interview.update({
        where: { id: interviewId },
        data: {
          outcome: outcome as 'pass' | 'fail' | 'on_hold',
          overallNotes: overallNotes || null,
          updatedAt: new Date(),
          updatedById: user.id,
          answers: {
            create: answers.map((a) => ({
              questionId: a.questionId,
              optionId: a.optionId,
              notes: a.notes || null,
            })),
          },
        },
      })
    })

    // Handle outcome changes if the candidate is still active at this stage
    if (jobCandidate.status === 'active' && jobCandidate.currentStageId === existing.stageId) {
      await handleOutcomeChange(existing.stageId, jobCandidateId, outcome)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/jobs/${jobCandidate.jobId}`)
    revalidatePath('/interviews')
    return { success: true }
  }

  // --- NEW INTERVIEW MODE ---
  if (jobCandidate.status !== 'active') return { success: false, error: 'Candidate is not active in the pipeline' }
  if (jobCandidate.currentStageId !== stageId) return { success: false, error: 'Candidate is not at this stage' }

  // Check for existing interview at this stage
  const existingInterview = await prisma.interview.findUnique({
    where: { jobCandidateId_stageId: { jobCandidateId, stageId } },
  })
  if (existingInterview) {
    if (existingInterview.outcome === 'on_hold') {
      // Allow re-interview: delete the previous on_hold interview and its answers
      await prisma.interview.delete({ where: { id: existingInterview.id } })
    } else {
      return { success: false, error: 'Interview already conducted for this stage' }
    }
  }

  // Create interview with answers
  await prisma.interview.create({
    data: {
      jobCandidateId,
      stageId,
      interviewerId: user.id,
      outcome: outcome as 'pass' | 'fail' | 'on_hold',
      overallNotes: overallNotes || null,
      answers: {
        create: answers.map((a) => ({
          questionId: a.questionId,
          optionId: a.optionId,
          notes: a.notes || null,
        })),
      },
    },
  })

  await handleOutcomeChange(stageId, jobCandidateId, outcome)

  revalidatePath('/dashboard')
  revalidatePath(`/jobs/${jobCandidate.jobId}`)
  revalidatePath('/interviews')
  return { success: true }
}

async function handleOutcomeChange(stageId: string, jobCandidateId: string, outcome: string) {
  if (outcome === 'pass') {
    const currentStage = await prisma.interviewStage.findUnique({
      where: { id: stageId },
      select: { sortOrder: true },
    })

    const nextStage = await prisma.interviewStage.findFirst({
      where: {
        isActive: true,
        sortOrder: { gt: currentStage!.sortOrder },
      },
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    })

    if (nextStage) {
      await prisma.jobCandidate.update({
        where: { id: jobCandidateId },
        data: { currentStageId: nextStage.id },
      })
    } else {
      await prisma.jobCandidate.update({
        where: { id: jobCandidateId },
        data: { status: 'hired', hiredAt: new Date(), currentStageId: null },
      })
    }
  } else if (outcome === 'fail') {
    await prisma.jobCandidate.update({
      where: { id: jobCandidateId },
      data: { status: 'rejected' },
    })
  }
  // on_hold: no change — stays at current stage
}

export async function getCandidatesForStage(stageId: string) {
  const user = await getCurrentUser()
  if (!user) return []

  const jobFilter: Record<string, unknown> = {}
  if (user.role !== 'admin') {
    const assigned = await prisma.jobAssignment.findMany({
      where: { userId: user.id },
      select: { jobId: true },
    })
    jobFilter.jobId = { in: assigned.map((a) => a.jobId) }
  }

  return prisma.jobCandidate.findMany({
    where: { currentStageId: stageId, status: 'active', ...jobFilter },
    include: {
      candidate: true,
      job: { select: { title: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

async function getScopedQuestions(stageId: string, jobId: string) {
  return prisma.stageQuestion.findMany({
    where: {
      stageId,
      isActive: true,
      OR: [
        { scope: 'universal' },
        { jobLinks: { some: { jobId } } },
      ],
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      options: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

export async function getInterviewFormData(stageId: string, jobId: string) {
  const [stage, questions] = await Promise.all([
    prisma.interviewStage.findUnique({
      where: { id: stageId },
      select: { id: true, name: true, sortOrder: true, isActive: true },
    }),
    getScopedQuestions(stageId, jobId),
  ])
  if (!stage) return null
  return { ...stage, questions }
}

export async function getStagesWithCounts() {
  const user = await getCurrentUser()
  if (!user) return []

  let stageWhere: Record<string, unknown> = { isActive: true }
  let candidateWhere: Record<string, unknown> = { status: 'active' }

  if (user.role !== 'admin') {
    const [stageRows, jobRows] = await Promise.all([
      prisma.userStageAccess.findMany({ where: { userId: user.id }, select: { stageId: true } }),
      prisma.jobAssignment.findMany({ where: { userId: user.id }, select: { jobId: true } }),
    ])
    stageWhere = { isActive: true, id: { in: stageRows.map((r) => r.stageId) } }
    candidateWhere = { status: 'active', jobId: { in: jobRows.map((r) => r.jobId) } }
  }

  const stages = await prisma.interviewStage.findMany({
    where: stageWhere,
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { jobCandidates: { where: candidateWhere } },
      },
    },
  })

  return stages.map((s) => ({
    id: s.id,
    name: s.name,
    sortOrder: s.sortOrder,
    candidateCount: s._count.jobCandidates,
  }))
}

export async function getExistingInterview(jobCandidateId: string, stageId: string) {
  const interview = await prisma.interview.findUnique({
    where: { jobCandidateId_stageId: { jobCandidateId, stageId } },
    include: {
      answers: {
        include: {
          question: { select: { id: true } },
          option: { select: { id: true } },
        },
      },
      interviewer: { select: { fullName: true } },
      updatedBy: { select: { fullName: true } },
    },
  })
  return interview
}

export async function getInterviewById(interviewId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      answers: {
        include: {
          question: { select: { id: true } },
          option: { select: { id: true } },
        },
      },
      interviewer: { select: { fullName: true } },
      updatedBy: { select: { fullName: true } },
      jobCandidate: {
        include: {
          candidate: { select: { fullName: true, email: true } },
          job: { select: { id: true, title: true } },
        },
      },
      stage: {
        select: { id: true, name: true, sortOrder: true },
      },
    },
  })
  if (!interview) return null
  const questions = await getScopedQuestions(interview.stage.id, interview.jobCandidate.job.id)
  return { ...interview, questions }
}

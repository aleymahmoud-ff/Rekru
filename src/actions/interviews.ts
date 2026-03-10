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

  const { jobCandidateId, stageId, outcome, overallNotes, answers } = parsed.data

  // Verify the job candidate exists and is at this stage
  const jobCandidate = await prisma.jobCandidate.findUnique({
    where: { id: jobCandidateId },
    select: { id: true, currentStageId: true, status: true, jobId: true },
  })

  if (!jobCandidate) return { success: false, error: 'Candidate not found' }
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

  // Handle outcome
  if (outcome === 'pass') {
    // Find next active stage
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
      // Move to next stage
      await prisma.jobCandidate.update({
        where: { id: jobCandidateId },
        data: { currentStageId: nextStage.id },
      })
    } else {
      // No more stages — hired!
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

  revalidatePath('/dashboard')
  revalidatePath(`/jobs/${jobCandidate.jobId}`)
  revalidatePath('/interviews')
  return { success: true }
}

export async function getCandidatesForStage(stageId: string) {
  return prisma.jobCandidate.findMany({
    where: {
      currentStageId: stageId,
      status: 'active',
    },
    include: {
      candidate: true,
      job: { select: { title: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getInterviewFormData(stageId: string) {
  return prisma.interviewStage.findUnique({
    where: { id: stageId },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          options: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })
}

export async function getStagesWithCounts() {
  const stages = await prisma.interviewStage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          jobCandidates: {
            where: { status: 'active' },
          },
        },
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

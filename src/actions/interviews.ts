'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { orgPath } from '@/lib/org'
import { conductInterviewSchema } from '@/lib/validations/interview'

type ActionResult = { success: boolean; error?: string }

export async function conductInterview(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = conductInterviewSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { jobCandidateId, stageId, outcome, overallNotes, answers, interviewId, hireDecision } = parsed.data

  // Verify the job candidate exists and belongs to the user's org
  const jobCandidate = await prisma.jobCandidate.findUnique({
    where: { id: jobCandidateId },
    select: {
      id: true,
      currentStageId: true,
      status: true,
      jobId: true,
      job: { select: { id: true, orgId: true } },
    },
  })

  if (!jobCandidate) return { success: false, error: 'Candidate not found' }
  if (jobCandidate.job.orgId !== user.orgId) return { success: false, error: 'Candidate not found' }

  // --- EDIT MODE ---
  if (interviewId) {
    const existing = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { id: true, outcome: true, jobCandidateId: true, stageId: true },
    })
    if (!existing) return { success: false, error: 'Interview not found' }

    // The interview must belong to the org-verified job candidate. Without this,
    // a caller could pass their own jobCandidateId with another org's interviewId
    // and overwrite that interview.
    if (existing.jobCandidateId !== jobCandidateId) {
      return { success: false, error: 'Interview not found' }
    }

    // Answers must reference questions/options in scope for this stage + job
    if (!(await answersAreValid(existing.stageId, jobCandidate.jobId, answers))) {
      return { success: false, error: 'Invalid answer selection' }
    }

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
      await handleOutcomeChange(existing.stageId, jobCandidateId, outcome, hireDecision, user.orgId)
    }

    revalidatePath(orgPath(user.orgSlug, '/dashboard'))
    revalidatePath(orgPath(user.orgSlug, `/jobs/${jobCandidate.jobId}`))
    revalidatePath(orgPath(user.orgSlug, '/interviews'))
    return { success: true }
  }

  // --- NEW INTERVIEW MODE ---
  if (jobCandidate.status !== 'active') return { success: false, error: 'Candidate is not active in the pipeline' }
  if (jobCandidate.currentStageId !== stageId) return { success: false, error: 'Candidate is not at this stage' }

  // Answers must reference questions/options in scope for this stage + job
  if (!(await answersAreValid(stageId, jobCandidate.jobId, answers))) {
    return { success: false, error: 'Invalid answer selection' }
  }

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

  await handleOutcomeChange(stageId, jobCandidateId, outcome, hireDecision, user.orgId)

  revalidatePath(orgPath(user.orgSlug, '/dashboard'))
  revalidatePath(orgPath(user.orgSlug, `/jobs/${jobCandidate.jobId}`))
  revalidatePath(orgPath(user.orgSlug, '/interviews'))
  return { success: true }
}

async function handleOutcomeChange(stageId: string, jobCandidateId: string, outcome: string, hireDecision?: boolean, orgId?: string) {
  if (outcome === 'pass') {
    const currentStage = await prisma.interviewStage.findUnique({
      where: { id: stageId },
      select: { sortOrder: true },
    })

    const nextStage = await prisma.interviewStage.findFirst({
      where: {
        isActive: true,
        sortOrder: { gt: currentStage!.sortOrder },
        ...(orgId ? { orgId } : {}),
      },
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    })

    if (nextStage) {
      await prisma.jobCandidate.update({
        where: { id: jobCandidateId },
        data: { currentStageId: nextStage.id },
      })
    } else if (hireDecision) {
      // Final stage + hire decision = hired
      await prisma.jobCandidate.update({
        where: { id: jobCandidateId },
        data: { status: 'hired', hiredAt: new Date(), currentStageId: null },
      })
    }
    // Final stage + pass without hire → stays at current stage (passed but not hired)
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

  const jobFilter: Record<string, unknown> = { job: { orgId: user.orgId } }
  if (user.role !== 'admin') {
    const assigned = await prisma.jobAssignment.findMany({
      where: { userId: user.id },
      select: { jobId: true },
    })
    jobFilter.jobId = { in: assigned.map((a) => a.jobId) }
    jobFilter.job = { orgId: user.orgId }
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

/**
 * Verifies every submitted answer references a question that is in scope for
 * this stage+job and an option that belongs to that question. Because answers
 * reference question/option IDs straight from the client, this prevents storing
 * answers that point at another org's questions or options.
 */
async function answersAreValid(
  stageId: string,
  jobId: string,
  answers: { questionId: string; optionId: string }[]
): Promise<boolean> {
  const scoped = await getScopedQuestions(stageId, jobId)
  const optionsByQuestion = new Map(scoped.map((q) => [q.id, new Set(q.options.map((o) => o.id))]))
  return answers.every((a) => optionsByQuestion.get(a.questionId)?.has(a.optionId) ?? false)
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
  const user = await getCurrentUser()
  if (!user) return null

  const [stage, questions] = await Promise.all([
    prisma.interviewStage.findFirst({
      where: { id: stageId, orgId: user.orgId },
      select: { id: true, name: true, sortOrder: true, isActive: true, isFinal: true },
    }),
    getScopedQuestions(stageId, jobId),
  ])
  if (!stage) return null
  return { ...stage, questions }
}

export async function getStagesWithCounts() {
  const user = await getCurrentUser()
  if (!user) return []

  let stageWhere: Record<string, unknown> = { isActive: true, orgId: user.orgId }
  let candidateWhere: Record<string, unknown> = { status: 'active', job: { orgId: user.orgId } }

  if (user.role !== 'admin') {
    const [stageRows, jobRows] = await Promise.all([
      prisma.userStageAccess.findMany({ where: { userId: user.id }, select: { stageId: true } }),
      prisma.jobAssignment.findMany({ where: { userId: user.id }, select: { jobId: true } }),
    ])
    const jobIds = jobRows.map((r) => r.jobId)
    // Stage access is opt-in restriction: if no entries configured, user can access all stages
    // for their assigned jobs. If entries exist, restrict to only those stages.
    if (stageRows.length > 0) {
      stageWhere = { isActive: true, orgId: user.orgId, id: { in: stageRows.map((r) => r.stageId) } }
    } else {
      stageWhere = { isActive: true, orgId: user.orgId }
    }
    candidateWhere = { status: 'active', jobId: { in: jobIds }, job: { orgId: user.orgId } }
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
  const user = await getCurrentUser()
  if (!user) return null

  // Verify the jobCandidate belongs to the user's org before returning interview data
  const jobCandidate = await prisma.jobCandidate.findUnique({
    where: { id: jobCandidateId },
    select: { job: { select: { orgId: true } } },
  })
  if (!jobCandidate || jobCandidate.job.orgId !== user.orgId) return null

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
  const user = await getCurrentUser()
  if (!user) return null

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
          job: { select: { id: true, title: true, orgId: true } },
        },
      },
      stage: {
        select: { id: true, name: true, sortOrder: true },
      },
    },
  })
  if (!interview) return null
  if (interview.jobCandidate.job.orgId !== user.orgId) return null

  const questions = await getScopedQuestions(interview.stage.id, interview.jobCandidate.job.id)
  return { ...interview, questions }
}

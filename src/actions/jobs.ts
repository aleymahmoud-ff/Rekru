'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createJobSchema, updateJobSchema, linkJobQuestionsSchema } from '@/lib/validations/job'
import { orgPath } from '@/lib/org'

type ActionResult = { success: boolean; error?: string; id?: string }

export async function createJob(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const raw = {
    title: formData.get('title'),
    description: formData.get('description') || undefined,
  }

  const parsed = createJobSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const job = await prisma.job.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      createdById: user.id,
      orgId: user.orgId,
    },
  })

  revalidatePath(orgPath(user.orgSlug, '/jobs'))
  return { success: true, id: job.id }
}

export async function updateJob(data: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = updateJobSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { id, ...updates } = parsed.data
  await prisma.job.update({ where: { id, orgId: user.orgId }, data: updates })

  revalidatePath(orgPath(user.orgSlug, '/jobs'))
  revalidatePath(orgPath(user.orgSlug, `/jobs/${id}`))
  return { success: true, id }
}

export async function deleteJob(jobId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify job belongs to the user's org before deleting
  const job = await prisma.job.findUnique({ where: { id: jobId, orgId: user.orgId }, select: { id: true } })
  if (!job) return { success: false, error: 'Job not found' }

  const count = await prisma.jobCandidate.count({ where: { jobId } })
  if (count > 0) return { success: false, error: `Cannot delete: ${count} candidate${count !== 1 ? 's' : ''} are linked to this job` }

  await prisma.job.delete({ where: { id: jobId } })
  revalidatePath(orgPath(user.orgSlug, '/jobs'))
  return { success: true }
}

export async function linkJobQuestions(data: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = linkJobQuestionsSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { jobId, questionIds } = parsed.data

  // Verify job belongs to the user's org before linking questions
  const job = await prisma.job.findUnique({ where: { id: jobId, orgId: user.orgId }, select: { id: true } })
  if (!job) return { success: false, error: 'Job not found' }

  // Verify every question belongs to the caller's org (via stage.orgId)
  if (questionIds.length > 0) {
    const validCount = await prisma.stageQuestion.count({
      where: { id: { in: questionIds }, stage: { orgId: user.orgId } },
    })
    if (validCount !== questionIds.length) {
      return { success: false, error: 'One or more questions are invalid' }
    }
  }

  // Delete existing links for this job, then insert selected ones
  await prisma.$transaction([
    prisma.jobQuestion.deleteMany({ where: { jobId } }),
    ...(questionIds.length > 0
      ? [prisma.jobQuestion.createMany({
          data: questionIds.map((questionId) => ({ jobId, questionId })),
          skipDuplicates: true,
        })]
      : []),
  ])

  revalidatePath(orgPath(user.orgSlug, `/jobs/${jobId}`))
  return { success: true }
}

export async function toggleJobStatus(jobId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const job = await prisma.job.findUnique({ where: { id: jobId, orgId: user.orgId }, select: { status: true } })
  if (!job) return { success: false, error: 'Job not found' }

  await prisma.job.update({
    where: { id: jobId },
    data: { status: job.status === 'open' ? 'closed' : 'open' },
  })

  revalidatePath(orgPath(user.orgSlug, '/jobs'))
  revalidatePath(orgPath(user.orgSlug, `/jobs/${jobId}`))
  return { success: true }
}

export async function getJobs(status?: 'open' | 'closed') {
  const user = await getCurrentUser()
  if (!user) return []

  const where: Record<string, unknown> = status ? { status, orgId: user.orgId } : { orgId: user.orgId }
  if (user.role !== 'admin') {
    where.assignments = { some: { userId: user.id } }
  }

  return prisma.job.findMany({
    where,
    include: {
      createdBy: { select: { fullName: true } },
      _count: { select: { jobCandidates: true } },
      jobCandidates: {
        where: { status: 'hired' },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getJobWithCandidates(jobId: string) {
  const user = await getCurrentUser()
  if (!user) return null

  if (user.role !== 'admin') {
    const assigned = await prisma.jobAssignment.findUnique({
      where: { userId_jobId: { userId: user.id, jobId } },
    })
    if (!assigned) return null
  }

  return prisma.job.findUnique({
    where: { id: jobId, orgId: user.orgId },
    include: {
      createdBy: { select: { fullName: true } },
      jobCandidates: {
        include: {
          candidate: true,
          currentStage: true,
          interviews: {
            include: {
              stage: true,
              updatedBy: { select: { fullName: true } },
            },
            orderBy: { conductedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

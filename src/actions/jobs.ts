'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createJobSchema, updateJobSchema, linkJobQuestionsSchema } from '@/lib/validations/job'

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
    },
  })

  revalidatePath('/jobs')
  return { success: true, id: job.id }
}

export async function updateJob(data: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = updateJobSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { id, ...updates } = parsed.data
  await prisma.job.update({ where: { id }, data: updates })

  revalidatePath('/jobs')
  revalidatePath(`/jobs/${id}`)
  return { success: true, id }
}

export async function deleteJob(jobId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const count = await prisma.jobCandidate.count({ where: { jobId } })
  if (count > 0) return { success: false, error: `Cannot delete: ${count} candidate${count !== 1 ? 's' : ''} are linked to this job` }

  await prisma.job.delete({ where: { id: jobId } })
  revalidatePath('/jobs')
  return { success: true }
}

export async function linkJobQuestions(data: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = linkJobQuestionsSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { jobId, questionIds } = parsed.data

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

  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

export async function toggleJobStatus(jobId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } })
  if (!job) return { success: false, error: 'Job not found' }

  await prisma.job.update({
    where: { id: jobId },
    data: { status: job.status === 'open' ? 'closed' : 'open' },
  })

  revalidatePath('/jobs')
  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

export async function getJobs(status?: 'open' | 'closed') {
  const where = status ? { status: status as 'open' | 'closed' } : {}

  return prisma.job.findMany({
    where,
    include: {
      createdBy: { select: { fullName: true } },
      _count: { select: { jobCandidates: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getJobWithCandidates(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
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

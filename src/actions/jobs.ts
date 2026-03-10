'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createJobSchema } from '@/lib/validations/job'

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

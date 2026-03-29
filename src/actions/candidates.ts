'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { addCandidateSchema } from '@/lib/validations/candidate'
import { orgPath } from '@/lib/org'

type ActionResult = { success: boolean; error?: string }

export async function addCandidateToJob(
  jobId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const raw = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    cvLink: formData.get('cvLink') || undefined,
  }

  const parsed = addCandidateSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { fullName, email, phone, cvLink } = parsed.data

  // Check job exists, is open, and belongs to the user's org
  const job = await prisma.job.findUnique({ where: { id: jobId, orgId: user.orgId }, select: { status: true } })
  if (!job) return { success: false, error: 'Job not found' }
  if (job.status === 'closed') return { success: false, error: 'This job is closed' }

  // Get first active stage scoped to the user's org
  const firstStage = await prisma.interviewStage.findFirst({
    where: { isActive: true, orgId: user.orgId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true },
  })

  if (!firstStage) return { success: false, error: 'No active interview stages configured' }

  // Find or create candidate scoped to the user's org
  let candidate = await prisma.candidate.findUnique({
    where: { orgId_email: { orgId: user.orgId, email } },
    select: { id: true },
  })

  if (!candidate) {
    candidate = await prisma.candidate.create({
      data: { fullName, email, phone, cvLink: cvLink || null, orgId: user.orgId },
    })
  }

  // Check if already added to this job
  const existing = await prisma.jobCandidate.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: candidate.id } },
  })

  if (existing) {
    return { success: false, error: 'This candidate is already added to this job' }
  }

  await prisma.jobCandidate.create({
    data: {
      jobId,
      candidateId: candidate.id,
      currentStageId: firstStage.id,
    },
  })

  revalidatePath(orgPath(user.orgSlug, `/jobs/${jobId}`))
  revalidatePath(orgPath(user.orgSlug, '/dashboard'))
  return { success: true }
}

export async function removeJobCandidate(jobCandidateId: string, jobId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify the job belongs to the user's org before removing the candidate
  const jobCandidate = await prisma.jobCandidate.findUnique({
    where: { id: jobCandidateId },
    select: { job: { select: { orgId: true } } },
  })
  if (!jobCandidate || jobCandidate.job.orgId !== user.orgId) {
    return { success: false, error: 'Not found' }
  }

  // Delete interviews first (no cascade defined), answers cascade from Interview
  await prisma.$transaction([
    prisma.interview.deleteMany({ where: { jobCandidateId } }),
    prisma.jobCandidate.delete({ where: { id: jobCandidateId } }),
  ])

  revalidatePath(orgPath(user.orgSlug, `/jobs/${jobId}`))
  revalidatePath(orgPath(user.orgSlug, '/dashboard'))
  return { success: true }
}

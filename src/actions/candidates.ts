'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { addCandidateSchema } from '@/lib/validations/candidate'

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

  // Check job exists and is open
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } })
  if (!job) return { success: false, error: 'Job not found' }
  if (job.status === 'closed') return { success: false, error: 'This job is closed' }

  // Get first active stage
  const firstStage = await prisma.interviewStage.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true },
  })

  if (!firstStage) return { success: false, error: 'No active interview stages configured' }

  // Find or create candidate
  let candidate = await prisma.candidate.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!candidate) {
    candidate = await prisma.candidate.create({
      data: { fullName, email, phone, cvLink: cvLink || null },
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

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function removeJobCandidate(jobCandidateId: string, jobId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Delete interviews first (no cascade defined), answers cascade from Interview
  await prisma.$transaction([
    prisma.interview.deleteMany({ where: { jobCandidateId } }),
    prisma.jobCandidate.delete({ where: { id: jobCandidateId } }),
  ])

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

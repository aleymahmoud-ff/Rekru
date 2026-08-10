'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { addCandidateSchema } from '@/lib/validations/candidate'
import { isS3Configured, isS3Key, uploadCv, deleteCv, validateCvFile } from '@/lib/s3'

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
  }

  const parsed = addCandidateSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { fullName, email, phone } = parsed.data

  // CV is an optional file upload. Validate early, before any DB writes.
  const cvField = formData.get('cv')
  const cvFile = cvField instanceof File && cvField.size > 0 ? cvField : null
  if (cvFile) {
    if (!isS3Configured()) return { success: false, error: 'CV storage is not configured' }
    const fileError = validateCvFile(cvFile)
    if (fileError) return { success: false, error: fileError }
  }

  // Check the job exists and is open
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } })
  if (!job) return { success: false, error: 'Job not found' }
  if (job.status === 'closed') return { success: false, error: 'This job is closed' }

  // Get the first active stage
  const firstStage = await prisma.interviewStage.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true },
  })

  if (!firstStage) return { success: false, error: 'No active interview stages configured' }

  // Find or create the candidate
  let candidate = await prisma.candidate.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!candidate) {
    candidate = await prisma.candidate.create({
      data: { fullName, email, phone },
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

  // Upload the CV last so a storage hiccup doesn't block adding the candidate.
  if (cvFile) {
    try {
      const key = await uploadCv(candidate.id, cvFile)
      await prisma.candidate.update({ where: { id: candidate.id }, data: { cvLink: key } })
    } catch {
      return { success: false, error: 'Candidate added, but the CV upload failed. Try uploading it again from the candidate.' }
    }
  }

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function uploadCandidateCv(
  candidateId: string,
  jobId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!isS3Configured()) return { success: false, error: 'CV storage is not configured' }

  const cvField = formData.get('cv')
  const cvFile = cvField instanceof File && cvField.size > 0 ? cvField : null
  if (!cvFile) return { success: false, error: 'No file selected' }

  const fileError = validateCvFile(cvFile)
  if (fileError) return { success: false, error: fileError }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { cvLink: true },
  })
  if (!candidate) {
    return { success: false, error: 'Candidate not found' }
  }

  let key: string
  try {
    key = await uploadCv(candidateId, cvFile)
  } catch {
    return { success: false, error: 'CV upload failed. Please try again.' }
  }

  await prisma.candidate.update({ where: { id: candidateId }, data: { cvLink: key } })

  // Best-effort cleanup of the previous object (ignore failures)
  if (isS3Key(candidate.cvLink) && candidate.cvLink !== key) {
    try {
      await deleteCv(candidate.cvLink)
    } catch {
      // orphaned object is harmless; don't fail the request
    }
  }

  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

export async function removeJobCandidate(jobCandidateId: string, jobId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const jobCandidate = await prisma.jobCandidate.findUnique({
    where: { id: jobCandidateId },
    select: { id: true },
  })
  if (!jobCandidate) {
    return { success: false, error: 'Not found' }
  }

  // Delete interviews first (no cascade defined), answers cascade from Interview
  await prisma.$transaction([
    prisma.interview.deleteMany({ where: { jobCandidateId } }),
    prisma.jobCandidate.delete({ where: { id: jobCandidateId } }),
  ])

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

'use server'

import { prisma } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/super-admin'
import { getCurrentUser } from '@/lib/auth'

type ActionResult = { success: boolean; error?: string }

export async function getSuperAdminStats(): Promise<{
  totalOrgs: number
  totalUsers: number
  totalCandidates: number
  totalJobs: number
  totalInterviews: number
} | null> {
  const { error } = await requireSuperAdmin()
  if (error) return null

  const [totalOrgs, totalUsers, totalCandidates, totalJobs, totalInterviews] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.candidate.count(),
    prisma.job.count(),
    prisma.interview.count(),
  ])

  return { totalOrgs, totalUsers, totalCandidates, totalJobs, totalInterviews }
}

export async function getAllOrganizations(): Promise<
  {
    id: string
    name: string
    slug: string
    createdAt: Date
    _count: { users: number; jobs: number; candidates: number }
  }[]
> {
  const { error } = await requireSuperAdmin()
  if (error) return []

  return prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: {
        select: { users: true, jobs: true, candidates: true },
      },
    },
  })
}

export async function getOrganizationDetail(orgId: string): Promise<{
  id: string
  name: string
  slug: string
  createdAt: Date
  users: {
    id: string
    fullName: string
    email: string
    role: string | null
    status: string
    isSuperAdmin: boolean
  }[]
  _count: { jobs: number; candidates: number; interviews: number }
} | null> {
  const { error } = await requireSuperAdmin()
  if (error) return null

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      users: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          isSuperAdmin: true,
        },
        orderBy: { fullName: 'asc' },
      },
    },
  })

  if (!org) return null

  const [jobCount, candidateCount, interviewCount] = await Promise.all([
    prisma.job.count({ where: { orgId } }),
    prisma.candidate.count({ where: { orgId } }),
    prisma.interview.count({
      where: { jobCandidate: { job: { orgId } } },
    }),
  ])

  return {
    ...org,
    users: org.users.map((u) => ({
      ...u,
      role: u.role ?? null,
    })),
    _count: { jobs: jobCount, candidates: candidateCount, interviews: interviewCount },
  }
}

export async function deleteOrganization(orgId: string): Promise<ActionResult> {
  const { error } = await requireSuperAdmin()
  if (error) return { success: false, error }

  try {
    await prisma.$transaction(async (tx) => {
      // Get all job IDs for this org
      const jobs = await tx.job.findMany({ where: { orgId }, select: { id: true } })
      const jobIds = jobs.map((j) => j.id)

      // Get all job candidate IDs for these jobs
      const jobCandidates = await tx.jobCandidate.findMany({
        where: { jobId: { in: jobIds } },
        select: { id: true },
      })
      const jobCandidateIds = jobCandidates.map((jc) => jc.id)

      // Get all interview IDs for these job candidates
      const interviews = await tx.interview.findMany({
        where: { jobCandidateId: { in: jobCandidateIds } },
        select: { id: true },
      })
      const interviewIds = interviews.map((i) => i.id)

      // Get all stage IDs for this org
      const stages = await tx.interviewStage.findMany({ where: { orgId }, select: { id: true } })
      const stageIds = stages.map((s) => s.id)

      // Get all user IDs for this org
      const users = await tx.user.findMany({ where: { orgId }, select: { id: true } })
      const userIds = users.map((u) => u.id)

      // 1. interview_answers
      await tx.interviewAnswer.deleteMany({ where: { interviewId: { in: interviewIds } } })

      // 2. interviews
      await tx.interview.deleteMany({ where: { id: { in: interviewIds } } })

      // 3. job_candidates
      await tx.jobCandidate.deleteMany({ where: { id: { in: jobCandidateIds } } })

      // 4. job_questions
      await tx.jobQuestion.deleteMany({ where: { jobId: { in: jobIds } } })

      // 5. job_assignments
      await tx.jobAssignment.deleteMany({ where: { jobId: { in: jobIds } } })

      // 6. question_options (via stage questions)
      const stageQuestions = await tx.stageQuestion.findMany({
        where: { stageId: { in: stageIds } },
        select: { id: true },
      })
      const stageQuestionIds = stageQuestions.map((sq) => sq.id)
      await tx.questionOption.deleteMany({ where: { questionId: { in: stageQuestionIds } } })

      // 7. stage_questions
      await tx.stageQuestion.deleteMany({ where: { stageId: { in: stageIds } } })

      // 8. user_stage_access
      await tx.userStageAccess.deleteMany({ where: { userId: { in: userIds } } })

      // 9. interview_stages
      await tx.interviewStage.deleteMany({ where: { orgId } })

      // 10. candidates
      await tx.candidate.deleteMany({ where: { orgId } })

      // 11. jobs
      await tx.job.deleteMany({ where: { orgId } })

      // 12. users
      await tx.user.deleteMany({ where: { orgId } })

      // 13. app_settings
      await tx.appSettings.deleteMany({ where: { orgId } })

      // 14. organization
      await tx.organization.delete({ where: { id: orgId } })
    })

    return { success: true }
  } catch (err) {
    console.error('[deleteOrganization]', err)
    return { success: false, error: 'Failed to delete organization' }
  }
}

export async function toggleSuperAdmin(userId: string): Promise<ActionResult> {
  const { error, user: currentUser } = await requireSuperAdmin()
  if (error || !currentUser) return { success: false, error: error ?? 'Unauthorized' }

  if (currentUser.id === userId) {
    return { success: false, error: 'You cannot remove your own super admin status' }
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    })

    if (!target) return { success: false, error: 'User not found' }

    await prisma.user.update({
      where: { id: userId },
      data: { isSuperAdmin: !target.isSuperAdmin },
    })

    return { success: true }
  } catch (err) {
    console.error('[toggleSuperAdmin]', err)
    return { success: false, error: 'Failed to update user' }
  }
}

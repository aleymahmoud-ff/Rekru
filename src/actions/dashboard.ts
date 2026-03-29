'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { orgPath as _orgPath } from '@/lib/org'

export async function getDashboardStats() {
  const user = await getCurrentUser()
  if (!user) return {
    statusCounts: { active: 0, hired: 0, rejected: 0, on_hold: 0 },
    stageCounts: [],
    recentInterviews: [],
    totalOpenJobs: 0,
    totalCandidates: 0,
  }

  // For non-admin: filter everything to assigned jobs and stages
  let jobIdFilter: string[] | null = null
  let stageIdFilter: string[] | null = null

  if (user.role !== 'admin') {
    const [jobRows, stageRows] = await Promise.all([
      prisma.jobAssignment.findMany({ where: { userId: user.id }, select: { jobId: true } }),
      prisma.userStageAccess.findMany({ where: { userId: user.id }, select: { stageId: true } }),
    ])
    jobIdFilter = jobRows.map((r) => r.jobId)
    stageIdFilter = stageRows.map((r) => r.stageId)
  }

  const candidateJobFilter = jobIdFilter
    ? { jobId: { in: jobIdFilter }, job: { orgId: user.orgId } }
    : { job: { orgId: user.orgId } }

  const stageWhere = {
    isActive: true,
    orgId: user.orgId,
    ...(stageIdFilter ? { id: { in: stageIdFilter } } : {}),
  }

  const [statusCounts, onHoldCount, stageCounts, recentInterviews, totalJobs] = await Promise.all([
    prisma.jobCandidate.groupBy({
      by: ['status'],
      _count: { id: true },
      where: candidateJobFilter,
    }),

    prisma.interview.count({
      where: {
        outcome: 'on_hold',
        jobCandidate: jobIdFilter
          ? { jobId: { in: jobIdFilter }, job: { orgId: user.orgId } }
          : { job: { orgId: user.orgId } },
      },
    }),

    prisma.interviewStage.findMany({
      where: stageWhere,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        _count: {
          select: {
            jobCandidates: { where: { status: 'active', ...candidateJobFilter } },
          },
        },
      },
    }),

    prisma.interview.findMany({
      take: 10,
      orderBy: { conductedAt: 'desc' },
      where: {
        jobCandidate: jobIdFilter
          ? { jobId: { in: jobIdFilter }, job: { orgId: user.orgId } }
          : { job: { orgId: user.orgId } },
      },
      include: {
        jobCandidate: {
          include: {
            candidate: { select: { fullName: true } },
            job: { select: { id: true, title: true } },
          },
        },
        stage: { select: { name: true } },
        interviewer: { select: { fullName: true } },
        updatedBy: { select: { fullName: true } },
      },
    }),

    prisma.job.count({
      where: {
        status: 'open',
        orgId: user.orgId,
        ...(jobIdFilter ? { id: { in: jobIdFilter } } : {}),
      },
    }),
  ])

  const statusMap: Record<string, number> = {
    active: 0,
    hired: 0,
    rejected: 0,
    on_hold: onHoldCount,
  }
  for (const s of statusCounts) {
    if (s.status === 'active') {
      statusMap.active = s._count.id - onHoldCount
    } else {
      statusMap[s.status] = s._count.id
    }
  }
  if (statusMap.active < 0) statusMap.active = 0

  return {
    statusCounts: statusMap,
    stageCounts: stageCounts.map((s) => ({
      id: s.id,
      name: s.name,
      sortOrder: s.sortOrder,
      count: s._count.jobCandidates,
    })),
    recentInterviews,
    totalOpenJobs: totalJobs,
    totalCandidates: Object.values(statusMap).reduce((a, b) => a + b, 0),
  }
}

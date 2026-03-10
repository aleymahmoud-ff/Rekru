'use server'

import { prisma } from '@/lib/db'

export async function getDashboardStats() {
  const [statusCounts, stageCounts, recentInterviews, totalJobs] = await Promise.all([
    // Count by pipeline status
    prisma.jobCandidate.groupBy({
      by: ['status'],
      _count: { id: true },
    }),

    // Count active candidates per stage
    prisma.interviewStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        _count: {
          select: {
            jobCandidates: {
              where: { status: 'active' },
            },
          },
        },
      },
    }),

    // Recent interviews
    prisma.interview.findMany({
      take: 10,
      orderBy: { conductedAt: 'desc' },
      include: {
        jobCandidate: {
          include: {
            candidate: { select: { fullName: true } },
            job: { select: { title: true } },
          },
        },
        stage: { select: { name: true } },
        interviewer: { select: { fullName: true } },
      },
    }),

    // Total open jobs
    prisma.job.count({ where: { status: 'open' } }),
  ])

  const statusMap: Record<string, number> = {
    active: 0,
    hired: 0,
    rejected: 0,
    on_hold: 0,
  }
  for (const s of statusCounts) {
    statusMap[s.status] = s._count.id
  }

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

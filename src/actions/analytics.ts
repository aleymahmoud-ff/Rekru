'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function getPipelineAnalytics(jobId?: string) {
  const user = await getCurrentUser()
  if (!user) return null

  const [stages, jobs, failedAnswers, candidateStats] = await Promise.all([
    prisma.interviewStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        interviews: {
          where: jobId ? { jobCandidate: { jobId } } : {},
          select: { outcome: true },
        },
      },
    }),

    prisma.job.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        status: true,
        jobCandidates: {
          select: {
            status: true,
            interviews: {
              select: { stageId: true, outcome: true },
            },
          },
        },
      },
    }),

    prisma.interviewAnswer.findMany({
      where: {
        interview: {
          outcome: 'fail',
          ...(jobId ? { jobCandidate: { jobId } } : {}),
        },
      },
      select: {
        interview: { select: { stageId: true } },
        question: { select: { id: true, questionText: true } },
        option: { select: { id: true, label: true, value: true } },
      },
    }),

    prisma.jobCandidate.groupBy({
      by: ['status'],
      where: jobId ? { jobId } : {},
      _count: { id: true },
    }),
  ])

  // Funnel per stage
  const funnel = stages
    .map((stage) => {
      const total = stage.interviews.length
      const passed = stage.interviews.filter((i) => i.outcome === 'pass').length
      const failed = stage.interviews.filter((i) => i.outcome === 'fail').length
      const onHold = stage.interviews.filter((i) => i.outcome === 'on_hold').length
      return {
        id: stage.id,
        name: stage.name,
        total,
        passed,
        failed,
        onHold,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        failRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      }
    })
    .filter((s) => s.total > 0)

  // Rejection drivers
  const stageMap = new Map(stages.map((s) => [s.id, s.name]))
  const failuresPerStage = new Map(funnel.map((s) => [s.id, s.failed]))

  type DriverEntry = {
    stageId: string
    stageName: string
    questionId: string
    questionText: string
    optionId: string
    optionLabel: string
    optionValue: number
    count: number
    pct: number
  }
  const driverCounts = new Map<string, DriverEntry>()

  for (const answer of failedAnswers) {
    const key = `${answer.interview.stageId}__${answer.question.id}__${answer.option.id}`
    const existing = driverCounts.get(key)
    if (existing) {
      existing.count++
    } else {
      driverCounts.set(key, {
        stageId: answer.interview.stageId,
        stageName: stageMap.get(answer.interview.stageId) ?? 'Unknown',
        questionId: answer.question.id,
        questionText: answer.question.questionText,
        optionId: answer.option.id,
        optionLabel: answer.option.label,
        optionValue: answer.option.value,
        count: 1,
        pct: 0,
      })
    }
  }

  const allDrivers = Array.from(driverCounts.values())
    .map((d) => ({
      ...d,
      pct: failuresPerStage.get(d.stageId)
        ? Math.round((d.count / failuresPerStage.get(d.stageId)!) * 100)
        : 0,
    }))
    .sort((a, b) => b.count - a.count)

  const driversByStage = new Map<string, DriverEntry[]>()
  for (const d of allDrivers) {
    const list = driversByStage.get(d.stageId) ?? []
    list.push(d)
    driversByStage.set(d.stageId, list)
  }

  // Job-level stats
  const jobsToAnalyze = jobId ? jobs.filter((j) => j.id === jobId) : jobs
  const jobStats = jobsToAnalyze.map((job) => {
    const candidates = job.jobCandidates
    const total = candidates.length
    const hired = candidates.filter((c) => c.status === 'hired').length
    const rejected = candidates.filter((c) => c.status === 'rejected').length
    const active = candidates.filter((c) => c.status === 'active').length
    const onHold = candidates.filter((c) => c.status === 'on_hold').length

    const stageBreakdown = stages
      .map((stage) => {
        const ints = candidates.flatMap((c) =>
          c.interviews.filter((i) => i.stageId === stage.id),
        )
        if (ints.length === 0) return null
        return {
          stageName: stage.name,
          pass: ints.filter((i) => i.outcome === 'pass').length,
          fail: ints.filter((i) => i.outcome === 'fail').length,
          onHold: ints.filter((i) => i.outcome === 'on_hold').length,
          total: ints.length,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    return {
      id: job.id,
      title: job.title,
      status: job.status as string,
      total,
      hired,
      rejected,
      active,
      onHold,
      conversionRate: total > 0 ? Math.round((hired / total) * 100) : 0,
      stageBreakdown,
    }
  })

  const statusCounts = Object.fromEntries(
    candidateStats.map((s) => [s.status, s._count.id]),
  )
  const totalCandidates = Object.values(statusCounts).reduce(
    (sum, v) => sum + (v as number),
    0,
  )

  return {
    summary: {
      total: totalCandidates,
      active: (statusCounts['active'] as number) ?? 0,
      hired: (statusCounts['hired'] as number) ?? 0,
      rejected: (statusCounts['rejected'] as number) ?? 0,
      onHold: (statusCounts['on_hold'] as number) ?? 0,
    },
    funnel,
    driversByStage: Array.from(driversByStage.entries()).map(
      ([stageId, drivers]) => ({
        stageId,
        stageName: stageMap.get(stageId) ?? 'Unknown',
        drivers,
      }),
    ),
    jobStats,
    allJobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status as string,
    })),
  }
}

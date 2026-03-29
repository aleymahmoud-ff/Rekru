import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getCurrentUser } from '@/lib/auth'
import { getPipelineAnalytics } from '@/actions/analytics'
import { JobFilter } from '@/components/analytics/job-filter'
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart2,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Analytics — Rekru' }

type Props = { searchParams: Promise<{ job?: string }> }

export default async function AnalyticsPage({ searchParams }: Props) {
  const [user, { job: jobId }] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ])

  if (!user || user.role !== 'admin') redirect(`/org/${user?.orgSlug ?? 'default'}/dashboard`)

  const data = await getPipelineAnalytics(jobId)
  if (!data) redirect(`/org/${user.orgSlug}/dashboard`)

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Pipeline performance, conversion rates, and rejection insights"
        action={
          <JobFilter jobs={data.allJobs} selectedJobId={jobId} />
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Section 1 — Summary Cards                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          label="Total Candidates"
          value={data.summary.total}
          icon={BarChart2}
          color="#1e3a5f"
          bg="#eef2f7"
        />
        <SummaryCard
          label="Active"
          value={data.summary.active}
          icon={Users}
          color="#f59e0b"
          bg="#fffbeb"
        />
        <SummaryCard
          label="Hired"
          value={data.summary.hired}
          icon={CheckCircle2}
          color="#059669"
          bg="#ecfdf5"
        />
        <SummaryCard
          label="Rejected"
          value={data.summary.rejected}
          icon={XCircle}
          color="#dc2626"
          bg="#fef2f2"
        />
        <SummaryCard
          label="On Hold"
          value={data.summary.onHold}
          icon={Clock}
          color="#6b7280"
          bg="#f3f4f6"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2 — Pipeline Funnel                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
        >
          Pipeline Funnel
        </h2>

        {data.funnel.length === 0 ? (
          <EmptyState message="No interviews recorded yet" />
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e5e0', backgroundColor: '#faf9f7' }}>
                  {['Stage', 'Interviewed', 'Passed', 'Failed', 'On Hold', 'Pass Rate'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-semibold"
                        style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#e8e5e0' }}>
                {data.funnel.map((stage) => (
                  <tr key={stage.id} className="hover:bg-[#faf9f7] transition-colors">
                    <td
                      className="px-5 py-3.5 font-medium"
                      style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                    >
                      {stage.name}
                    </td>
                    <td
                      className="px-5 py-3.5"
                      style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                    >
                      {stage.total}
                    </td>
                    <td
                      className="px-5 py-3.5"
                      style={{ fontFamily: 'var(--font-body)', color: '#059669' }}
                    >
                      {stage.passed}
                    </td>
                    <td
                      className="px-5 py-3.5"
                      style={{ fontFamily: 'var(--font-body)', color: '#dc2626' }}
                    >
                      {stage.failed}
                    </td>
                    <td
                      className="px-5 py-3.5"
                      style={{ fontFamily: 'var(--font-body)', color: '#f59e0b' }}
                    >
                      {stage.onHold}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <RateBadge rate={stage.passRate} />
                        <div
                          className="h-1.5 w-full rounded-full overflow-hidden"
                          style={{ backgroundColor: '#e8e5e0' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${stage.passRate}%`,
                              backgroundColor: rateColor(stage.passRate),
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3 — Job Performance                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
        >
          Job Performance
        </h2>

        {data.jobStats.length === 0 ? (
          <EmptyState message="No job data available" />
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #e8e5e0',
                    backgroundColor: '#faf9f7',
                  }}
                >
                  {[
                    'Job',
                    'Status',
                    'Total',
                    'Active',
                    'Hired',
                    'Rejected',
                    'On Hold',
                    'Conversion',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left font-semibold"
                      style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.jobStats.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    defaultExpanded={!!jobId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4 — Rejection Drivers                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
        >
          Rejection Drivers
        </h2>

        {data.driversByStage.length === 0 ? (
          <EmptyState message="No failed interviews recorded yet" />
        ) : (
          <div className="space-y-5">
            {data.driversByStage.map((group) => (
              <div key={group.stageId}>
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                >
                  {group.stageName}
                </p>
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid #e8e5e0',
                          backgroundColor: '#faf9f7',
                        }}
                      >
                        {[
                          'Question',
                          'Answer Given',
                          'Times Selected',
                          '% of Failures',
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left font-semibold"
                            style={{
                              fontFamily: 'var(--font-body)',
                              color: '#6b6560',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: '#e8e5e0' }}>
                      {group.drivers.map((driver) => (
                        <tr
                          key={`${driver.questionId}__${driver.optionId}`}
                          className="transition-colors"
                          style={{
                            backgroundColor:
                              driver.pct >= 50 ? '#fffbeb' : undefined,
                          }}
                        >
                          <td
                            className="px-5 py-3.5 max-w-xs"
                            style={{
                              fontFamily: 'var(--font-body)',
                              color: '#1a1a1a',
                            }}
                          >
                            {driver.questionText}
                          </td>
                          <td
                            className="px-5 py-3.5"
                            style={{
                              fontFamily: 'var(--font-body)',
                              color: '#1a1a1a',
                            }}
                          >
                            {driver.optionLabel}
                          </td>
                          <td
                            className="px-5 py-3.5 font-medium tabular-nums"
                            style={{
                              fontFamily: 'var(--font-body)',
                              color: '#1a1a1a',
                            }}
                          >
                            {driver.count}
                          </td>
                          <td className="px-5 py-3.5">
                            <RateBadge rate={driver.pct} invert />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rateColor(rate: number): string {
  if (rate >= 70) return '#059669'
  if (rate >= 40) return '#f59e0b'
  return '#dc2626'
}

function rateTextColor(rate: number, invert?: boolean): { color: string; bg: string; border: string } {
  // invert=true means high % is bad (rejection rate)
  const effectiveRate = invert ? 100 - rate : rate
  if (effectiveRate >= 70)
    return { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' }
  if (effectiveRate >= 40)
    return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
}

function RateBadge({ rate, invert }: { rate: number; invert?: boolean }) {
  const c = rateTextColor(rate, invert)
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border tabular-nums"
      style={{
        color: c.color,
        backgroundColor: c.bg,
        borderColor: c.border,
        fontFamily: 'var(--font-body)',
      }}
    >
      {rate}%
    </span>
  )
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  bg: string
}) {
  return (
    <div
      className="rounded-xl border bg-white p-5"
      style={{ borderColor: '#e8e5e0' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: bg }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color }} />
        </div>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
      >
        {value}
      </p>
      <p
        className="text-xs font-medium mt-0.5"
        style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
      >
        {label}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Job Row (with inline stage breakdown)
// ---------------------------------------------------------------------------

type JobStat = {
  id: string
  title: string
  status: string
  total: number
  active: number
  hired: number
  rejected: number
  onHold: number
  conversionRate: number
  stageBreakdown: {
    stageName: string
    pass: number
    fail: number
    onHold: number
    total: number
  }[]
}

function JobRow({
  job,
  defaultExpanded,
}: {
  job: JobStat
  defaultExpanded: boolean
}) {
  const statusBadge =
    job.status === 'open'
      ? { label: 'Open', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' }
      : { label: 'Closed', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' }

  return (
    <>
      <tr
        className="hover:bg-[#faf9f7] transition-colors"
        style={{ borderTop: '1px solid #e8e5e0' }}
      >
        <td
          className="px-5 py-3.5 font-medium"
          style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
        >
          {job.title}
        </td>
        <td className="px-5 py-3.5">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
            style={{
              color: statusBadge.color,
              backgroundColor: statusBadge.bg,
              borderColor: statusBadge.border,
              fontFamily: 'var(--font-body)',
            }}
          >
            {statusBadge.label}
          </span>
        </td>
        <td
          className="px-5 py-3.5 tabular-nums"
          style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
        >
          {job.total}
        </td>
        <td
          className="px-5 py-3.5 tabular-nums"
          style={{ fontFamily: 'var(--font-body)', color: '#f59e0b' }}
        >
          {job.active}
        </td>
        <td
          className="px-5 py-3.5 tabular-nums"
          style={{ fontFamily: 'var(--font-body)', color: '#059669' }}
        >
          {job.hired}
        </td>
        <td
          className="px-5 py-3.5 tabular-nums"
          style={{ fontFamily: 'var(--font-body)', color: '#dc2626' }}
        >
          {job.rejected}
        </td>
        <td
          className="px-5 py-3.5 tabular-nums"
          style={{ fontFamily: 'var(--font-body)', color: '#6b7280' }}
        >
          {job.onHold}
        </td>
        <td className="px-5 py-3.5">
          <div className="flex flex-col gap-1.5 min-w-[100px]">
            <RateBadge rate={job.conversionRate} />
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: '#e8e5e0' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${job.conversionRate}%`,
                  backgroundColor: rateColor(job.conversionRate),
                }}
              />
            </div>
          </div>
        </td>
      </tr>

      {/* Stage breakdown sub-row — always visible when a specific job is
          selected, otherwise shown inline as a collapsed pill row */}
      {(defaultExpanded || job.stageBreakdown.length > 0) &&
        job.stageBreakdown.length > 0 && (
          <tr style={{ borderTop: '1px solid #e8e5e0', backgroundColor: '#faf9f7' }}>
            <td
              colSpan={8}
              className="px-5 pb-3 pt-2"
            >
              <div className="flex flex-wrap gap-2">
                {job.stageBreakdown.map((s) => (
                  <div
                    key={s.stageName}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs"
                    style={{
                      borderColor: '#e8e5e0',
                      backgroundColor: '#ffffff',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <span
                      className="font-medium"
                      style={{ color: '#1a1a1a' }}
                    >
                      {s.stageName}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 font-medium"
                      style={{ color: '#059669', backgroundColor: '#ecfdf5' }}
                    >
                      {s.pass}P
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 font-medium"
                      style={{ color: '#dc2626', backgroundColor: '#fef2f2' }}
                    >
                      {s.fail}F
                    </span>
                    {s.onHold > 0 && (
                      <span
                        className="rounded-full px-1.5 py-0.5 font-medium"
                        style={{ color: '#f59e0b', backgroundColor: '#fffbeb' }}
                      >
                        {s.onHold}H
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </td>
          </tr>
        )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border p-8 text-center"
      style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
    >
      <p
        className="text-sm"
        style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
      >
        {message}
      </p>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { getDashboardStats } from '@/actions/dashboard'
import {
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard — Rekru',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: '#3b82f6', bg: '#eff6ff', icon: Users },
  hired: { label: 'Hired', color: '#059669', bg: '#ecfdf5', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', icon: XCircle },
  on_hold: { label: 'On Hold', color: '#f59e0b', bg: '#fffbeb', icon: Clock },
}

const STAGE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#059669', '#ec4899', '#06b6d4']

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your recruitment pipeline at a glance"
      />

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Open Jobs" value={stats.totalOpenJobs} icon={Briefcase} color="#1e3a5f" bg="#eef2f7" />
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <StatCard
            key={key}
            label={config.label}
            value={stats.statusCounts[key] ?? 0}
            icon={config.icon}
            color={config.color}
            bg={config.bg}
          />
        ))}
      </div>

      {/* Pipeline overview */}
      <div className="mb-8">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
        >
          Pipeline Overview
        </h2>
        {stats.stageCounts.length === 0 ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
          >
            <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
              No active interview stages configured
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.stageCounts.map((stage, i) => (
              <Link
                key={stage.id}
                href={`/interviews/${stage.id}`}
                className="group rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-md"
                style={{ borderColor: '#e8e5e0' }}
              >
                <div
                  className="h-1 w-12 rounded-full mb-4"
                  style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }}
                />
                <p
                  className="text-sm font-medium mb-1"
                  style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                >
                  {stage.name}
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
                >
                  {stage.count}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  candidate{stage.count !== 1 ? 's' : ''} waiting
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent interviews */}
      <div>
        <h2
          className="text-xl font-semibold mb-4"
          style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
        >
          Recent Interviews
        </h2>
        {stats.recentInterviews.length === 0 ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
          >
            <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
              No interviews conducted yet
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border divide-y overflow-hidden"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
          >
            {stats.recentInterviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#faf9f7] transition-colors"
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                  >
                    {interview.jobCandidate.candidate.fullName}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                  >
                    {interview.jobCandidate.job.title} — {interview.stage.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <OutcomeBadge outcome={interview.outcome} />
                  <p
                    className="text-xs"
                    style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                  >
                    {new Date(interview.conductedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
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

function OutcomeBadge({ outcome }: { outcome: string }) {
  const config: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pass: { label: 'Pass', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    fail: { label: 'Fail', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    on_hold: { label: 'On Hold', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  }
  const c = config[outcome] ?? config.on_hold
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: c.border }}
    >
      {c.label}
    </span>
  )
}

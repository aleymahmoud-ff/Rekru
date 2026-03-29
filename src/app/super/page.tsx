import type { Metadata } from 'next'
import { Building2, Users, UserCheck, Briefcase, ClipboardList } from 'lucide-react'
import { getSuperAdminStats } from '@/actions/super-admin'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = {
  title: 'Platform Overview — Rekru Super Admin',
}

export default async function SuperDashboardPage() {
  const stats = await getSuperAdminStats()

  if (!stats) {
    return (
      <div>
        <PageHeader title="Platform Overview" description="Platform-level statistics across all organizations" />
        <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
          Unable to load stats.
        </p>
      </div>
    )
  }

  const cards = [
    {
      label: 'Organizations',
      value: stats.totalOrgs,
      icon: Building2,
      color: '#7c3aed',
      bg: '#f5f3ff',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: '#1e3a5f',
      bg: '#eef2f7',
    },
    {
      label: 'Candidates',
      value: stats.totalCandidates,
      icon: UserCheck,
      color: '#059669',
      bg: '#ecfdf5',
    },
    {
      label: 'Jobs',
      value: stats.totalJobs,
      icon: Briefcase,
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      label: 'Interviews',
      value: stats.totalInterviews,
      icon: ClipboardList,
      color: '#0891b2',
      bg: '#ecfeff',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Platform Overview"
        description="Platform-level statistics across all organizations"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
          />
        ))}
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
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
      >
        {value.toLocaleString()}
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

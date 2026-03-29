import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Briefcase, UserCheck, ClipboardList } from 'lucide-react'
import { getOrganizationDetail } from '@/actions/super-admin'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { DeleteOrgButton } from '@/components/super/delete-org-button'
import { ToggleSuperAdminButton } from '@/components/super/toggle-super-admin-button'

type Props = {
  params: Promise<{ orgId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgId } = await params
  const org = await getOrganizationDetail(orgId)
  return {
    title: org ? `${org.name} — Rekru Super Admin` : 'Organization — Rekru Super Admin',
  }
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  user: 'User',
  hr: 'HR',
  hiring_manager: 'Hiring Manager',
  ceo: 'CEO',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: 'Active', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  inactive: { label: 'Inactive', color: '#6b6560', bg: '#f0eeeb', border: '#e8e5e0' },
}

export default async function OrgDetailPage({ params }: Props) {
  const { orgId } = await params
  const [org, currentUser] = await Promise.all([
    getOrganizationDetail(orgId),
    getCurrentUser(),
  ])

  if (!org) {
    notFound()
  }

  const statCards = [
    { label: 'Jobs', value: org._count.jobs, icon: Briefcase, color: '#d97706', bg: '#fffbeb' },
    { label: 'Candidates', value: org._count.candidates, icon: UserCheck, color: '#059669', bg: '#ecfdf5' },
    { label: 'Interviews', value: org._count.interviews, icon: ClipboardList, color: '#0891b2', bg: '#ecfeff' },
  ]

  return (
    <div>
      {/* Back link */}
      <Link
        href="/super/orgs"
        className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors hover:opacity-80"
        style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
      >
        <ArrowLeft className="h-4 w-4" />
        All Organizations
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1
            className="text-[28px] font-bold leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
          >
            {org.name}
          </h1>
          <div className="flex items-center gap-3">
            <code
              className="rounded px-1.5 py-0.5 text-xs"
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                backgroundColor: '#f0eeeb',
                color: '#6b6560',
              }}
            >
              {org.slug}
            </code>
            <span
              className="text-sm"
              style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
            >
              Created{' '}
              {new Date(org.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          <DeleteOrgButton orgId={org.id} orgName={org.name} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border bg-white p-5"
            style={{ borderColor: '#e8e5e0' }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg mb-3"
              style={{ backgroundColor: card.bg }}
            >
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
            </div>
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
            >
              {card.value.toLocaleString()}
            </p>
            <p
              className="text-xs font-medium mt-0.5"
              style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
            >
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <h2
        className="text-xl font-semibold mb-4"
        style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
      >
        Users{' '}
        <span
          className="text-base font-normal"
          style={{ color: '#9c9690' }}
        >
          ({org.users.length})
        </span>
      </h2>

      {org.users.length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
        >
          <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
            No users in this organization
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e5e0', backgroundColor: '#faf9f7' }}>
                <th
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  Name
                </th>
                <th
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  Email
                </th>
                <th
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  Role
                </th>
                <th
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  Status
                </th>
                <th
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  Super Admin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#e8e5e0' }}>
              {org.users.map((user) => {
                const statusCfg = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.inactive
                return (
                  <tr key={user.id} className="hover:bg-[#faf9f7] transition-colors">
                    <td
                      className="px-5 py-3.5 font-medium"
                      style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                    >
                      {user.fullName}
                    </td>
                    <td
                      className="px-5 py-3.5"
                      style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                    >
                      {user.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{
                          fontFamily: 'var(--font-body)',
                          backgroundColor: '#f0eeeb',
                          color: '#6b6560',
                        }}
                      >
                        {user.role ? (ROLE_LABELS[user.role] ?? user.role) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
                        style={{
                          fontFamily: 'var(--font-body)',
                          color: statusCfg.color,
                          backgroundColor: statusCfg.bg,
                          borderColor: statusCfg.border,
                        }}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ToggleSuperAdminButton
                        userId={user.id}
                        isSuperAdmin={user.isSuperAdmin}
                        isCurrentUser={currentUser?.id === user.id}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

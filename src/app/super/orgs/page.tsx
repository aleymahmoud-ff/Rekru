import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllOrganizations } from '@/actions/super-admin'
import { PageHeader } from '@/components/shared/page-header'
import { Building2, Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'All Organizations — Rekru Super Admin',
}

export default async function SuperOrgsPage() {
  const orgs = await getAllOrganizations()

  return (
    <div>
      <PageHeader
        title="All Organizations"
        description={`${orgs.length} organization${orgs.length !== 1 ? 's' : ''} registered on the platform`}
        action={
          <Link
            href="/super/orgs/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
          >
            <Plus className="h-4 w-4" />
            New Organization
          </Link>
        }
      />

      {orgs.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
        >
          <Building2 className="mx-auto h-8 w-8 mb-3" style={{ color: '#9c9690' }} />
          <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
            No organizations yet
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
                  Slug
                </th>
                <th
                  className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  Users
                </th>
                <th
                  className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  Jobs
                </th>
                <th
                  className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  Candidates
                </th>
                <th
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#e8e5e0' }}>
              {orgs.map((org) => (
                <tr
                  key={org.id}
                  className="hover:bg-[#faf9f7] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/super/orgs/${org.id}`}
                      className="font-medium transition-colors hover:underline"
                      style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
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
                  </td>
                  <td
                    className="px-5 py-3.5 text-right tabular-nums"
                    style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                  >
                    {org._count.users}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right tabular-nums"
                    style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                  >
                    {org._count.jobs}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right tabular-nums"
                    style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
                  >
                    {org._count.candidates}
                  </td>
                  <td
                    className="px-5 py-3.5"
                    style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                  >
                    {new Date(org.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = {
  title: 'Dashboard — Rekru',
}

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your recruitment pipeline at a glance"
      />

      {/* Placeholder content — Phase 5 will fill this in */}
      <div
        className="rounded-xl border p-10 flex flex-col items-center justify-center text-center space-y-2"
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e8e5e0',
          minHeight: '320px',
        }}
      >
        <p
          className="text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
        >
          Pipeline overview coming soon
        </p>
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
        >
          Dashboard widgets will be built in Phase 5.
        </p>
      </div>
    </div>
  )
}

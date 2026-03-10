import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { getStagesWithCounts } from '@/actions/interviews'
import { ChevronRight, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Interviews — Rekru',
}

const STAGE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#059669', '#ec4899', '#06b6d4']

export default async function InterviewsPage() {
  const stages = await getStagesWithCounts()

  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Select a stage to view candidates ready for interview"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage, i) => (
          <Link
            key={stage.id}
            href={`/interviews/${stage.id}`}
            className="group rounded-xl border bg-white p-6 transition-all duration-200 hover:shadow-md"
            style={{ borderColor: '#e8e5e0' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="h-1.5 w-14 rounded-full"
                style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }}
              />
              <ChevronRight
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                style={{ color: '#9c9690' }}
              />
            </div>
            <p
              className="text-lg font-semibold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
            >
              {stage.name}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Users className="h-4 w-4" style={{ color: '#9c9690' }} />
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
                {stage.candidateCount} candidate{stage.candidateCount !== 1 ? 's' : ''} waiting
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

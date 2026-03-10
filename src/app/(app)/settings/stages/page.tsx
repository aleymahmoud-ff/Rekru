import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getCurrentUser } from '@/lib/auth'
import { getStages } from '@/actions/settings'
import { CreateStageForm } from '@/components/settings/create-stage-form'
import { StageActions } from '@/components/settings/stage-actions'
import { ChevronRight, GripVertical } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Interview Stages — Rekru',
}

export default async function StagesPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/dashboard')

  const stages = await getStages()

  return (
    <div>
      <PageHeader
        title="Interview Stages"
        description="Configure the interview pipeline stages"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stage list */}
        <div className="lg:col-span-2">
          {stages.length === 0 ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
            >
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                No stages configured. Add your first stage.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4"
                  style={{
                    borderColor: '#e8e5e0',
                    opacity: stage.isActive ? 1 : 0.5,
                  }}
                >
                  <GripVertical className="h-4 w-4 shrink-0" style={{ color: '#d4d0ca' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                      >
                        {stage.name}
                      </p>
                      {!stage.isActive && (
                        <span
                          className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ color: '#9c9690', backgroundColor: '#f3f2ef' }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                      Order: {stage.sortOrder} · {stage._count.questions} question{stage._count.questions !== 1 ? 's' : ''} · {stage._count.jobCandidates} candidate{stage._count.jobCandidates !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <StageActions stage={stage} />
                  <Link
                    href={`/settings/stages/${stage.id}/questions`}
                    className="flex items-center gap-1 text-xs font-medium shrink-0 transition-colors hover:opacity-80"
                    style={{ fontFamily: 'var(--font-body)', color: '#e8913a' }}
                  >
                    Questions
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add stage form */}
        <div>
          <div
            className="rounded-xl border bg-white p-5"
            style={{ borderColor: '#e8e5e0' }}
          >
            <p
              className="text-sm font-semibold mb-4"
              style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
            >
              Add New Stage
            </p>
            <CreateStageForm nextOrder={stages.length + 1} />
          </div>
        </div>
      </div>
    </div>
  )
}

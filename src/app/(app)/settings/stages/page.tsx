import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getCurrentUser } from '@/lib/auth'
import { getStages } from '@/actions/settings'
import { CreateStageForm } from '@/components/settings/create-stage-form'
import { SortableStageList } from '@/components/settings/sortable-stage-list'

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
            <SortableStageList initialStages={stages} />
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

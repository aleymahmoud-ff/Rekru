import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getCandidatesForStage } from '@/actions/interviews'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ChevronRight } from 'lucide-react'

type Props = { params: Promise<{ stageId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stageId } = await params
  const stage = await prisma.interviewStage.findUnique({ where: { id: stageId }, select: { name: true } })
  return { title: stage ? `${stage.name} — Interviews — Rekru` : 'Stage Not Found' }
}

export default async function StageCandidatesPage({ params }: Props) {
  const { stageId } = await params
  const [stage, user] = await Promise.all([
    prisma.interviewStage.findUnique({ where: { id: stageId }, select: { id: true, name: true } }),
    getCurrentUser(),
  ])

  if (!stage) notFound()

  // Non-admin: if they have any stage access entries, restrict to only those stages
  if (user && user.role !== 'admin') {
    const [stageAccess, totalAccess] = await Promise.all([
      prisma.userStageAccess.findUnique({
        where: { userId_stageId: { userId: user.id, stageId } },
      }),
      prisma.userStageAccess.count({ where: { userId: user.id } }),
    ])
    // Only block if user has configured stage access AND this stage isn't in it
    if (totalAccess > 0 && !stageAccess) notFound()
  }

  const candidates = await getCandidatesForStage(stageId)

  return (
    <div>
      <PageHeader
        title={stage.name}
        description={`${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} ready for interview`}
      />

      {candidates.length === 0 ? (
        <div
          className="rounded-xl border p-12 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
        >
          <p
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
          >
            No candidates at this stage
          </p>
          <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
            Candidates will appear here when they reach this stage
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {candidates.map((jc) => (
            <Link
              key={jc.id}
              href={`/interviews/${stageId}/${jc.id}`}
              className="group flex items-center justify-between rounded-xl border bg-white px-5 py-4 transition-all duration-200 hover:shadow-md"
              style={{ borderColor: '#e8e5e0' }}
            >
              <div className="min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
                >
                  {jc.candidate.fullName}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}
                >
                  {jc.job.title} · {jc.candidate.email}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-sm font-medium"
                  style={{ fontFamily: 'var(--font-body)', color: '#e8913a' }}
                >
                  Conduct Interview
                </span>
                <ChevronRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  style={{ color: '#e8913a' }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

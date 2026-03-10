import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getCurrentUser } from '@/lib/auth'
import { getStageWithQuestions } from '@/actions/settings'
import { CreateQuestionForm } from '@/components/settings/create-question-form'
import { QuestionCard } from '@/components/settings/question-card'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const stage = await getStageWithQuestions(id)
  return { title: stage ? `${stage.name} Questions — Rekru` : 'Not Found' }
}

export default async function StageQuestionsPage({ params }: Props) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/dashboard')

  const { id } = await params
  const stage = await getStageWithQuestions(id)
  if (!stage) notFound()

  return (
    <div>
      <PageHeader
        title={`${stage.name} — Questions`}
        description="Configure questions and answer options for this stage"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Questions list */}
        <div className="lg:col-span-2 space-y-4">
          {stage.questions.length === 0 ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
            >
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                No questions yet. Add your first question.
              </p>
            </div>
          ) : (
            stage.questions.map((question) => (
              <QuestionCard key={question.id} question={question} stageId={stage.id} />
            ))
          )}
        </div>

        {/* Add question form */}
        <div>
          <div
            className="rounded-xl border bg-white p-5"
            style={{ borderColor: '#e8e5e0' }}
          >
            <p
              className="text-sm font-semibold mb-4"
              style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
            >
              Add New Question
            </p>
            <CreateQuestionForm stageId={stage.id} nextOrder={stage.questions.length + 1} />
          </div>
        </div>
      </div>
    </div>
  )
}

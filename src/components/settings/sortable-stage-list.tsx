'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronRight } from 'lucide-react'
import { reorderStages } from '@/actions/settings'
import { StageActions } from './stage-actions'

type Stage = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  _count: { questions: number; jobCandidates: number; interviews: number }
}

function SortableStageRow({ stage }: { stage: Stage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : stage.isActive ? 1 : 0.5,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing p-0.5 rounded"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 shrink-0" style={{ color: '#d4d0ca' }} />
      </button>
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
  )
}

export function SortableStageList({ initialStages }: { initialStages: Stage[] }) {
  const [stages, setStages] = useState(initialStages)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
      ...s,
      sortOrder: i + 1,
    }))

    setStages(reordered)
    startTransition(async () => {
      await reorderStages(reordered.map((s) => s.id))
    })
  }

  return (
    <div className="space-y-2" style={{ opacity: isPending ? 0.7 : 1, transition: 'opacity 0.15s' }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {stages.map((stage) => (
            <SortableStageRow key={stage.id} stage={stage} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

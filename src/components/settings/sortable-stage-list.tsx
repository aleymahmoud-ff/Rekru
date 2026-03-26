'use client'

import { useState, useTransition, useRef } from 'react'
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
import { GripVertical, ChevronRight, Pencil, Check, X, Lock } from 'lucide-react'
import { reorderStages, updateStage } from '@/actions/settings'
import { StageActions } from './stage-actions'

type Stage = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  isFinal: boolean
  _count: { questions: number; jobCandidates: number; interviews: number }
}

function SortableStageRow({ stage, onRename }: { stage: Stage; onRename: (id: string, name: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: stage.isFinal,
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stage.name)
  const [isSaving, startSave] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : stage.isActive ? 1 : 0.5,
    zIndex: isDragging ? 10 : undefined,
  }

  function startEdit() {
    setDraft(stage.name)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function cancelEdit() {
    setEditing(false)
    setDraft(stage.name)
  }

  function saveEdit() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === stage.name) { cancelEdit(); return }
    startSave(async () => {
      await updateStage({ id: stage.id, name: trimmed })
      onRename(stage.id, trimmed)
      setEditing(false)
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4"
    >
      {stage.isFinal ? (
        <div className="p-0.5" title="Final stage — cannot be reordered">
          <Lock className="h-4 w-4 shrink-0" style={{ color: '#9c9690' }} />
        </div>
      ) : (
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-0.5 rounded"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 shrink-0" style={{ color: '#d4d0ca' }} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
              disabled={isSaving}
              className="text-sm font-medium border rounded px-2 py-0.5 flex-1 min-w-0 focus:outline-none focus:ring-1"
              style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a', borderColor: '#e8913a' }}
            />
            <button onClick={saveEdit} disabled={isSaving} className="p-1 rounded hover:bg-green-50">
              <Check className="h-3.5 w-3.5 text-green-600" />
            </button>
            <button onClick={cancelEdit} disabled={isSaving} className="p-1 rounded hover:bg-red-50">
              <X className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-medium"
              style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
            >
              {stage.name}
            </p>
            {stage.isFinal && (
              <span
                className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ color: '#1e3a5f', backgroundColor: '#e0ecf8' }}
              >
                Final
              </span>
            )}
            {!stage.isActive && (
              <span
                className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ color: '#9c9690', backgroundColor: '#f3f2ef' }}
              >
                Inactive
              </span>
            )}
            <button onClick={startEdit} className="p-0.5 rounded hover:bg-[#f3f2ef] transition-colors" title="Rename">
              <Pencil className="h-3 w-3" style={{ color: '#9c9690' }} />
            </button>
          </div>
        )}
        <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
          Order: {stage.sortOrder} · {stage._count.questions} question{stage._count.questions !== 1 ? 's' : ''} · {stage._count.jobCandidates} candidate{stage._count.jobCandidates !== 1 ? 's' : ''}
        </p>
      </div>
      {!stage.isFinal && <StageActions stage={stage} />}
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

  function handleRename(id: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = stages.findIndex((s) => s.id === active.id)
    let newIndex = stages.findIndex((s) => s.id === over.id)

    // Prevent dropping after the final stage
    const finalIndex = stages.findIndex((s) => s.isFinal)
    if (finalIndex >= 0 && newIndex >= finalIndex) {
      newIndex = finalIndex - 1
    }
    if (newIndex < 0 || newIndex === oldIndex) return

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
            <SortableStageRow key={stage.id} stage={stage} onRename={handleRename} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

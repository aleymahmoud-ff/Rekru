'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  createStageSchema,
  updateStageSchema,
  createQuestionSchema,
  updateQuestionSchema,
  createOptionSchema,
  updateAppSettingsSchema,
  approveUserSchema,
  updateUserStatusSchema,
} from '@/lib/validations/settings'

type ActionResult = { success: boolean; error?: string }

async function requireAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  if (user.role !== 'admin') return { success: false, error: 'Admin access required' }
  return null
}

// ---------- Stages ----------

export async function createStage(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = createStageSchema.safeParse({
    name: formData.get('name'),
    sortOrder: formData.get('sortOrder'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  await prisma.interviewStage.create({ data: parsed.data })
  revalidatePath('/settings/stages')
  return { success: true }
}

export async function updateStage(data: unknown): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = updateStageSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { id, ...updates } = parsed.data
  await prisma.interviewStage.update({ where: { id }, data: updates })
  revalidatePath('/settings/stages')
  return { success: true }
}

export async function deleteStage(stageId: string): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  // Check if any candidates are at this stage
  const count = await prisma.jobCandidate.count({ where: { currentStageId: stageId } })
  if (count > 0) return { success: false, error: `Cannot delete: ${count} candidate(s) are at this stage` }

  await prisma.interviewStage.delete({ where: { id: stageId } })
  revalidatePath('/settings/stages')
  return { success: true }
}

export async function reorderStages(orderedIds: string[]): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.interviewStage.update({ where: { id }, data: { sortOrder: index + 1 } })
    )
  )
  revalidatePath('/settings/stages')
  return { success: true }
}

export async function getStages() {
  return prisma.interviewStage.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { questions: true, jobCandidates: true, interviews: true } },
    },
  })
}

// ---------- Questions ----------

export async function createQuestion(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = createQuestionSchema.safeParse({
    stageId: formData.get('stageId'),
    questionText: formData.get('questionText'),
    sortOrder: formData.get('sortOrder'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  await prisma.stageQuestion.create({ data: parsed.data })
  revalidatePath(`/settings/stages/${parsed.data.stageId}/questions`)
  return { success: true }
}

export async function updateQuestion(data: unknown): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = updateQuestionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { id, ...updates } = parsed.data
  await prisma.stageQuestion.update({ where: { id }, data: updates })
  return { success: true }
}

export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  await prisma.stageQuestion.delete({ where: { id: questionId } })
  return { success: true }
}

export async function getStageWithQuestions(stageId: string) {
  return prisma.interviewStage.findUnique({
    where: { id: stageId },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  })
}

// ---------- Options ----------

export async function createOption(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = createOptionSchema.safeParse({
    questionId: formData.get('questionId'),
    label: formData.get('label'),
    value: formData.get('value'),
    sortOrder: formData.get('sortOrder'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  await prisma.questionOption.create({ data: parsed.data })
  return { success: true }
}

export async function deleteOption(optionId: string): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  await prisma.questionOption.delete({ where: { id: optionId } })
  return { success: true }
}

// ---------- Users ----------

export async function getPendingUsers() {
  return prisma.user.findMany({
    where: { status: 'pending' },
    select: { id: true, fullName: true, email: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveUser(data: unknown): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = approveUserSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: 'active', role: parsed.data.role },
  })

  revalidatePath('/settings/users')
  return { success: true }
}

export async function updateUserStatus(data: unknown): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = updateUserStatusSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  // Prevent deactivating yourself
  const currentUser = await getCurrentUser()
  if (currentUser?.id === parsed.data.userId) {
    return { success: false, error: 'You cannot change your own status' }
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.status },
  })

  revalidatePath('/settings/users')
  return { success: true }
}

// ---------- App Settings ----------

export async function getAppSettings() {
  return prisma.appSettings.findFirst({ where: { id: 1 } })
}

export async function updateAppSettings(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = updateAppSettingsSchema.safeParse({
    appName: formData.get('appName') || undefined,
    primaryColor: formData.get('primaryColor') || undefined,
    secondaryColor: formData.get('secondaryColor') || undefined,
    accentColor: formData.get('accentColor') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  })

  revalidatePath('/', 'layout')
  return { success: true }
}

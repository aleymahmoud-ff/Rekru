'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import {
  createStageSchema,
  updateStageSchema,
  createQuestionSchema,
  updateQuestionSchema,
  createOptionSchema,
  updateAppSettingsSchema,
  approveUserSchema,
  updateUserStatusSchema,
  createUserSchema,
  changePasswordSchema,
  setUserAccessSchema,
  setJobAssignmentsSchema,
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

  // Insert before the final stage and bump the final stage's sortOrder
  const finalStage = await prisma.interviewStage.findFirst({ where: { isFinal: true }, select: { id: true, sortOrder: true } })
  if (finalStage) {
    const insertOrder = finalStage.sortOrder
    await prisma.$transaction([
      prisma.interviewStage.update({ where: { id: finalStage.id }, data: { sortOrder: insertOrder + 1 } }),
      prisma.interviewStage.create({ data: { ...parsed.data, sortOrder: insertOrder } }),
    ])
  } else {
    await prisma.interviewStage.create({ data: parsed.data })
  }

  revalidatePath('/settings/stages')
  return { success: true }
}

export async function updateStage(data: unknown): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = updateStageSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { id, ...updates } = parsed.data

  // Protect final stage from being deactivated or reordered
  const stage = await prisma.interviewStage.findUnique({ where: { id }, select: { isFinal: true } })
  if (stage?.isFinal) {
    if (updates.isActive === false) return { success: false, error: 'The final stage cannot be deactivated' }
    if (updates.sortOrder !== undefined) return { success: false, error: 'The final stage must remain last' }
  }

  await prisma.interviewStage.update({ where: { id }, data: updates })
  revalidatePath('/settings/stages')
  return { success: true }
}

export async function deleteStage(stageId: string): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  // Protect final stage from deletion
  const stage = await prisma.interviewStage.findUnique({ where: { id: stageId }, select: { isFinal: true } })
  if (stage?.isFinal) return { success: false, error: 'The final stage cannot be deleted' }

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

  // Ensure the final stage stays last
  const finalStage = await prisma.interviewStage.findFirst({ where: { isFinal: true }, select: { id: true } })
  if (finalStage) {
    const filtered = orderedIds.filter((id) => id !== finalStage.id)
    filtered.push(finalStage.id)
    orderedIds = filtered
  }

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
    scope: formData.get('scope') || 'universal',
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

export async function getJobSpecificQuestions() {
  const stages = await prisma.interviewStage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      questions: {
        where: { isActive: true, scope: 'job_specific' },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, questionText: true, sortOrder: true },
      },
    },
  })
  return stages
    .filter((s) => s.questions.length > 0)
    .map((s) => ({
      stage: { id: s.id, name: s.name, sortOrder: s.sortOrder },
      questions: s.questions,
    }))
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

export async function createUser(data: unknown): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = createUserSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { fullName, email, password, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { success: false, error: 'A user with this email already exists' }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { fullName, email, passwordHash, role, status: 'active' },
  })

  revalidatePath('/settings/users')
  return { success: true }
}

export async function changePassword(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
  if (!dbUser) return { success: false, error: 'User not found' }

  const match = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash)
  if (!match) return { success: false, error: 'Current password is incorrect' }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

  return { success: true }
}

export async function getActiveStagesBasic() {
  return prisma.interviewStage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })
}

export async function getUserAccess(userId: string) {
  const stageRows = await prisma.userStageAccess.findMany({ where: { userId }, select: { stageId: true } })
  return { stageIds: stageRows.map((r) => r.stageId) }
}

export async function setUserAccess(data: unknown): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = setUserAccessSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { userId, stageIds } = parsed.data

  await prisma.$transaction([
    prisma.userStageAccess.deleteMany({ where: { userId } }),
    ...(stageIds.length > 0
      ? [prisma.userStageAccess.createMany({ data: stageIds.map((stageId) => ({ userId, stageId })), skipDuplicates: true })]
      : []),
  ])

  revalidatePath('/settings/users')
  return { success: true }
}

export async function getJobAssignedUsers(jobId: string) {
  const rows = await prisma.jobAssignment.findMany({
    where: { jobId },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  })
  return rows.map((r) => r.user)
}

export async function setJobAssignments(data: unknown): Promise<ActionResult> {
  const err = await requireAdmin()
  if (err) return err

  const parsed = setJobAssignmentsSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { jobId, userIds } = parsed.data

  await prisma.$transaction([
    prisma.jobAssignment.deleteMany({ where: { jobId } }),
    ...(userIds.length > 0
      ? [prisma.jobAssignment.createMany({ data: userIds.map((userId) => ({ jobId, userId })), skipDuplicates: true })]
      : []),
  ])

  revalidatePath(`/jobs/${jobId}`)
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

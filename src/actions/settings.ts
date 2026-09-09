'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { APP_SETTINGS_ID } from '@/lib/app-settings'
import { generatePassword } from '@/lib/password'
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
  resetUserPasswordSchema,
  changePasswordSchema,
  setUserAccessSchema,
  setJobAssignmentsSchema,
} from '@/lib/validations/settings'

type ActionResult = { success: boolean; error?: string }

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' as const, user: null }
  // Status is otherwise only enforced at login (see `login` in actions/auth.ts)
  // and the middleware checks cookie presence only, so a session issued before
  // the account was deactivated would still pass a role-only check.
  if (user.status !== 'active') return { error: 'Your account is not active' as const, user: null }
  if (user.role !== 'admin') return { error: 'Admin access required' as const, user: null }
  return { error: null, user }
}

// ---------- Stages ----------

export async function createStage(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = createStageSchema.safeParse({
    name: formData.get('name'),
    sortOrder: formData.get('sortOrder'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  // Insert before the final stage and bump the final stage's sortOrder
  const finalStage = await prisma.interviewStage.findFirst({
    where: { isFinal: true },
    select: { id: true, sortOrder: true },
  })
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
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = updateStageSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { id, ...updates } = parsed.data

  // Protect the final stage from being deactivated or reordered
  const stage = await prisma.interviewStage.findUnique({
    where: { id },
    select: { isFinal: true },
  })
  if (!stage) return { success: false, error: 'Stage not found' }
  if (stage.isFinal) {
    if (updates.isActive === false) return { success: false, error: 'The final stage cannot be deactivated' }
    if (updates.sortOrder !== undefined) return { success: false, error: 'The final stage must remain last' }
  }

  await prisma.interviewStage.update({ where: { id }, data: updates })
  revalidatePath('/settings/stages')
  return { success: true }
}

export async function deleteStage(stageId: string): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  // Protect the final stage from deletion
  const stage = await prisma.interviewStage.findUnique({
    where: { id: stageId },
    select: { isFinal: true },
  })
  if (!stage) return { success: false, error: 'Stage not found' }
  if (stage.isFinal) return { success: false, error: 'The final stage cannot be deleted' }

  // Check if any candidates are at this stage
  const count = await prisma.jobCandidate.count({ where: { currentStageId: stageId } })
  if (count > 0) return { success: false, error: `Cannot delete: ${count} candidate(s) are at this stage` }

  await prisma.interviewStage.delete({ where: { id: stageId } })
  revalidatePath('/settings/stages')
  return { success: true }
}

export async function reorderStages(orderedIds: string[]): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  // Ensure the final stage stays last
  const finalStage = await prisma.interviewStage.findFirst({
    where: { isFinal: true },
    select: { id: true },
  })
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
  const user = await getCurrentUser()
  if (!user) return []

  return prisma.interviewStage.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { questions: true, jobCandidates: true, interviews: true } },
    },
  })
}

// ---------- Questions ----------

export async function createQuestion(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = createQuestionSchema.safeParse({
    stageId: formData.get('stageId'),
    questionText: formData.get('questionText'),
    sortOrder: formData.get('sortOrder'),
    scope: formData.get('scope') || 'universal',
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const stage = await prisma.interviewStage.findUnique({
    where: { id: parsed.data.stageId },
    select: { id: true },
  })
  if (!stage) return { success: false, error: 'Stage not found' }

  await prisma.stageQuestion.create({ data: parsed.data })
  revalidatePath(`/settings/stages/${parsed.data.stageId}/questions`)
  return { success: true }
}

export async function updateQuestion(data: unknown): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = updateQuestionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { id, ...updates } = parsed.data

  const existing = await prisma.stageQuestion.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return { success: false, error: 'Question not found' }

  await prisma.stageQuestion.update({ where: { id }, data: updates })
  return { success: true }
}

export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const existing = await prisma.stageQuestion.findUnique({ where: { id: questionId }, select: { id: true } })
  if (!existing) return { success: false, error: 'Question not found' }

  await prisma.stageQuestion.delete({ where: { id: questionId } })
  return { success: true }
}

export async function getStageWithQuestions(stageId: string) {
  const user = await getCurrentUser()
  if (!user) return null

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
  const user = await getCurrentUser()
  if (!user) return []

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
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = createOptionSchema.safeParse({
    questionId: formData.get('questionId'),
    label: formData.get('label'),
    value: formData.get('value'),
    sortOrder: formData.get('sortOrder'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const question = await prisma.stageQuestion.findUnique({
    where: { id: parsed.data.questionId },
    select: { id: true },
  })
  if (!question) return { success: false, error: 'Question not found' }

  await prisma.questionOption.create({ data: parsed.data })
  return { success: true }
}

export async function deleteOption(optionId: string): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const option = await prisma.questionOption.findUnique({ where: { id: optionId }, select: { id: true } })
  if (!option) return { success: false, error: 'Option not found' }

  await prisma.questionOption.delete({ where: { id: optionId } })
  return { success: true }
}

// ---------- Users ----------

export async function getPendingUsers() {
  const user = await getCurrentUser()
  if (!user) return []

  return prisma.user.findMany({
    where: { status: 'pending' },
    select: { id: true, fullName: true, email: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAllUsers() {
  const user = await getCurrentUser()
  if (!user) return []

  return prisma.user.findMany({
    select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveUser(data: unknown): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = approveUserSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } })
  if (!target) return { success: false, error: 'User not found' }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: 'active', role: parsed.data.role },
  })

  revalidatePath('/settings/users')
  return { success: true }
}

export async function updateUserStatus(data: unknown): Promise<ActionResult> {
  const { error, user } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = updateUserStatusSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  // Prevent deactivating yourself
  if (user.id === parsed.data.userId) {
    return { success: false, error: 'You cannot change your own status' }
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } })
  if (!target) return { success: false, error: 'User not found' }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.status },
  })

  revalidatePath('/settings/users')
  return { success: true }
}

export async function createUser(data: unknown): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = createUserSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { fullName, email, password, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
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

/**
 * Admin-only password reset for another user.
 *
 * Returns the new plaintext password so the admin can hand it to the user —
 * this app has no email delivery (see MVP scope), so the one-time display in
 * the dialog is the only way it reaches them. The plaintext is never persisted:
 * only the bcrypt hash is written, and the value is not logged.
 */
export async function resetUserPassword(
  data: unknown
): Promise<ActionResult & { password?: string }> {
  const { error, user } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = resetUserPasswordSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  // Admins change their own password from Settings -> Account, where the
  // current password is verified first.
  if (user.id === parsed.data.userId) {
    return { success: false, error: 'Use Settings \u2192 Account to change your own password' }
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  })
  if (!target) return { success: false, error: 'User not found' }

  const newPassword = parsed.data.password ?? generatePassword()
  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({ where: { id: parsed.data.userId }, data: { passwordHash } })

  revalidatePath('/settings/users')
  return { success: true, password: newPassword }
}

export async function getActiveStagesBasic() {
  const user = await getCurrentUser()
  if (!user) return []

  return prisma.interviewStage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })
}

export async function getUserAccess(userId: string) {
  const user = await getCurrentUser()
  if (!user) return { stageIds: [] }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!target) return { stageIds: [] }

  const stageRows = await prisma.userStageAccess.findMany({ where: { userId }, select: { stageId: true } })
  return { stageIds: stageRows.map((r) => r.stageId) }
}

export async function setUserAccess(data: unknown): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = setUserAccessSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { userId, stageIds } = parsed.data

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!target) return { success: false, error: 'User not found' }

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
  const user = await getCurrentUser()
  if (!user) return []

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } })
  if (!job) return []

  const rows = await prisma.jobAssignment.findMany({
    where: { jobId },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  })
  return rows.map((r) => r.user)
}

export async function setJobAssignments(data: unknown): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = setJobAssignmentsSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { jobId, userIds } = parsed.data

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } })
  if (!job) return { success: false, error: 'Job not found' }

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
  const user = await getCurrentUser()
  if (!user) return null

  return prisma.appSettings.findUnique({ where: { id: APP_SETTINGS_ID } })
}

export async function updateAppSettings(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { error } = await requireAdmin()
  if (error) return { success: false, error }

  const parsed = updateAppSettingsSchema.safeParse({
    appName: formData.get('appName') || undefined,
    primaryColor: formData.get('primaryColor') || undefined,
    secondaryColor: formData.get('secondaryColor') || undefined,
    accentColor: formData.get('accentColor') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  await prisma.appSettings.upsert({
    where: { id: APP_SETTINGS_ID },
    update: parsed.data,
    create: { id: APP_SETTINGS_ID, ...parsed.data },
  })

  revalidatePath('/', 'layout')
  return { success: true }
}

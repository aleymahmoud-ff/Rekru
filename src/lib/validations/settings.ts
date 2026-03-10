import { z } from 'zod'

export const createStageSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  sortOrder: z.coerce.number().int().min(0),
})

export const updateStageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(255).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export const createQuestionSchema = z.object({
  stageId: z.string().min(1),
  questionText: z.string().min(2, 'Question text is required').max(1000),
  sortOrder: z.coerce.number().int().min(0),
})

export const updateQuestionSchema = z.object({
  id: z.string().min(1),
  questionText: z.string().min(2).max(1000).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export const createOptionSchema = z.object({
  questionId: z.string().min(1),
  label: z.string().min(1, 'Label is required').max(255),
  value: z.coerce.number().int(),
  sortOrder: z.coerce.number().int().min(0),
})

export const updateAppSettingsSchema = z.object({
  appName: z.string().min(1).max(255).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color').optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color').optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color').optional(),
})

export const approveUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'user']),
})

export const updateUserStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(['active', 'inactive']),
})

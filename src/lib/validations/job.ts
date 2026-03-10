import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(255),
  description: z.string().optional(),
})

export const updateJobSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, 'Title must be at least 2 characters').max(255).optional(),
  description: z.string().optional(),
})

export const updateJobStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['open', 'closed']),
})

export const linkJobQuestionsSchema = z.object({
  jobId: z.string().min(1),
  questionIds: z.array(z.string().min(1)),
})

export type CreateJobInput = z.infer<typeof createJobSchema>

import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(255),
  description: z.string().optional(),
})

export const updateJobStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'closed']),
})

export type CreateJobInput = z.infer<typeof createJobSchema>

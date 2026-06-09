import { z } from 'zod'

export const addCandidateSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email'),
  phone: z.string().min(5, 'Phone must be at least 5 characters').max(50),
})

export type AddCandidateInput = z.infer<typeof addCandidateSchema>

import { z } from 'zod'

export const conductInterviewSchema = z.object({
  jobCandidateId: z.string().min(1),
  stageId: z.string().min(1),
  outcome: z.enum(['pass', 'fail', 'on_hold']),
  overallNotes: z.string().optional(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      optionId: z.string().min(1),
      notes: z.string().optional(),
    })
  ),
})

export type ConductInterviewInput = z.infer<typeof conductInterviewSchema>

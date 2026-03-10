import { z } from 'zod'

export const conductInterviewSchema = z.object({
  jobCandidateId: z.string().uuid(),
  stageId: z.string().uuid(),
  outcome: z.enum(['pass', 'fail', 'on_hold']),
  overallNotes: z.string().optional(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      optionId: z.string().uuid(),
      notes: z.string().optional(),
    })
  ),
})

export type ConductInterviewInput = z.infer<typeof conductInterviewSchema>

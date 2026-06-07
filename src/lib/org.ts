import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

/**
 * Returns the org context for the current user, verifying they belong to
 * the org identified by slug. Redirects to /login if not authenticated or
 * if the slug doesn't match the user's org.
 */
export async function getOrgContext(slug: string) {
  const user = await getCurrentUser()
  if (!user || user.orgSlug !== slug) redirect('/login')
  return { orgId: user.orgId, userId: user.id, user }
}

/**
 * Builds an org-scoped path for use in redirects and revalidation tags.
 * Example: orgPath('acme', '/dashboard') → '/acme/dashboard'
 */
export function orgPath(slug: string, path: string): string {
  return `/${slug}${path}`
}

// ---------------------------------------------------------------------------
// Leaf-table tenant guards
//
// These tables carry no org_id column — tenancy is inherited through their FK
// chain back to interview_stages (which is org-scoped). Use these to verify a
// leaf row belongs to the caller's org BEFORE mutating it, since the DB cannot
// enforce isolation on a column it doesn't have.
// ---------------------------------------------------------------------------

/** True if the stage exists and belongs to the given org. */
export async function isStageInOrg(stageId: string, orgId: string): Promise<boolean> {
  const row = await prisma.interviewStage.findFirst({
    where: { id: stageId, orgId },
    select: { id: true },
  })
  return row !== null
}

/** True if the question exists and its stage belongs to the given org. */
export async function isQuestionInOrg(questionId: string, orgId: string): Promise<boolean> {
  const row = await prisma.stageQuestion.findFirst({
    where: { id: questionId, stage: { orgId } },
    select: { id: true },
  })
  return row !== null
}

/** True if the option exists and its question's stage belongs to the given org. */
export async function isOptionInOrg(optionId: string, orgId: string): Promise<boolean> {
  const row = await prisma.questionOption.findFirst({
    where: { id: optionId, question: { stage: { orgId } } },
    select: { id: true },
  })
  return row !== null
}

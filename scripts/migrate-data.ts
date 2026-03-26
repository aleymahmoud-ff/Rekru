/**
 * Rekru: Vercel → Cranl Data Migration
 *
 * Usage:
 *   SOURCE_DATABASE_URL="postgres://...vercel..." \
 *   TARGET_DATABASE_URL="postgresql://...cranl-external..." \
 *   npx tsx scripts/migrate-data.ts
 */

import { PrismaClient } from '@prisma/client'

const SOURCE_URL = process.env.SOURCE_DATABASE_URL
const TARGET_URL = process.env.TARGET_DATABASE_URL

if (!SOURCE_URL || !TARGET_URL) {
  console.error('ERROR: Set SOURCE_DATABASE_URL and TARGET_DATABASE_URL')
  process.exit(1)
}

const source = new PrismaClient({ datasources: { db: { url: SOURCE_URL } } })
const target = new PrismaClient({ datasources: { db: { url: TARGET_URL } } })

async function migrate() {
  console.log('=== Rekru Data Migration ===\n')

  // 1. App Settings
  console.log('[1/12] Migrating app_settings...')
  const settings = await source.appSettings.findFirst()
  if (settings) {
    await target.appSettings.upsert({
      where: { id: settings.id },
      update: settings,
      create: settings,
    })
  }
  console.log('  ✓ app_settings done')

  // 2. Users
  console.log('[2/12] Migrating users...')
  const users = await source.user.findMany()
  for (const user of users) {
    await target.user.upsert({ where: { id: user.id }, update: user, create: user })
  }
  console.log(`  ✓ ${users.length} users`)

  // 3. Interview Stages
  console.log('[3/12] Migrating interview_stages...')
  const stages = await source.interviewStage.findMany()
  for (const stage of stages) {
    await target.interviewStage.upsert({ where: { id: stage.id }, update: stage, create: stage })
  }
  console.log(`  ✓ ${stages.length} stages`)

  // 4. Jobs
  console.log('[4/12] Migrating jobs...')
  const jobs = await source.job.findMany()
  for (const job of jobs) {
    await target.job.upsert({ where: { id: job.id }, update: job, create: job })
  }
  console.log(`  ✓ ${jobs.length} jobs`)

  // 5. Candidates
  console.log('[5/12] Migrating candidates...')
  const candidates = await source.candidate.findMany()
  for (const c of candidates) {
    await target.candidate.upsert({ where: { id: c.id }, update: c, create: c })
  }
  console.log(`  ✓ ${candidates.length} candidates`)

  // 6. Stage Questions
  console.log('[6/12] Migrating stage_questions...')
  const questions = await source.stageQuestion.findMany()
  for (const q of questions) {
    await target.stageQuestion.upsert({ where: { id: q.id }, update: q, create: q })
  }
  console.log(`  ✓ ${questions.length} questions`)

  // 7. Question Options
  console.log('[7/12] Migrating question_options...')
  const options = await source.questionOption.findMany()
  for (const o of options) {
    await target.questionOption.upsert({ where: { id: o.id }, update: o, create: o })
  }
  console.log(`  ✓ ${options.length} options`)

  // 8. Job Candidates
  console.log('[8/12] Migrating job_candidates...')
  const jobCandidates = await source.jobCandidate.findMany()
  for (const jc of jobCandidates) {
    await target.jobCandidate.upsert({ where: { id: jc.id }, update: jc, create: jc })
  }
  console.log(`  ✓ ${jobCandidates.length} job_candidates`)

  // 9. Interviews
  console.log('[9/12] Migrating interviews...')
  const interviews = await source.interview.findMany()
  for (const i of interviews) {
    await target.interview.upsert({ where: { id: i.id }, update: i, create: i })
  }
  console.log(`  ✓ ${interviews.length} interviews`)

  // 10. Interview Answers
  console.log('[10/12] Migrating interview_answers...')
  const answers = await source.interviewAnswer.findMany()
  for (const a of answers) {
    await target.interviewAnswer.upsert({ where: { id: a.id }, update: a, create: a })
  }
  console.log(`  ✓ ${answers.length} answers`)

  // 11. Job Questions (links)
  console.log('[11/12] Migrating job_questions...')
  const jobQuestions = await source.jobQuestion.findMany()
  for (const jq of jobQuestions) {
    await target.jobQuestion.upsert({ where: { id: jq.id }, update: jq, create: jq })
  }
  console.log(`  ✓ ${jobQuestions.length} job_questions`)

  // 12. User Stage Access + Job Assignments
  console.log('[12/12] Migrating access & assignments...')
  const stageAccess = await source.userStageAccess.findMany()
  for (const sa of stageAccess) {
    await target.userStageAccess.upsert({ where: { id: sa.id }, update: sa, create: sa })
  }
  const jobAssignments = await source.jobAssignment.findMany()
  for (const ja of jobAssignments) {
    await target.jobAssignment.upsert({ where: { id: ja.id }, update: ja, create: ja })
  }
  console.log(`  ✓ ${stageAccess.length} stage_access, ${jobAssignments.length} job_assignments`)

  // Verify
  console.log('\n=== Verification ===')
  const tables = [
    ['users', target.user.count()],
    ['jobs', target.job.count()],
    ['candidates', target.candidate.count()],
    ['job_candidates', target.jobCandidate.count()],
    ['interview_stages', target.interviewStage.count()],
    ['stage_questions', target.stageQuestion.count()],
    ['question_options', target.questionOption.count()],
    ['interviews', target.interview.count()],
    ['interview_answers', target.interviewAnswer.count()],
  ] as const

  for (const [name, countPromise] of tables) {
    const count = await countPromise
    console.log(`  ${name}: ${count} rows`)
  }

  console.log('\n✓ Migration complete!')
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await source.$disconnect()
    await target.$disconnect()
  })

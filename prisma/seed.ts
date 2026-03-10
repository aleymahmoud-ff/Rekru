import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ---------------------------------------------------------------------------
  // 1. Admin user
  // ---------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash('Admin123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rekru.com' },
    update: {},
    create: {
      email: 'admin@rekru.com',
      fullName: 'Admin',
      passwordHash,
      role: 'admin',
      status: 'active',
    },
  })

  console.log(`Admin user: ${admin.email}`)

  // ---------------------------------------------------------------------------
  // 2. App settings
  // ---------------------------------------------------------------------------
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      appName: 'Rekru',
      primaryColor: '#1e3a5f',
      secondaryColor: '#f8f7f4',
      accentColor: '#e8913a',
    },
  })

  console.log('App settings seeded.')

  // ---------------------------------------------------------------------------
  // 3. Interview stages
  // ---------------------------------------------------------------------------
  const hrStage = await prisma.interviewStage.upsert({
    where: { id: 'stage-hr-interview' },
    update: {},
    create: {
      id: 'stage-hr-interview',
      name: 'HR Interview',
      sortOrder: 1,
      isActive: true,
    },
  })

  const techStage = await prisma.interviewStage.upsert({
    where: { id: 'stage-technical-interview' },
    update: {},
    create: {
      id: 'stage-technical-interview',
      name: 'Technical Interview',
      sortOrder: 2,
      isActive: true,
    },
  })

  const finalStage = await prisma.interviewStage.upsert({
    where: { id: 'stage-final-interview' },
    update: {},
    create: {
      id: 'stage-final-interview',
      name: 'Final Interview',
      sortOrder: 3,
      isActive: true,
    },
  })

  console.log('Interview stages seeded.')

  // ---------------------------------------------------------------------------
  // 4. Stage questions and options
  // ---------------------------------------------------------------------------

  // Helper: create question + options in one call
  async function seedQuestion(
    id: string,
    stageId: string,
    questionText: string,
    sortOrder: number,
    options: Array<{ id: string; label: string; value: number; sortOrder: number }>
  ) {
    const question = await prisma.stageQuestion.upsert({
      where: { id },
      update: {},
      create: {
        id,
        stageId,
        questionText,
        sortOrder,
        isActive: true,
      },
    })

    for (const opt of options) {
      await prisma.questionOption.upsert({
        where: { id: opt.id },
        update: {},
        create: {
          id: opt.id,
          questionId: question.id,
          label: opt.label,
          value: opt.value,
          sortOrder: opt.sortOrder,
        },
      })
    }

    return question
  }

  const standardOptions = (questionId: string) => [
    { id: `${questionId}-opt-1`, label: 'Below Expectations', value: 1, sortOrder: 1 },
    { id: `${questionId}-opt-2`, label: 'Meets Expectations',  value: 2, sortOrder: 2 },
    { id: `${questionId}-opt-3`, label: 'Exceeds Expectations', value: 3, sortOrder: 3 },
  ]

  // HR Interview questions
  await seedQuestion(
    'q-hr-communication',
    hrStage.id,
    'Communication Skills',
    1,
    standardOptions('q-hr-communication')
  )
  await seedQuestion(
    'q-hr-professionalism',
    hrStage.id,
    'Professionalism',
    2,
    standardOptions('q-hr-professionalism')
  )
  await seedQuestion(
    'q-hr-cultural-fit',
    hrStage.id,
    'Cultural Fit',
    3,
    standardOptions('q-hr-cultural-fit')
  )

  // Technical Interview questions
  await seedQuestion(
    'q-tech-knowledge',
    techStage.id,
    'Technical Knowledge',
    1,
    standardOptions('q-tech-knowledge')
  )
  await seedQuestion(
    'q-tech-problem-solving',
    techStage.id,
    'Problem Solving',
    2,
    standardOptions('q-tech-problem-solving')
  )

  // Final Interview question
  await seedQuestion(
    'q-final-hire',
    finalStage.id,
    'Hire this candidate?',
    1,
    [
      { id: 'q-final-hire-opt-0', label: 'Not Hired', value: 0, sortOrder: 1 },
      { id: 'q-final-hire-opt-1', label: 'Hired',     value: 1, sortOrder: 2 },
    ]
  )

  console.log('Questions and options seeded.')
  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

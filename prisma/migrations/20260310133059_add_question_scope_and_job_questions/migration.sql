-- CreateEnum
CREATE TYPE "question_scope" AS ENUM ('universal', 'job_specific');

-- AlterTable
ALTER TABLE "stage_questions" ADD COLUMN     "scope" "question_scope" NOT NULL DEFAULT 'universal';

-- CreateTable
CREATE TABLE "job_questions" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,

    CONSTRAINT "job_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_questions_job_idx" ON "job_questions"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_questions_job_id_question_id_key" ON "job_questions"("job_id", "question_id");

-- AddForeignKey
ALTER TABLE "job_questions" ADD CONSTRAINT "job_questions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_questions" ADD CONSTRAINT "job_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "stage_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

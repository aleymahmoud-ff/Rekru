-- CreateTable
CREATE TABLE "user_stage_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,

    CONSTRAINT "user_stage_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,

    CONSTRAINT "job_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_stage_access_user_id_stage_id_key" ON "user_stage_access"("user_id", "stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_assignments_user_id_job_id_key" ON "job_assignments"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "user_stage_access" ADD CONSTRAINT "user_stage_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stage_access" ADD CONSTRAINT "user_stage_access_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "interview_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

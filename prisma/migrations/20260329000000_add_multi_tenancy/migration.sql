-- CreateTable: organizations
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(63) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique slug
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- Insert default organization for existing data
INSERT INTO "organizations" ("id", "name", "slug", "created_at", "updated_at")
VALUES ('org-default', 'Default Organization', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add org_id to users (nullable first, then backfill, then make required)
ALTER TABLE "users" ADD COLUMN "org_id" TEXT;
UPDATE "users" SET "org_id" = 'org-default';
ALTER TABLE "users" ALTER COLUMN "org_id" SET NOT NULL;
ALTER TABLE "users" DROP CONSTRAINT "users_email_key";
CREATE UNIQUE INDEX "users_org_id_email_key" ON "users"("org_id", "email");
CREATE INDEX "users_org_id_idx" ON "users"("org_id");
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add org_id to jobs
ALTER TABLE "jobs" ADD COLUMN "org_id" TEXT;
UPDATE "jobs" SET "org_id" = 'org-default';
ALTER TABLE "jobs" ALTER COLUMN "org_id" SET NOT NULL;
CREATE INDEX "jobs_org_id_idx" ON "jobs"("org_id");
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add org_id to candidates
ALTER TABLE "candidates" ADD COLUMN "org_id" TEXT;
UPDATE "candidates" SET "org_id" = 'org-default';
ALTER TABLE "candidates" ALTER COLUMN "org_id" SET NOT NULL;
ALTER TABLE "candidates" DROP CONSTRAINT "candidates_email_key";
CREATE UNIQUE INDEX "candidates_org_id_email_key" ON "candidates"("org_id", "email");
CREATE INDEX "candidates_org_id_idx" ON "candidates"("org_id");
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add org_id to interview_stages
ALTER TABLE "interview_stages" ADD COLUMN "org_id" TEXT;
UPDATE "interview_stages" SET "org_id" = 'org-default';
ALTER TABLE "interview_stages" ALTER COLUMN "org_id" SET NOT NULL;
CREATE INDEX "interview_stages_org_id_idx" ON "interview_stages"("org_id");
ALTER TABLE "interview_stages" ADD CONSTRAINT "interview_stages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate app_settings: change PK from int to uuid, add org_id
ALTER TABLE "app_settings" DROP CONSTRAINT "app_settings_pkey";
ALTER TABLE "app_settings" DROP COLUMN "id";
ALTER TABLE "app_settings" ADD COLUMN "id" TEXT NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "app_settings" ADD COLUMN "org_id" TEXT;
UPDATE "app_settings" SET "org_id" = 'org-default';
ALTER TABLE "app_settings" ALTER COLUMN "org_id" SET NOT NULL;
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "app_settings_org_id_key" ON "app_settings"("org_id");
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

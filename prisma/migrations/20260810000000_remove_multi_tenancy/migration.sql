-- Removes multi-tenancy: the app is single-organization again.
--
-- Safe only when exactly one organization holds all rows (verified before this
-- migration was written). Every statement uses IF EXISTS so it also applies
-- cleanly to a database where `is_super_admin` was pushed without a migration.

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_org_id_fkey";
DROP INDEX IF EXISTS "users_org_id_email_key";
DROP INDEX IF EXISTS "users_org_id_idx";
ALTER TABLE "users" DROP COLUMN IF EXISTS "org_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_super_admin";
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "jobs_org_id_fkey";
DROP INDEX IF EXISTS "jobs_org_id_idx";
ALTER TABLE "jobs" DROP COLUMN IF EXISTS "org_id";

-- ---------------------------------------------------------------------------
-- candidates
-- ---------------------------------------------------------------------------
ALTER TABLE "candidates" DROP CONSTRAINT IF EXISTS "candidates_org_id_fkey";
DROP INDEX IF EXISTS "candidates_org_id_email_key";
DROP INDEX IF EXISTS "candidates_org_id_idx";
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "org_id";
CREATE UNIQUE INDEX IF NOT EXISTS "candidates_email_key" ON "candidates"("email");

-- ---------------------------------------------------------------------------
-- interview_stages
-- ---------------------------------------------------------------------------
ALTER TABLE "interview_stages" DROP CONSTRAINT IF EXISTS "interview_stages_org_id_fkey";
DROP INDEX IF EXISTS "interview_stages_org_id_idx";
ALTER TABLE "interview_stages" DROP COLUMN IF EXISTS "org_id";

-- ---------------------------------------------------------------------------
-- app_settings — collapse to a single row keyed on the fixed id 'singleton'
-- ---------------------------------------------------------------------------
ALTER TABLE "app_settings" DROP CONSTRAINT IF EXISTS "app_settings_org_id_fkey";
DROP INDEX IF EXISTS "app_settings_org_id_key";
ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "org_id";

-- Keep the oldest row (there is only one), discard any others, then pin its id.
DELETE FROM "app_settings"
WHERE "id" <> (SELECT "id" FROM "app_settings" ORDER BY "updated_at" ASC LIMIT 1);
UPDATE "app_settings" SET "id" = 'singleton';
ALTER TABLE "app_settings" ALTER COLUMN "id" SET DEFAULT 'singleton';

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS "organizations";

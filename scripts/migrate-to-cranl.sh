#!/bin/bash
# =============================================================================
# Rekru: Vercel → Cranl Data Migration Script
# =============================================================================
#
# Usage:
#   SOURCE_DATABASE_URL="postgres://...vercel..." \
#   TARGET_DATABASE_URL="postgresql://...cranl-external..." \
#   bash scripts/migrate-to-cranl.sh
#
# Prerequisites:
#   - pg_dump and psql installed locally
#   - Source DB (Vercel Postgres) accessible
#   - Target DB (Cranl) with external access enabled from dashboard
#   - Target DB schema already pushed via:
#       DATABASE_URL="<cranl-external>" npx prisma db push
#
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Rekru: Vercel → Cranl Migration ===${NC}"
echo ""

# --- Validate env vars ---
if [ -z "${SOURCE_DATABASE_URL:-}" ]; then
  echo -e "${RED}ERROR: SOURCE_DATABASE_URL is not set.${NC}"
  echo "Set it to your Vercel Postgres connection string."
  exit 1
fi

if [ -z "${TARGET_DATABASE_URL:-}" ]; then
  echo -e "${RED}ERROR: TARGET_DATABASE_URL is not set.${NC}"
  echo "Set it to your Cranl external database connection string."
  exit 1
fi

BACKUP_FILE="rekru-backup-$(date +%Y%m%d-%H%M%S).sql"

# --- Step 1: Dump source database ---
echo -e "${YELLOW}[1/4] Dumping source database (Vercel Postgres)...${NC}"
pg_dump "$SOURCE_DATABASE_URL" \
  -F p \
  --no-owner \
  --no-acl \
  --no-comments \
  -f "$BACKUP_FILE"

echo -e "${GREEN}  ✓ Backup saved to: $BACKUP_FILE${NC}"

# --- Step 2: Push schema to target ---
echo -e "${YELLOW}[2/4] Pushing Prisma schema to target database...${NC}"
DATABASE_URL="$TARGET_DATABASE_URL" npx prisma db push --skip-generate
echo -e "${GREEN}  ✓ Schema pushed${NC}"

# --- Step 3: Restore data to target ---
echo -e "${YELLOW}[3/4] Restoring data to target database (Cranl)...${NC}"
psql "$TARGET_DATABASE_URL" -f "$BACKUP_FILE" 2>&1 | grep -E "^(ERROR|FATAL)" || true
echo -e "${GREEN}  ✓ Data restored${NC}"

# --- Step 4: Verify ---
echo -e "${YELLOW}[4/4] Verifying migration...${NC}"
echo ""

TABLES=("users" "jobs" "candidates" "job_candidates" "interview_stages" "stage_questions" "question_options" "interviews" "interview_answers" "job_questions" "user_stage_access" "job_assignments" "app_settings")

echo "Table                 | Source | Target"
echo "----------------------|--------|-------"
for table in "${TABLES[@]}"; do
  src_count=$(psql "$SOURCE_DATABASE_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')
  tgt_count=$(psql "$TARGET_DATABASE_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')
  printf "%-22s| %-7s| %s\n" "$table" "$src_count" "$tgt_count"
done

echo ""
echo -e "${GREEN}=== Migration complete! ===${NC}"
echo ""
echo "Next steps:"
echo "  1. Disable external access on Cranl database"
echo "  2. Deploy the app: cranl apps deploy <APP_ID>"
echo "  3. Verify login works (sessions will be fresh — users must log in again)"
echo "  4. Update DNS to point to Cranl"
echo "  5. Keep this backup file: $BACKUP_FILE"

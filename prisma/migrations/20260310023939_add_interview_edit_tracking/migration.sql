-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "updated_by" TEXT;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

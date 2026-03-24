-- Run scripts/backfill-financial-year.ts before applying when upgrading from nullable columns.
-- AlterTable
ALTER TABLE "Enquiry" ALTER COLUMN "financialYear" SET NOT NULL;
ALTER TABLE "Enquiry" ALTER COLUMN "sequenceNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_financialYear_sequenceNumber_key" ON "Enquiry"("financialYear", "sequenceNumber");

-- CreateIndex
CREATE INDEX "Enquiry_financialYear_idx" ON "Enquiry"("financialYear");

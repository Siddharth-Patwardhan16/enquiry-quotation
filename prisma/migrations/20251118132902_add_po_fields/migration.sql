-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN "poDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN "purchaseOrderNumber" TEXT,
ADD COLUMN "poValue" DECIMAL(65,30),
ADD COLUMN "poDate" TIMESTAMP(3);

-- AlterEnum
ALTER TYPE "EnquiryStatus" ADD VALUE 'WON';


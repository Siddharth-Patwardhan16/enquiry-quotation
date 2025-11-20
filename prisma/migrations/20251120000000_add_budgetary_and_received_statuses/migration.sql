-- AlterEnum: Add BUDGETARY to EnquiryStatus enum
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'BUDGETARY';

-- AlterEnum: Add RECEIVED to QuotationStatus enum
ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'RECEIVED';


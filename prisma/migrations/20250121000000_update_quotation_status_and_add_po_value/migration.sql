-- Update existing quotations with DRAFT or RECEIVED status to LIVE
UPDATE "Quotation" SET status = 'LIVE' WHERE status = 'DRAFT' OR status = 'RECEIVED';

-- Add poValue field to Quotation table (if it doesn't exist)
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "poValue" DECIMAL(10,2);

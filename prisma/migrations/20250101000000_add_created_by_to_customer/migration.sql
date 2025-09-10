-- Add createdById column to Customer table
ALTER TABLE "public"."Customer" ADD COLUMN "createdById" TEXT;

-- Add foreign key constraint
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

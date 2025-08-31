/*
  Warnings:

  - Added the required column `updatedAt` to the `Communication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add the columns as nullable
ALTER TABLE "public"."Communication" ADD COLUMN     "enquiryRelated" TEXT;
ALTER TABLE "public"."Communication" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Update existing records to set updatedAt to createdAt
UPDATE "public"."Communication" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Now make updatedAt NOT NULL
ALTER TABLE "public"."Communication" ALTER COLUMN "updatedAt" SET NOT NULL;

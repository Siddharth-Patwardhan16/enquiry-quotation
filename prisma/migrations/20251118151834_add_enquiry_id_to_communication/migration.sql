-- AlterTable
ALTER TABLE "Communication" ADD COLUMN "enquiryId" INTEGER;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;


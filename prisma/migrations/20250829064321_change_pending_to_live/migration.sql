-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('MARKETING', 'MANAGER', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "public"."LocationType" AS ENUM ('OFFICE', 'PLANT');

-- CreateEnum
CREATE TYPE "public"."EnquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'QUOTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."QuotationStatus" AS ENUM ('DRAFT', 'LIVE', 'SUBMITTED', 'WON', 'LOST', 'RECEIVED');

-- CreateEnum
CREATE TYPE "public"."LostReason" AS ENUM ('PRICE', 'DELIVERY_SCHEDULE', 'LACK_OF_CONFIDENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CommunicationType" AS ENUM ('TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('CUSTOMER_REQUIREMENT', 'TECHNICAL_DRAWING', 'PURCHASE_ORDER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "supabaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "officeAddress" TEXT,
    "officeCity" TEXT,
    "officeState" TEXT,
    "officeCountry" TEXT,
    "officeReceptionNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "existingGraphiteSuppliers" TEXT,
    "plantAddress" TEXT,
    "plantCity" TEXT,
    "plantCountry" TEXT,
    "plantReceptionNumber" TEXT,
    "plantState" TEXT,
    "poHeatExchanger" INTEGER NOT NULL DEFAULT 0,
    "poMiscellaneous" INTEGER NOT NULL DEFAULT 0,
    "poRuptureDiscs" INTEGER NOT NULL DEFAULT 0,
    "poThermowells" INTEGER NOT NULL DEFAULT 0,
    "poWaterJetSteamJet" INTEGER NOT NULL DEFAULT 0,
    "problemsFaced" TEXT,
    "officeName" TEXT,
    "plantName" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "officialCellNumber" TEXT,
    "personalCellNumber" TEXT,
    "locationType" "public"."LocationType" NOT NULL,
    "locationAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enquiry" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "expectedBudget" TEXT,
    "timeline" TEXT,
    "enquiryDate" TIMESTAMP(3),
    "priority" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "status" "public"."EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "regretReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "marketingPersonId" TEXT NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "quotationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validityPeriod" TIMESTAMP(3),
    "revisionNumber" INTEGER NOT NULL DEFAULT 0,
    "totalBasicPrice" DECIMAL(65,30),
    "gst" DECIMAL(65,30),
    "transportCosts" DECIMAL(65,30),
    "insuranceCosts" DECIMAL(65,30),
    "paymentTerms" TEXT,
    "deliverySchedule" TEXT,
    "specialInstructions" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(65,30),
    "tax" DECIMAL(65,30),
    "totalValue" DECIMAL(65,30),
    "status" "public"."QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "lostReason" TEXT,
    "purchaseOrderNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enquiryId" INTEGER NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuotationItem" (
    "id" TEXT NOT NULL,
    "materialDescription" TEXT NOT NULL,
    "specifications" TEXT,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quotationId" TEXT NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Communication" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."CommunicationType" NOT NULL,
    "nextCommunicationDate" TIMESTAMP(3),
    "proposedNextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "contactId" TEXT,
    "employeeId" TEXT,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enquiryId" INTEGER,
    "quotationId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "public"."User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_officeName_key" ON "public"."Customer"("officeName");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_plantName_key" ON "public"."Customer"("plantName");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "public"."Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "public"."Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "public"."Quotation"("quotationNumber");

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enquiry" ADD CONSTRAINT "Enquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enquiry" ADD CONSTRAINT "Enquiry_marketingPersonId_fkey" FOREIGN KEY ("marketingPersonId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "public"."Enquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Communication" ADD CONSTRAINT "Communication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "public"."Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

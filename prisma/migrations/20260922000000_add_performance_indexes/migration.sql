-- Performance indexes: foreign keys, status/date filters and cascade-delete targets
-- that Postgres does not auto-index. Plain CREATE INDEX (no CONCURRENTLY) so this
-- runs inside Prisma's normal migration transaction.

-- Enquiry
CREATE INDEX IF NOT EXISTS "Enquiry_companyId_idx" ON "Enquiry"("companyId");
CREATE INDEX IF NOT EXISTS "Enquiry_customerId_idx" ON "Enquiry"("customerId");
CREATE INDEX IF NOT EXISTS "Enquiry_officeId_idx" ON "Enquiry"("officeId");
CREATE INDEX IF NOT EXISTS "Enquiry_plantId_idx" ON "Enquiry"("plantId");
CREATE INDEX IF NOT EXISTS "Enquiry_marketingPersonId_idx" ON "Enquiry"("marketingPersonId");
CREATE INDEX IF NOT EXISTS "Enquiry_attendedById_idx" ON "Enquiry"("attendedById");
CREATE INDEX IF NOT EXISTS "Enquiry_status_idx" ON "Enquiry"("status");
CREATE INDEX IF NOT EXISTS "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");
CREATE INDEX IF NOT EXISTS "Enquiry_financialYear_createdAt_idx" ON "Enquiry"("financialYear", "createdAt");
CREATE INDEX IF NOT EXISTS "Enquiry_financialYear_status_idx" ON "Enquiry"("financialYear", "status");

-- Quotation
CREATE INDEX IF NOT EXISTS "Quotation_enquiryId_idx" ON "Quotation"("enquiryId");
CREATE INDEX IF NOT EXISTS "Quotation_status_idx" ON "Quotation"("status");
CREATE INDEX IF NOT EXISTS "Quotation_createdAt_idx" ON "Quotation"("createdAt");
CREATE INDEX IF NOT EXISTS "Quotation_createdById_idx" ON "Quotation"("createdById");
CREATE INDEX IF NOT EXISTS "Quotation_validityPeriod_idx" ON "Quotation"("validityPeriod");

-- QuotationItem
CREATE INDEX IF NOT EXISTS "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- Communication
CREATE INDEX IF NOT EXISTS "Communication_enquiryId_idx" ON "Communication"("enquiryId");
CREATE INDEX IF NOT EXISTS "Communication_companyId_idx" ON "Communication"("companyId");
CREATE INDEX IF NOT EXISTS "Communication_customerId_idx" ON "Communication"("customerId");
CREATE INDEX IF NOT EXISTS "Communication_contactId_idx" ON "Communication"("contactId");
CREATE INDEX IF NOT EXISTS "Communication_contactPersonId_idx" ON "Communication"("contactPersonId");
CREATE INDEX IF NOT EXISTS "Communication_employeeId_idx" ON "Communication"("employeeId");
CREATE INDEX IF NOT EXISTS "Communication_nextCommunicationDate_idx" ON "Communication"("nextCommunicationDate");
CREATE INDEX IF NOT EXISTS "Communication_createdAt_idx" ON "Communication"("createdAt");

-- Office
CREATE INDEX IF NOT EXISTS "Office_companyId_idx" ON "Office"("companyId");

-- Plant
CREATE INDEX IF NOT EXISTS "Plant_companyId_idx" ON "Plant"("companyId");

-- ContactPerson
CREATE INDEX IF NOT EXISTS "ContactPerson_companyId_idx" ON "ContactPerson"("companyId");
CREATE INDEX IF NOT EXISTS "ContactPerson_officeId_idx" ON "ContactPerson"("officeId");
CREATE INDEX IF NOT EXISTS "ContactPerson_plantId_idx" ON "ContactPerson"("plantId");

-- Location
CREATE INDEX IF NOT EXISTS "Location_customerId_idx" ON "Location"("customerId");

-- Contact
CREATE INDEX IF NOT EXISTS "Contact_customerId_idx" ON "Contact"("customerId");
CREATE INDEX IF NOT EXISTS "Contact_locationId_idx" ON "Contact"("locationId");

-- Document
CREATE INDEX IF NOT EXISTS "Document_enquiryId_idx" ON "Document"("enquiryId");
CREATE INDEX IF NOT EXISTS "Document_quotationId_idx" ON "Document"("quotationId");

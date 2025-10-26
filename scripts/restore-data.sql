-- Restore data from backup
-- First, create a test employee
INSERT INTO "Employee" (id, name, email, role, "isActive", "createdAt", "updatedAt") 
VALUES ('test-employee-1', 'Test User', 'test@example.com', 'MARKETING', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create companies from backup data
INSERT INTO "Company" (id, name, "poRuptureDiscs", "poThermowells", "poHeatExchanger", "poMiscellaneous", "poWaterJetSteamJet", "existingGraphiteSuppliers", "problemsFaced", "createdById", "createdAt", "updatedAt")
VALUES 
('a9d7fd00-0bce-48ed-b7ca-b210bbe33212', 'Logic', true, false, true, false, true, '', '', 'test-employee-1', '2025-09-20T09:27:14.168Z', '2025-09-20T09:27:14.168Z');

-- Create office
INSERT INTO "Office" (id, name, address, city, state, country, "receptionNumber", "companyId", "createdAt", "updatedAt")
VALUES 
('a7b6b91a-2184-4881-9c74-299d6dec9602', 'office1', '', '', '', 'India', '', 'a9d7fd00-0bce-48ed-b7ca-b210bbe33212', NOW(), NOW());

-- Create enquiry
INSERT INTO "Enquiry" (id, subject, description, "enquiryDate", priority, source, status, "quotationNumber", "customerId", "marketingPersonId", "createdAt", "updatedAt")
VALUES 
(1, '4 X 4 cubical heat exchanger with additional top and bottom attachmentsh', 'testtesttest', '2025-09-20T00:00:00.000Z', 'Medium', 'Website', 'NEW', 'Q202509946810', 'a9d7fd00-0bce-48ed-b7ca-b210bbe33212', 'test-employee-1', '2025-09-20T17:06:06.292Z', '2025-09-20T17:06:06.292Z');


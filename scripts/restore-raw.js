const { PrismaClient } = require('@prisma/client');

async function restoreData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating test employee...');
    
    // Create test employee using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "Employee" (id, name, email, role, "isActive", "createdAt", "updatedAt") 
      VALUES ('test-employee-1', 'Test User', 'test@example.com', 'MARKETING', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    
    console.log('Creating test company...');
    
    // Create test company using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "Company" (id, name, "poRuptureDiscs", "poThermowells", "poHeatExchanger", "poMiscellaneous", "poWaterJetSteamJet", "existingGraphiteSuppliers", "problemsFaced", "createdById", "createdAt", "updatedAt")
      VALUES ('a9d7fd00-0bce-48ed-b7ca-b210bbe33212', 'Logic', true, false, true, false, true, '', '', 'test-employee-1', '2025-09-20T09:27:14.168Z', '2025-09-20T09:27:14.168Z')
      ON CONFLICT (id) DO NOTHING
    `;
    
    console.log('Creating test office...');
    
    // Create test office using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "Office" (id, name, address, city, state, country, "receptionNumber", "companyId", "createdAt", "updatedAt")
      VALUES ('a7b6b91a-2184-4881-9c74-299d6dec9602', 'office1', '', '', '', 'India', '', 'a9d7fd00-0bce-48ed-b7ca-b210bbe33212', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    
    console.log('Creating test enquiry...');
    
    // Create test enquiry using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "Enquiry" (id, subject, description, "enquiryDate", priority, source, status, "quotationNumber", "customerId", "marketingPersonId", "createdAt", "updatedAt")
      VALUES (1, '4 X 4 cubical heat exchanger with additional top and bottom attachmentsh', 'testtesttest', '2025-09-20T00:00:00.000Z', 'Medium', 'Website', 'NEW', 'Q202509946810', 'a9d7fd00-0bce-48ed-b7ca-b210bbe33212', 'test-employee-1', '2025-09-20T17:06:06.292Z', '2025-09-20T17:06:06.292Z')
      ON CONFLICT (id) DO NOTHING
    `;
    
    console.log('✅ Test data created successfully!');
    
    // Verify the data
    const companies = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Company"`;
    const enquiries = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Enquiry"`;
    
    console.log(`Companies: ${companies[0].count}`);
    console.log(`Enquiries: ${enquiries[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();


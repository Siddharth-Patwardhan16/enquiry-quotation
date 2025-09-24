import { prisma } from '../src/server/db';

async function testDeduplication() {
  console.log('🧪 Testing deduplication logic...');
  
  try {
    // Get all companies
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📊 Found ${companies.length} companies:`);
    companies.forEach((company, index) => {
      console.log(`${index + 1}. "${company.name}" (ID: ${company.id})`);
      console.log(`   Normalized: "${company.name.trim().toLowerCase()}"`);
      console.log(`   Created: ${company.createdAt.toISOString()}`);
    });

    // Test the deduplication logic
    console.log(`\n🔍 Testing deduplication logic:`);
    const allEntities: any[] = [];
    const seenNames = new Set<string>();
    
    companies.forEach((company) => {
      const normalizedName = company.name.trim().toLowerCase();
      console.log(`\nProcessing: "${company.name}"`);
      console.log(`Normalized: "${normalizedName}"`);
      console.log(`Already seen: ${seenNames.has(normalizedName)}`);
      
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        allEntities.push({
          id: company.id,
          name: company.name,
          type: 'company',
          createdAt: company.createdAt
        });
        console.log(`✅ Added to list`);
      } else {
        console.log(`❌ Skipped (duplicate)`);
      }
    });

    console.log(`\n📋 Final deduplicated list (${allEntities.length} entities):`);
    allEntities.forEach((entity, index) => {
      console.log(`${index + 1}. "${entity.name}" (ID: ${entity.id})`);
    });

    // Check for Test Companies specifically
    const testCompanies = companies.filter(c => 
      c.name.toLowerCase().includes('test')
    );
    
    console.log(`\n🧪 Test Companies found: ${testCompanies.length}`);
    testCompanies.forEach((company, index) => {
      console.log(`${index + 1}. "${company.name}" (ID: ${company.id})`);
    });

  } catch (error) {
    console.error('❌ Error testing deduplication:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeduplication();

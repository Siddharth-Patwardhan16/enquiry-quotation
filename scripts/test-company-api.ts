import { prisma } from '../src/server/db';

async function testCompanyAPI() {
  console.log('🧪 Testing company API query...');
  
  try {
    // Simulate the exact query from the company.getAll API
    const companies = await prisma.company.findMany({
      include: {
        offices: {
          include: {
            contactPersons: true
          }
        },
        plants: {
          include: {
            contactPersons: true
          }
        },
        contactPersons: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 API Query returned ${companies.length} companies:`);
    companies.forEach((company, index) => {
      console.log(`${index + 1}. "${company.name}" (ID: ${company.id})`);
      console.log(`   Created: ${company.createdAt.toISOString()}`);
      console.log(`   Offices: ${company.offices.length}, Plants: ${company.plants.length}`);
    });

    // Check specifically for Test Companies
    const testCompanies = companies.filter(c => 
      c.name.toLowerCase().includes('test')
    );
    
    console.log(`\n🧪 Test Companies in API response: ${testCompanies.length}`);
    testCompanies.forEach((company, index) => {
      console.log(`${index + 1}. "${company.name}" (ID: ${company.id})`);
    });

  } catch (error) {
    console.error('❌ Error testing company API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompanyAPI();

import { prisma } from '../src/server/db';

async function debugFrontendData() {
  console.log('🐛 Debugging frontend data...');
  
  try {
    // Get the exact data that the frontend should receive
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });

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

    console.log(`\n📊 Raw data from database:`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Companies: ${companies.length}`);

    // Simulate the frontend deduplication logic
    const allEntities: any[] = [];
    const seenNames = new Set<string>();
    
    // First, add all companies (new structure takes priority)
    companies.forEach((company) => {
      const normalizedName = company.name.trim().toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        allEntities.push({
          id: company.id,
          name: company.name,
          type: 'company',
          isNew: true,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          createdBy: company.createdBy,
          poRuptureDiscs: company.poRuptureDiscs,
          poThermowells: company.poThermowells,
          poHeatExchanger: company.poHeatExchanger,
          poMiscellaneous: company.poMiscellaneous,
          poWaterJetSteamJet: company.poWaterJetSteamJet,
          existingGraphiteSuppliers: company.existingGraphiteSuppliers,
          problemsFaced: company.problemsFaced,
          offices: company.offices,
          plants: company.plants,
        });
      }
    });
    
    // Then, add customers that don't have duplicate names
    customers.forEach((customer) => {
      const normalizedName = customer.name.trim().toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        allEntities.push({
          id: customer.id,
          name: customer.name,
          type: 'customer',
          isNew: customer.isNew,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          createdBy: null, // Legacy customers don't have createdBy relation
          poRuptureDiscs: customer.poRuptureDiscs,
          poThermowells: customer.poThermowells,
          poHeatExchanger: customer.poHeatExchanger,
          poMiscellaneous: customer.poMiscellaneous,
          poWaterJetSteamJet: customer.poWaterJetSteamJet,
          existingGraphiteSuppliers: customer.existingGraphiteSuppliers,
          problemsFaced: customer.problemsFaced,
          locations: [], // Legacy customers don't have locations relation in this context
        });
      }
    });

    // Sort by creation date
    allEntities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`\n📋 Final combined entities (${allEntities.length}):`);
    allEntities.forEach((entity, index) => {
      console.log(`${index + 1}. "${entity.name}" (${entity.type}) - ID: ${entity.id}`);
    });

    // Check specifically for Test Companies
    const testEntities = allEntities.filter(e => 
      e.name.toLowerCase().includes('test')
    );
    
    console.log(`\n🧪 Test Companies in final list: ${testEntities.length}`);
    testEntities.forEach((entity, index) => {
      console.log(`${index + 1}. "${entity.name}" (${entity.type}) - ID: ${entity.id}`);
    });

  } catch (error) {
    console.error('❌ Error debugging frontend data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFrontendData();

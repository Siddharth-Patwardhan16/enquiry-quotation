import { prisma } from '../src/server/db';

async function createMissingCompany() {
  console.log('🏢 Creating missing company for GRAUER & WEIL (INDIA) LIMITED...');
  
  try {
    // Check if the company already exists
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: {
          equals: 'GRAUER & WEIL (INDIA) LIMITED',
          mode: 'insensitive'
        }
      }
    });

    if (existingCompany) {
      console.log('✅ Company already exists:', existingCompany.name);
      return;
    }

    // Get the customer data to copy over
    const customer = await prisma.customer.findFirst({
      where: {
        name: {
          equals: 'GRAUER & WEIL (INDIA) LIMITED',
          mode: 'insensitive'
        }
      }
    });

    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }

    console.log('📋 Found customer:', customer.name);

    // Create the company with the same data
    const newCompany = await prisma.company.create({
      data: {
        name: customer.name,
        website: null,
        industry: null,
        poRuptureDiscs: customer.poRuptureDiscs,
        poThermowells: customer.poThermowells,
        poHeatExchanger: customer.poHeatExchanger,
        poMiscellaneous: customer.poMiscellaneous,
        poWaterJetSteamJet: customer.poWaterJetSteamJet,
        existingGraphiteSuppliers: customer.existingGraphiteSuppliers,
        problemsFaced: customer.problemsFaced,
        createdById: null
      }
    });

    console.log('✅ Created company:', newCompany.name, 'with ID:', newCompany.id);

    // Now link the enquiries to this new company
    const enquiriesToUpdate = await prisma.enquiry.findMany({
      where: {
        customerId: customer.id,
        companyId: null
      }
    });

    console.log(`\n🔗 Found ${enquiriesToUpdate.length} enquiries to link to new company`);

    for (const enquiry of enquiriesToUpdate) {
      await prisma.enquiry.update({
        where: { id: enquiry.id },
        data: {
          companyId: newCompany.id
        }
      });
      console.log(`✅ Linked enquiry ${enquiry.id} to company ${newCompany.name}`);
    }

    console.log(`\n🎉 Successfully created company and linked ${enquiriesToUpdate.length} enquiries!`);

  } catch (error) {
    console.error('❌ Error creating missing company:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingCompany();

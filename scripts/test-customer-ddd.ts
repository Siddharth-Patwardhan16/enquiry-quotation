import { prisma } from '../src/server/db';

async function testCustomerDDD() {
  console.log('🔍 Testing customer/company DDDD...\n');
  
  try {
    // Search for customers with "DDDD" in the name (case insensitive)
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: 'DDDD', mode: 'insensitive' } },
          { name: { contains: 'DDDDD', mode: 'insensitive' } },
        ],
      },
      include: {
        locations: {
          orderBy: { name: 'asc' },
        },
        contacts: {
          include: {
            location: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    console.log(`Found ${customers.length} customer(s) with "DDDD" in name:\n`);

    customers.forEach((customer, index) => {
      console.log(`Customer ${index + 1}:`);
      console.log(`  ID: ${customer.id}`);
      console.log(`  Name: ${customer.name}`);
      console.log(`  Locations: ${customer.locations.length}`);
      customer.locations.forEach((loc, locIndex) => {
        console.log(`    Location ${locIndex + 1}:`);
        console.log(`      ID: ${loc.id}`);
        console.log(`      Name: ${loc.name}`);
        console.log(`      Type: ${loc.type}`);
        console.log(`      Address: ${loc.address ?? 'N/A'}`);
        console.log(`      City: ${loc.city ?? 'N/A'}`);
        console.log(`      State: ${loc.state ?? 'N/A'}`);
        console.log(`      Country: ${loc.country ?? 'N/A'}`);
      });
      console.log(`  Contacts: ${customer.contacts.length}`);
      customer.contacts.forEach((contact, contactIndex) => {
        console.log(`    Contact ${contactIndex + 1}:`);
        console.log(`      ID: ${contact.id}`);
        console.log(`      Name: ${contact.name}`);
        console.log(`      Location: ${contact.location?.name ?? 'N/A'}`);
      });
      console.log('');
    });

    // Also check companies
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: 'DDDD', mode: 'insensitive' } },
          { name: { contains: 'DDDDD', mode: 'insensitive' } },
        ],
      },
      include: {
        offices: true,
        plants: true,
      },
    });

    console.log(`\nFound ${companies.length} company/companies with "DDDD" in name:\n`);

    companies.forEach((company, index) => {
      console.log(`Company ${index + 1}:`);
      console.log(`  ID: ${company.id}`);
      console.log(`  Name: ${company.name}`);
      console.log(`  Offices: ${company.offices.length}`);
      console.log(`  Plants: ${company.plants.length}`);
    });

    // Check all customers with locations
    const allCustomersWithLocations = await prisma.customer.findMany({
      where: {
        locations: {
          some: {},
        },
      },
      include: {
        locations: true,
      },
    });

    console.log(`\n📊 All customers with locations (${allCustomersWithLocations.length}):`);
    allCustomersWithLocations.forEach((customer) => {
      console.log(`  - ${customer.name}: ${customer.locations.length} location(s)`);
      customer.locations.forEach((loc) => {
        console.log(`    • ${loc.name} (${loc.type})`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomerDDD();

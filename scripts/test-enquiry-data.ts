import { prisma } from '../src/server/db';

async function testEnquiryData() {
  console.log('🔍 Testing enquiry data...');
  
  try {
    // Test the exact same query as the API
    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            name: true,
            type: true,
          },
        },
        office: {
          select: {
            name: true,
          },
        },
        plant: {
          select: {
            name: true,
          },
        },
        marketingPerson: {
          select: {
            name: true,
          },
        },
      },
    });
    
    console.log(`\n📊 Found ${enquiries.length} enquiries:`);
    enquiries.forEach((enquiry, index) => {
      console.log(`\n${index + 1}. ${enquiry.subject}`);
      console.log(`   ID: ${enquiry.id}`);
      console.log(`   Customer: ${enquiry.customer?.name || 'None'}`);
      console.log(`   Company: ${enquiry.company?.name || 'None'}`);
      console.log(`   Location: ${enquiry.location?.name || 'None'} (${enquiry.location?.type || 'N/A'})`);
      console.log(`   Office: ${enquiry.office?.name || 'None'}`);
      console.log(`   Plant: ${enquiry.plant?.name || 'None'}`);
      console.log(`   Marketing Person: ${enquiry.marketingPerson?.name || 'None'}`);
      console.log(`   Status: ${enquiry.status}`);
      console.log(`   Created: ${enquiry.createdAt.toISOString()}`);
    });
    
    // Check for any enquiries with company connections
    const enquiriesWithCompanies = enquiries.filter(e => e.company);
    console.log(`\n🏢 Enquiries with company connections: ${enquiriesWithCompanies.length}`);
    
    // Check for any enquiries with customer connections
    const enquiriesWithCustomers = enquiries.filter(e => e.customer);
    console.log(`👤 Enquiries with customer connections: ${enquiriesWithCustomers.length}`);
    
  } catch (error) {
    console.error('Error testing enquiry data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnquiryData();

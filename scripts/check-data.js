const { PrismaClient } = require('@prisma/client');

async function checkData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking quotations...');
    const quotations = await prisma.quotation.findMany({
      include: {
        enquiry: {
          include: {
            customer: { select: { name: true } },
            company: { select: { name: true } }
          }
        }
      }
    });
    
    console.log(`Found ${quotations.length} quotations:`);
    quotations.forEach((q, i) => {
      console.log(`${i + 1}. ${q.quotationNumber} - Status: ${q.status} - Customer: ${q.enquiry?.customer?.name || q.enquiry?.company?.name || 'Unknown'}`);
    });
    
    console.log('\nChecking companies...');
    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies:`);
    companies.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`);
    });
    
    console.log('\nChecking enquiries...');
    const enquiries = await prisma.enquiry.findMany();
    console.log(`Found ${enquiries.length} enquiries:`);
    enquiries.forEach((e, i) => {
      console.log(`${i + 1}. ${e.subject} - Quotation #: ${e.quotationNumber}`);
    });
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();


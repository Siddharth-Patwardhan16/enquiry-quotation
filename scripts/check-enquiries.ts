import { prisma } from '../src/server/db';

async function checkEnquiries() {
  console.log('🔍 Checking enquiries and their customer/company relationships...');
  
  try {
    const enquiries = await prisma.enquiry.findMany({
      include: {
        customer: {
          select: { id: true, name: true }
        },
        company: {
          select: { id: true, name: true }
        }
      }
    });
    
    console.log(`\n📊 Found ${enquiries.length} enquiries:`);
    
    enquiries.forEach((enquiry, index) => {
      console.log(`\n${index + 1}. Enquiry ID: ${enquiry.id}`);
      console.log(`   Subject: ${enquiry.subject}`);
      console.log(`   Customer ID: ${enquiry.customerId || 'None'}`);
      console.log(`   Customer Name: ${enquiry.customer?.name || 'None'}`);
      console.log(`   Company ID: ${enquiry.companyId || 'None'}`);
      console.log(`   Company Name: ${enquiry.company?.name || 'None'}`);
    });
    
    // Check quotations
    const quotations = await prisma.quotation.findMany({
      include: {
        enquiry: {
          include: {
            customer: {
              select: { id: true, name: true }
            },
            company: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    
    console.log(`\n📋 Found ${quotations.length} quotations:`);
    
    quotations.forEach((quotation, index) => {
      console.log(`\n${index + 1}. Quotation ID: ${quotation.id}`);
      console.log(`   Quotation Number: ${quotation.quotationNumber}`);
      console.log(`   Enquiry ID: ${quotation.enquiryId}`);
      console.log(`   Customer Name: ${quotation.enquiry.customer?.name || 'None'}`);
      console.log(`   Company Name: ${quotation.enquiry.company?.name || 'None'}`);
    });
    
  } catch (error) {
    console.error('Error checking enquiries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnquiries();

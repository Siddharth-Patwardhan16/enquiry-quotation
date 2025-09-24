import { prisma } from '../src/server/db';

async function checkEnquiryConnections() {
  console.log('🔍 Checking enquiry and quotation connections...');
  
  try {
    // Check enquiries
    const enquiries = await prisma.enquiry.findMany({
      include: {
        customer: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        location: { select: { id: true, name: true, type: true } },
        office: { select: { id: true, name: true } },
        plant: { select: { id: true, name: true } }
      }
    });
    
    console.log(`\n📊 Found ${enquiries.length} enquiries:`);
    enquiries.forEach((enquiry, index) => {
      console.log(`\n${index + 1}. ${enquiry.subject}`);
      console.log(`   Customer: ${enquiry.customer?.name || 'None'}`);
      console.log(`   Company: ${enquiry.company?.name || 'None'}`);
      console.log(`   Location: ${enquiry.location?.name || 'None'} (${enquiry.location?.type || 'N/A'})`);
      console.log(`   Office: ${enquiry.office?.name || 'None'}`);
      console.log(`   Plant: ${enquiry.plant?.name || 'None'}`);
    });
    
    // Check quotations
    const quotations = await prisma.quotation.findMany({
      include: {
        enquiry: {
          include: {
            customer: { select: { id: true, name: true } },
            company: { select: { id: true, name: true } }
          }
        }
      }
    });
    
    console.log(`\n📋 Found ${quotations.length} quotations:`);
    quotations.forEach((quotation, index) => {
      console.log(`\n${index + 1}. ${quotation.quotationNumber || 'No number'}`);
      console.log(`   Enquiry Subject: ${quotation.enquiry?.subject || 'None'}`);
      console.log(`   Customer: ${quotation.enquiry?.customer?.name || 'None'}`);
      console.log(`   Company: ${quotation.enquiry?.company?.name || 'None'}`);
    });
    
    // Check companies with contact persons
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
        }
      }
    });
    
    console.log(`\n🏢 Found ${companies.length} companies with contact details:`);
    companies.forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name}`);
      console.log(`   Offices: ${company.offices.length}`);
      company.offices.forEach((office, oIndex) => {
        console.log(`     Office ${oIndex + 1}: ${office.name} (${office.contactPersons.length} contacts)`);
        office.contactPersons.forEach((contact, cIndex) => {
          console.log(`       Contact ${cIndex + 1}: ${contact.name} (${contact.designation || 'No designation'})`);
        });
      });
      console.log(`   Plants: ${company.plants.length}`);
      company.plants.forEach((plant, pIndex) => {
        console.log(`     Plant ${pIndex + 1}: ${plant.name} (${plant.contactPersons.length} contacts)`);
        plant.contactPersons.forEach((contact, cIndex) => {
          console.log(`       Contact ${cIndex + 1}: ${contact.name} (${contact.designation || 'No designation'})`);
        });
      });
    });
    
  } catch (error) {
    console.error('Error checking connections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnquiryConnections();

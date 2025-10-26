const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function restoreData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync('backups/customer-form-backup-2025-09-23T06-32-40-418Z.json', 'utf8'));
    
    console.log('Restoring companies...');
    
    // Create one company first to test
    const firstCustomer = backupData.customers[0];
    
    const company = await prisma.company.create({
      data: {
        name: firstCustomer.name,
        poRuptureDiscs: firstCustomer.poRuptureDiscs,
        poThermowells: firstCustomer.poThermowells,
        poHeatExchanger: firstCustomer.poHeatExchanger,
        poMiscellaneous: firstCustomer.poMiscellaneous,
        poWaterJetSteamJet: firstCustomer.poWaterJetSteamJet,
        existingGraphiteSuppliers: firstCustomer.existingGraphiteSuppliers,
        problemsFaced: firstCustomer.problemsFaced
      }
    });
    
    console.log(`Created company: ${company.name}`);
    
    // Create one enquiry
    const firstEnquiry = firstCustomer.enquiries[0];
    if (firstEnquiry) {
      const enquiry = await prisma.enquiry.create({
        data: {
          subject: firstEnquiry.subject,
          description: firstEnquiry.description,
          enquiryDate: new Date(firstEnquiry.enquiryDate),
          priority: firstEnquiry.priority,
          source: firstEnquiry.source,
          status: firstEnquiry.status,
          quotationNumber: firstEnquiry.quotationNumber,
          customerId: company.id
        }
      });
      
      console.log(`Created enquiry: ${enquiry.subject}`);
    }
    
    console.log('Test restoration completed successfully!');
    
  } catch (error) {
    console.error('Error restoring data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();


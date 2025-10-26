const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function restoreData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync('backups/customer-form-backup-2025-09-23T06-32-40-418Z.json', 'utf8'));
    
    console.log('Restoring companies...');
    for (const customer of backupData.customers) {
      // Create company
      const company = await prisma.company.create({
        data: {
          id: customer.id,
          name: customer.name,
          poRuptureDiscs: customer.poRuptureDiscs,
          poThermowells: customer.poThermowells,
          poHeatExchanger: customer.poHeatExchanger,
          poMiscellaneous: customer.poMiscellaneous,
          poWaterJetSteamJet: customer.poWaterJetSteamJet,
          existingGraphiteSuppliers: customer.existingGraphiteSuppliers,
          problemsFaced: customer.problemsFaced,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt),
          createdById: customer.createdById
        }
      });
      
      console.log(`Created company: ${company.name}`);
      
      // Create offices
      for (const location of customer.locations) {
        if (location.type === 'OFFICE') {
          await prisma.office.create({
            data: {
              id: location.id,
              name: location.name,
              address: location.address,
              city: location.city,
              state: location.state,
              country: location.country,
              receptionNumber: location.receptionNumber,
              companyId: company.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
      
      // Create enquiries
      for (const enquiry of customer.enquiries) {
        await prisma.enquiry.create({
          data: {
            id: enquiry.id,
            subject: enquiry.subject,
            description: enquiry.description,
            requirements: enquiry.requirements,
            timeline: enquiry.timeline,
            enquiryDate: new Date(enquiry.enquiryDate),
            priority: enquiry.priority,
            source: enquiry.source,
            notes: enquiry.notes,
            status: enquiry.status,
            regretReason: enquiry.regretReason,
            quotationNumber: enquiry.quotationNumber,
            createdAt: new Date(enquiry.createdAt),
            updatedAt: new Date(enquiry.updatedAt),
            customerId: company.id,
            marketingPersonId: enquiry.marketingPersonId,
            createdById: enquiry.createdById
          }
        });
        
        console.log(`Created enquiry: ${enquiry.subject}`);
      }
    }
    
    console.log('Data restoration completed successfully!');
    
  } catch (error) {
    console.error('Error restoring data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();


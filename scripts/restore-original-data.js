const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function restoreOriginalData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync('backups/customer-form-backup-2025-09-23T06-32-40-418Z.json', 'utf8'));
    
    console.log(`📊 Found ${backupData.customers.length} customers in backup`);
    
    // First, create a test employee for the data
    console.log('👤 Creating test employee...');
    const employee = await prisma.employee.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        id: 'admin-employee-1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'MARKETING'
      }
    });
    
    console.log('✅ Created employee:', employee.name);
    
    // Restore all companies and their data
    for (const customer of backupData.customers) {
      console.log(`\n🏢 Restoring company: ${customer.name}`);
      
      // Create company
      const company = await prisma.company.create({
        data: {
          id: customer.id,
          name: customer.name.trim(),
          poRuptureDiscs: customer.poRuptureDiscs || false,
          poThermowells: customer.poThermowells || false,
          poHeatExchanger: customer.poHeatExchanger || false,
          poMiscellaneous: customer.poMiscellaneous || false,
          poWaterJetSteamJet: customer.poWaterJetSteamJet || false,
          existingGraphiteSuppliers: customer.existingGraphiteSuppliers || '',
          problemsFaced: customer.problemsFaced || '',
          createdById: employee.id,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt)
        }
      });
      
      console.log(`  ✅ Created company: ${company.name}`);
      
      // Create offices
      for (const location of customer.locations || []) {
        if (location.type === 'OFFICE') {
          const office = await prisma.office.create({
            data: {
              id: location.id,
              name: location.name || 'Main Office',
              address: location.address || '',
              city: location.city || '',
              state: location.state || '',
              country: location.country || 'India',
              receptionNumber: location.receptionNumber || '',
              companyId: company.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log(`    🏢 Created office: ${office.name}`);
        }
      }
      
      // Create plants
      for (const location of customer.locations || []) {
        if (location.type === 'PLANT') {
          const plant = await prisma.plant.create({
            data: {
              id: location.id,
              name: location.name || 'Main Plant',
              address: location.address || '',
              city: location.city || '',
              state: location.state || '',
              country: location.country || 'India',
              companyId: company.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log(`    🏭 Created plant: ${plant.name}`);
        }
      }
      
      // Create enquiries
      for (const enquiry of customer.enquiries || []) {
        const enquiryRecord = await prisma.enquiry.create({
          data: {
            subject: enquiry.subject,
            description: enquiry.description || '',
            requirements: enquiry.requirements,
            timeline: enquiry.timeline,
            enquiryDate: new Date(enquiry.enquiryDate),
            priority: enquiry.priority || 'Medium',
            source: enquiry.source || 'Website',
            notes: enquiry.notes,
            status: enquiry.status || 'NEW',
            regretReason: enquiry.regretReason,
            quotationNumber: enquiry.quotationNumber,
            customerId: company.id,
            marketingPersonId: employee.id,
            createdById: employee.id,
            createdAt: new Date(enquiry.createdAt),
            updatedAt: new Date(enquiry.updatedAt)
          }
        });
        
        console.log(`    📋 Created enquiry: ${enquiry.subject}`);
        
        // Create quotations if they exist
        if (enquiry.quotations && enquiry.quotations.length > 0) {
          for (const quotation of enquiry.quotations) {
            const quotationRecord = await prisma.quotation.create({
              data: {
                quotationNumber: quotation.quotationNumber,
                revisionNumber: quotation.revisionNumber || 0,
                quotationDate: quotation.quotationDate ? new Date(quotation.quotationDate) : new Date(),
                deliverySchedule: quotation.deliverySchedule || '',
                currency: quotation.currency || 'INR',
                status: quotation.status || 'LIVE',
                enquiryId: enquiryRecord.id,
                createdById: employee.id,
                createdAt: new Date(quotation.createdAt || new Date()),
                updatedAt: new Date(quotation.updatedAt || new Date()),
                items: {
                  create: quotation.items?.map(item => ({
                    materialDescription: item.materialDescription,
                    specifications: item.specifications || '',
                    quantity: item.quantity || 1,
                    pricePerUnit: item.pricePerUnit || 0
                  })) || []
                }
              }
            });
            
            console.log(`      💰 Created quotation: ${quotation.quotationNumber}`);
          }
        }
      }
      
      // Create communications
      for (const communication of customer.communications || []) {
        const communicationRecord = await prisma.communication.create({
          data: {
            id: communication.id,
            subject: communication.subject,
            description: communication.description || '',
            type: communication.type || 'EMAIL',
            status: communication.status || 'SCHEDULED',
            enquiryRelated: communication.enquiryRelated || '',
            nextCommunicationDate: communication.nextCommunicationDate ? new Date(communication.nextCommunicationDate) : null,
            proposedNextAction: communication.proposedNextAction || '',
            customerId: company.id,
            enquiryId: communication.enquiryRelated ? parseInt(communication.enquiryRelated) : null,
            employeeId: employee.id,
            createdAt: new Date(communication.createdAt),
            updatedAt: new Date(communication.updatedAt)
          }
        });
        
        console.log(`    📞 Created communication: ${communication.subject}`);
      }
    }
    
    console.log('\n🎉 Original data restoration completed successfully!');
    console.log('📊 Summary:');
    
    // Get counts
    const companyCount = await prisma.company.count();
    const enquiryCount = await prisma.enquiry.count();
    const quotationCount = await prisma.quotation.count();
    const communicationCount = await prisma.communication.count();
    
    console.log(`  - Companies: ${companyCount}`);
    console.log(`  - Enquiries: ${enquiryCount}`);
    console.log(`  - Quotations: ${quotationCount}`);
    console.log(`  - Communications: ${communicationCount}`);
    
    console.log('\n✅ You can now start the development server and check your restored data!');
    
  } catch (error) {
    console.error('❌ Error restoring data:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

restoreOriginalData();

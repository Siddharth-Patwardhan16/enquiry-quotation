const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function restoreData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync('backups/customer-form-backup-2025-09-23T06-32-40-418Z.json', 'utf8'));
    
    console.log(`Found ${backupData.customers.length} customers in backup`);
    
    // First, let's create a test user/employee if needed
    let testEmployee = await prisma.employee.findFirst({
      where: { email: 'test@example.com' }
    });
    
    if (!testEmployee) {
      testEmployee = await prisma.employee.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          role: 'MARKETING',
          isActive: true
        }
      });
      console.log('Created test employee');
    }
    
    // Restore companies
    for (const customer of backupData.customers) {
      console.log(`Restoring company: ${customer.name}`);
      
      const company = await prisma.company.create({
        data: {
          name: customer.name,
          poRuptureDiscs: customer.poRuptureDiscs || false,
          poThermowells: customer.poThermowells || false,
          poHeatExchanger: customer.poHeatExchanger || false,
          poMiscellaneous: customer.poMiscellaneous || false,
          poWaterJetSteamJet: customer.poWaterJetSteamJet || false,
          existingGraphiteSuppliers: customer.existingGraphiteSuppliers || '',
          problemsFaced: customer.problemsFaced || '',
          createdById: testEmployee.id
        }
      });
      
      console.log(`✓ Created company: ${company.name}`);
      
      // Create offices
      for (const location of customer.locations || []) {
        if (location.type === 'OFFICE') {
          await prisma.office.create({
            data: {
              name: location.name || 'Main Office',
              address: location.address || '',
              city: location.city || '',
              state: location.state || '',
              country: location.country || 'India',
              receptionNumber: location.receptionNumber || '',
              companyId: company.id
            }
          });
          console.log(`  ✓ Created office: ${location.name}`);
        }
      }
      
      // Create plants
      for (const location of customer.locations || []) {
        if (location.type === 'PLANT') {
          await prisma.plant.create({
            data: {
              name: location.name || 'Main Plant',
              address: location.address || '',
              city: location.city || '',
              state: location.state || '',
              country: location.country || 'India',
              companyId: company.id
            }
          });
          console.log(`  ✓ Created plant: ${location.name}`);
        }
      }
      
      // Create enquiries
      for (const enquiry of customer.enquiries || []) {
        const enquiryRecord = await prisma.enquiry.create({
          data: {
            subject: enquiry.subject,
            description: enquiry.description || '',
            enquiryDate: new Date(enquiry.enquiryDate),
            priority: enquiry.priority || 'Medium',
            source: enquiry.source || 'Website',
            status: enquiry.status || 'NEW',
            quotationNumber: enquiry.quotationNumber,
            customerId: company.id,
            marketingPersonId: testEmployee.id
          }
        });
        
        console.log(`  ✓ Created enquiry: ${enquiry.subject}`);
        
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
                createdById: testEmployee.id,
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
            
            console.log(`    ✓ Created quotation: ${quotation.quotationNumber}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Data restoration completed successfully!');
    console.log('You can now start the development server and check the application.');
    
  } catch (error) {
    console.error('❌ Error restoring data:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();


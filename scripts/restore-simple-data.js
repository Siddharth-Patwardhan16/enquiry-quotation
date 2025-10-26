const { PrismaClient } = require('@prisma/client');

async function restoreData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating test employee...');
    
    // Create test employee
    const employee = await prisma.employee.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        id: 'test-employee-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'MARKETING'
      }
    });
    
    console.log('✅ Created employee:', employee.name);
    
    console.log('Creating test company...');
    
    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Logic',
        poRuptureDiscs: true,
        poThermowells: false,
        poHeatExchanger: true,
        poMiscellaneous: false,
        poWaterJetSteamJet: true,
        existingGraphiteSuppliers: '',
        problemsFaced: '',
        createdById: employee.id
      }
    });
    
    console.log('✅ Created company:', company.name);
    
    console.log('Creating test office...');
    
    // Create test office
    const office = await prisma.office.create({
      data: {
        name: 'Main Office',
        address: '123 Business Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        receptionNumber: '+91-22-12345678',
        companyId: company.id
      }
    });
    
    console.log('✅ Created office:', office.name);
    
    console.log('Creating test enquiry...');
    
    // Create test enquiry
    const enquiry = await prisma.enquiry.create({
      data: {
        subject: '4 X 4 cubical heat exchanger with additional top and bottom attachments',
        description: 'Customer requires a custom heat exchanger with specific dimensions and attachments',
        enquiryDate: new Date('2025-09-20'),
        priority: 'Medium',
        source: 'Website',
        status: 'NEW',
        quotationNumber: 'Q202509946810',
        customerId: company.id,
        marketingPersonId: employee.id
      }
    });
    
    console.log('✅ Created enquiry:', enquiry.subject);
    
    console.log('Creating test quotation...');
    
    // Create test quotation
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: 'Q202509946810',
        revisionNumber: 0,
        quotationDate: new Date(),
        deliverySchedule: '4-6 weeks',
        currency: 'INR',
        status: 'LIVE',
        enquiryId: enquiry.id,
        createdById: employee.id,
        items: {
          create: [
            {
              materialDescription: 'Heat Exchanger Core',
              specifications: '4 X 4 cubical design with top and bottom attachments',
              quantity: 1,
              pricePerUnit: 150000
            },
            {
              materialDescription: 'Installation Service',
              specifications: 'On-site installation and commissioning',
              quantity: 1,
              pricePerUnit: 25000
            }
          ]
        }
      }
    });
    
    console.log('✅ Created quotation:', quotation.quotationNumber);
    
    console.log('\n🎉 Test data created successfully!');
    console.log('You can now check the application at http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();


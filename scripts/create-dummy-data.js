const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDummyData() {
  try {
    console.log('🚀 Starting to create dummy data...\n');

    // Generate unique names to avoid conflicts
    const timestamp = Date.now();
    const uniqueSuffix = `_${timestamp}`;

    // 1. Create a dummy customer
    console.log('📝 Creating dummy customer...');
    const customer = await prisma.customer.create({
      data: {
        name: `TechCorp Industries Ltd.${uniqueSuffix}`,
        isNew: true,
        officeAddress: '123 Business Park, Tech Street',
        officeCity: 'Mumbai',
        officeState: 'Maharashtra',
        officeCountry: 'India',
        officeReceptionNumber: '+91-22-1234-5678',
        officeName: `TechCorp HQ${uniqueSuffix}`,
        plantAddress: '456 Industrial Zone, Factory Road',
        plantCity: 'Pune',
        plantState: 'Maharashtra',
        plantCountry: 'India',
        plantReceptionNumber: '+91-20-9876-5432',
        plantName: `TechCorp Manufacturing Plant${uniqueSuffix}`,
        existingGraphiteSuppliers: 'Supplier A, Supplier B',
        problemsFaced: 'Quality issues, Delivery delays',
        poHeatExchanger: 1,
        poMiscellaneous: 2,
        poRuptureDiscs: 3,
        poThermowells: 4,
        poWaterJetSteamJet: 5,
      },
    });
    console.log(`✅ Customer created: ${customer.name} (ID: ${customer.id})\n`);

    // 2. Create a contact person for the customer
    console.log('👤 Creating contact person...');
    const contact = await prisma.contact.create({
      data: {
        name: `Rajesh Kumar${uniqueSuffix}`,
        designation: 'Procurement Manager',
        officialCellNumber: '+91-98765-43210',
        personalCellNumber: '+91-98765-43211',
        locationType: 'OFFICE',
        locationAddress: 'Procurement Department, 2nd Floor',
        customerId: customer.id,
      },
    });
    console.log(`✅ Contact created: ${contact.name} (ID: ${contact.id})\n`);

    // 3. Create an employee (marketing person)
    console.log('👨‍💼 Creating employee...');
    const employee = await prisma.employee.create({
      data: {
        name: `Priya Sharma${uniqueSuffix}`,
        email: `priya.sharma${uniqueSuffix}@company.com`,
        role: 'MARKETING',
      },
    });
    console.log(`✅ Employee created: ${employee.name} (ID: ${employee.id})\n`);

    // 4. Create an enquiry
    console.log('📋 Creating enquiry...');
    const enquiry = await prisma.enquiry.create({
      data: {
        subject: `Graphite Heat Exchanger for Chemical Processing Plant${uniqueSuffix}`,
        description: 'We require a high-quality graphite heat exchanger for our chemical processing facility. The unit should handle corrosive chemicals and operate at temperatures up to 200°C.',
        requirements: 'Corrosion-resistant, High thermal efficiency, Easy maintenance, 10-year warranty',
        expectedBudget: '₹25,00,000 - ₹35,00,000',
        timeline: 'Required within 3 months',
        enquiryDate: new Date(),
        priority: 'High',
        source: 'Website',
        notes: 'Customer is expanding their chemical processing capacity and needs reliable equipment.',
        customerId: customer.id,
        marketingPersonId: employee.id,
      },
    });
    console.log(`✅ Enquiry created: ${enquiry.subject} (ID: ${enquiry.id})\n`);

    // 5. Create a quotation
    console.log('💰 Creating quotation...');
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: `QT-2024-001${uniqueSuffix}`,
        quotationDate: new Date(),
        validityPeriod: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        revisionNumber: 0,
        totalBasicPrice: 2800000, // ₹28,00,000
        gst: 504000, // 18% GST
        transportCosts: 50000, // ₹50,000
        insuranceCosts: 25000, // ₹25,000
        paymentTerms: '50% advance, 50% on delivery',
        deliverySchedule: '8-10 weeks from order confirmation',
        specialInstructions: 'All materials must be certified for chemical resistance',
        currency: 'INR',
        subtotal: 2800000,
        tax: 504000,
        totalValue: 3375000, // ₹33,75,000
        status: 'DRAFT',
        enquiryId: enquiry.id,
      },
    });
    console.log(`✅ Quotation created: ${quotation.quotationNumber} (ID: ${quotation.id})\n`);

    // 6. Create quotation items
    console.log('🔧 Creating quotation items...');
    const quotationItems = await Promise.all([
      prisma.quotationItem.create({
        data: {
          materialDescription: 'Graphite Heat Exchanger Core',
          specifications: 'Corrosion-resistant graphite, 200°C max temperature, 1000 L capacity',
          quantity: 1,
          pricePerUnit: 2000000, // ₹20,00,000
          total: 2000000,
          quotationId: quotation.id,
        },
      }),
      prisma.quotationItem.create({
        data: {
          materialDescription: 'Stainless Steel Frame & Supports',
          specifications: '316L stainless steel, powder coated finish',
          quantity: 1,
          pricePerUnit: 300000, // ₹3,00,000
          total: 300000,
          quotationId: quotation.id,
        },
      }),
      prisma.quotationItem.create({
        data: {
          materialDescription: 'Control System & Instrumentation',
          specifications: 'Digital temperature control, pressure monitoring, safety alarms',
          quantity: 1,
          pricePerUnit: 500000, // ₹5,00,000
          total: 500000,
          quotationId: quotation.id,
        },
      }),
    ]);
    console.log(`✅ Created ${quotationItems.length} quotation items\n`);

    // 7. Create communications
    console.log('📞 Creating communications...');
    const communications = await Promise.all([
      // Initial enquiry communication
      prisma.communication.create({
        data: {
          subject: `Initial Enquiry Discussion - Graphite Heat Exchanger${uniqueSuffix}`,
          description: 'Discussed customer requirements for graphite heat exchanger. Customer needs equipment for chemical processing plant with specific corrosion resistance requirements.',
          type: 'TELEPHONIC',
          nextCommunicationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          proposedNextAction: 'Send detailed technical proposal',
          customerId: customer.id,
          contactId: contact.id,
          employeeId: employee.id,
        },
      }),
      // Follow-up communication
      prisma.communication.create({
        data: {
          subject: `Technical Proposal Discussion${uniqueSuffix}`,
          description: 'Presented technical proposal to customer. Customer showed interest in our solution and requested pricing details.',
          type: 'VIRTUAL_MEETING',
          nextCommunicationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          proposedNextAction: 'Prepare detailed quotation',
          customerId: customer.id,
          contactId: contact.id,
          employeeId: employee.id,
        },
      }),
      // Quotation submission communication
      prisma.communication.create({
        data: {
          subject: `Quotation Submission - Graphite Heat Exchanger${uniqueSuffix}`,
          description: 'Submitted detailed quotation with pricing and technical specifications. Customer will review and get back within a week.',
          type: 'EMAIL',
          nextCommunicationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          proposedNextAction: 'Follow up on quotation review',
          customerId: customer.id,
          contactId: contact.id,
          employeeId: employee.id,
        },
      }),
    ]);
    console.log(`✅ Created ${communications.length} communications\n`);

    // 8. Update enquiry status to quoted
    console.log('🔄 Updating enquiry status...');
    await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: { status: 'QUOTED' },
    });
    console.log('✅ Enquiry status updated to QUOTED\n');

    // 9. Update quotation status to submitted
    console.log('📤 Updating quotation status...');
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: 'SUBMITTED' },
    });
    console.log('✅ Quotation status updated to SUBMITTED\n');

    console.log('🎉 All dummy data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Customer: ${customer.name}`);
    console.log(`   • Contact: ${contact.name}`);
    console.log(`   • Employee: ${employee.name}`);
    console.log(`   • Enquiry: ${enquiry.subject}`);
    console.log(`   • Quotation: ${quotation.quotationNumber}`);
    console.log(`   • Communications: ${communications.length} records`);
    console.log(`   • Quotation Items: ${quotationItems.length} items`);
    console.log('\n🔗 You can now test the complete workflow in your application!');

  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createDummyData()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createDummyData };

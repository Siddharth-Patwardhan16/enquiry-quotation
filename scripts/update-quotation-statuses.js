const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateQuotationStatuses() {
  try {
    console.log('Updating existing quotation statuses...');
    
    // Update LIVE status to DRAFT
    const liveCount = await prisma.quotation.updateMany({
      where: { status: 'LIVE' },
      data: { status: 'DRAFT' }
    });
    console.log(`Updated ${liveCount.count} quotations from LIVE to DRAFT`);
    
    // Update DEAD status to LOST
    const deadCount = await prisma.quotation.updateMany({
      where: { status: 'DEAD' },
      data: { status: 'LOST' }
    });
    console.log(`Updated ${deadCount.count} quotations from DEAD to LOST`);
    
    // Update ON_HOLD status to PENDING
    const onHoldCount = await prisma.quotation.updateMany({
      where: { status: 'ON_HOLD' },
      data: { status: 'PENDING' }
    });
    console.log(`Updated ${onHoldCount.count} quotations from ON_HOLD to PENDING`);
    
    console.log('Successfully updated all quotation statuses!');
  } catch (error) {
    console.error('Error updating quotation statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateQuotationStatuses();

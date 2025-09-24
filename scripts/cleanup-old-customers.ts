import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOldData() {
  console.log('🧹 Cleaning up old customer data...');

  try {
    // Delete old customer data in the correct order to avoid foreign key constraints
    await prisma.communication.deleteMany({
      where: {
        customerId: {
          not: null,
        },
      },
    });

    await prisma.contact.deleteMany({
      where: {
        customerId: {
          not: null,
        } as any,
      },
    });

    await prisma.location.deleteMany({
      where: {
        customerId: {
          not: null,
        } as any,
      },
    });

    await prisma.customer.deleteMany({});

    console.log('✅ Old customer data cleaned up successfully');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await cleanupOldData();
    console.log('✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

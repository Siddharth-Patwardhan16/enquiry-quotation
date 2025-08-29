const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removePoNone() {
  try {
    console.log('🔄 Removing poNone column from Customer table...');
    
    // Remove poNone column
    await prisma.$executeRaw`
      ALTER TABLE "Customer" 
      DROP COLUMN IF EXISTS "poNone";
    `;
    console.log('✅ Removed poNone column');
    
    console.log('🎉 Successfully removed poNone field from Customer table!');
    
    // Show current table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Customer' 
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📋 Current Customer table structure:');
    tableInfo.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error removing poNone field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
removePoNone();


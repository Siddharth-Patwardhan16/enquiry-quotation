const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addOfficePlantNames() {
  try {
    console.log('🔄 Adding officeName and plantName fields to Customer table...');
    
    // Add officeName column
    await prisma.$executeRaw`
      ALTER TABLE "Customer" 
      ADD COLUMN IF NOT EXISTS "officeName" TEXT;
    `;
    console.log('✅ Added officeName column');
    
    // Add plantName column
    await prisma.$executeRaw`
      ALTER TABLE "Customer" 
      ADD COLUMN IF NOT EXISTS "plantName" TEXT;
    `;
    console.log('✅ Added plantName column');
    
    // Create unique indexes for better search performance
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "Customer_officeName_key" 
      ON "Customer"("officeName") 
      WHERE "officeName" IS NOT NULL;
    `;
    console.log('✅ Created unique index for officeName');
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "Customer_plantName_key" 
      ON "Customer"("plantName") 
      WHERE "plantName" IS NOT NULL;
    `;
    console.log('✅ Created unique index for plantName');
    
    console.log('🎉 Successfully added officeName and plantName fields to Customer table!');
    
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
    console.error('❌ Error adding officeName and plantName fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addOfficePlantNames();


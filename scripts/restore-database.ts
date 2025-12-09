import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Get backup directory from command line argument or use latest
const backupDirArg = process.argv[2];
let backupDir: string;

if (backupDirArg) {
  backupDir = path.isAbsolute(backupDirArg) 
    ? backupDirArg 
    : path.join(process.cwd(), backupDirArg);
} else {
  // Find latest backup
  const backupsPath = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsPath)) {
    console.error('❌ No backups directory found!');
    process.exit(1);
  }
  
  const backups = fs.readdirSync(backupsPath)
    .filter(dir => dir.startsWith('backup-'))
    .sort()
    .reverse();
  
  if (backups.length === 0) {
    console.error('❌ No backups found!');
    process.exit(1);
  }
  
  backupDir = path.join(backupsPath, backups[0]);
}

if (!fs.existsSync(backupDir)) {
  console.error(`❌ Backup directory not found: ${backupDir}`);
  process.exit(1);
}

console.log(`📦 Starting database restore...`);
console.log(`📁 Backup directory: ${backupDir}\n`);

async function restoreTable<T>(
  tableName: string,
  restoreFunction: (data: T[]) => Promise<void>
): Promise<void> {
  try {
    const filePath = path.join(backupDir, `${tableName}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  ${tableName}: No backup file found, skipping...`);
      return;
    }

    console.log(`  ⏳ Restoring ${tableName}...`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data: T[] = JSON.parse(fileContent);
    
    await restoreFunction(data);
    console.log(`  ✅ ${tableName}: ${data.length} records restored`);
  } catch (error) {
    console.error(`  ❌ Error restoring ${tableName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('⚠️  WARNING: This will restore data to your current database!');
    console.log('⚠️  Make sure you have a backup of the current database before proceeding.\n');
    
    // Read summary to verify backup
    const summaryPath = path.join(backupDir, 'backup-summary.json');
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      console.log(`📋 Backup Date: ${summary.backupDate}`);
      console.log(`📋 Tables: ${summary.tables.join(', ')}\n`);
    }

    console.log('🔄 Restoring data from backup...\n');

    // Restore tables in order (respecting foreign key constraints)
    // First, restore tables without dependencies
    await restoreTable('Employee', async (data) => {
      for (const record of data) {
        await prisma.employee.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Customer', async (data) => {
      for (const record of data) {
        await prisma.customer.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Company', async (data) => {
      for (const record of data) {
        await prisma.company.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Office', async (data) => {
      for (const record of data) {
        await prisma.office.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Plant', async (data) => {
      for (const record of data) {
        await prisma.plant.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Location', async (data) => {
      for (const record of data) {
        await prisma.location.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('ContactPerson', async (data) => {
      for (const record of data) {
        await prisma.contactPerson.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Contact', async (data) => {
      for (const record of data) {
        await prisma.contact.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Enquiry', async (data) => {
      for (const record of data) {
        await prisma.enquiry.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Quotation', async (data) => {
      for (const record of data) {
        await prisma.quotation.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('QuotationItem', async (data) => {
      for (const record of data) {
        await prisma.quotationItem.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Communication', async (data) => {
      for (const record of data) {
        await prisma.communication.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    await restoreTable('Document', async (data) => {
      for (const record of data) {
        await prisma.document.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    console.log('\n✅ Database restore completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify the restored data in your application');
    console.log('   2. Test all functionality to ensure data integrity');
    console.log('   3. Update your environment variables if needed');

  } catch (error) {
    console.error('\n❌ Restore failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


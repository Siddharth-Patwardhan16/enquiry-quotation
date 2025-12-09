import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Create backup directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`);

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log(`📦 Starting database backup...`);
console.log(`📁 Backup directory: ${backupDir}\n`);

async function backupTable<T>(
  tableName: string,
  fetchFunction: () => Promise<T[]>
): Promise<void> {
  try {
    console.log(`  ⏳ Backing up ${tableName}...`);
    const data = await fetchFunction();
    const filePath = path.join(backupDir, `${tableName}.json`);
    
    // Convert BigInt and Date objects to strings for JSON serialization
    const serializedData = JSON.stringify(data, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2);
    
    fs.writeFileSync(filePath, serializedData, 'utf-8');
    console.log(`  ✅ ${tableName}: ${data.length} records backed up`);
  } catch (error) {
    console.error(`  ❌ Error backing up ${tableName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔄 Fetching all data from database...\n');

    // Backup all tables
    await backupTable('Employee', () => prisma.employee.findMany());
    await backupTable('Customer', () => prisma.customer.findMany());
    await backupTable('Company', () => prisma.company.findMany());
    await backupTable('Office', () => prisma.office.findMany());
    await backupTable('Plant', () => prisma.plant.findMany());
    await backupTable('ContactPerson', () => prisma.contactPerson.findMany());
    await backupTable('Location', () => prisma.location.findMany());
    await backupTable('Contact', () => prisma.contact.findMany());
    await backupTable('Enquiry', () => prisma.enquiry.findMany());
    await backupTable('Quotation', () => prisma.quotation.findMany());
    await backupTable('QuotationItem', () => prisma.quotationItem.findMany());
    await backupTable('Communication', () => prisma.communication.findMany());
    await backupTable('Document', () => prisma.document.findMany());

    // Create a summary file
    const summary = {
      backupDate: new Date().toISOString(),
      timestamp: timestamp,
      tables: [
        'Employee',
        'Customer',
        'Company',
        'Office',
        'Plant',
        'ContactPerson',
        'Location',
        'Contact',
        'Enquiry',
        'Quotation',
        'QuotationItem',
        'Communication',
        'Document'
      ],
      note: 'This backup contains all data from the Supabase database. Use this to restore data to a new Supabase account.'
    };

    fs.writeFileSync(
      path.join(backupDir, 'backup-summary.json'),
      JSON.stringify(summary, null, 2),
      'utf-8'
    );

    console.log('\n✅ Database backup completed successfully!');
    console.log(`📁 Backup location: ${backupDir}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Verify the backup files in the backup directory');
    console.log('   2. Store this backup in a safe location');
    console.log('   3. Use the restore script to import data to the new Supabase account');
    console.log('\n⚠️  IMPORTANT: Keep this backup secure and do not share it publicly!');

  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

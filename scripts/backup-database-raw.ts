import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config(); // Also try .env

async function backupDatabase() {
  // Check if DATABASE_URL is set and strip quotes if present
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set!');
    console.error('   Please ensure your .env or .env.local file contains DATABASE_URL');
    process.exit(1);
  }
  
  // Strip quotes if present (common in .env files)
  databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');
  process.env.DATABASE_URL = databaseUrl;
  
  console.log('🔄 Creating full database backup using raw SQL...');
  console.log(`   Database: ${databaseUrl.substring(0, 30)}...`);
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    // Create backup directory
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `database-backup-${timestamp}.json`);
    
    console.log('📦 Fetching all data from database using raw SQL...');
    
    // Helper function to add small delay between queries
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Use raw SQL to fetch data - this avoids Prisma schema issues
    console.log('  → Fetching enquiries...');
    const enquiries = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "Enquiry" ORDER BY id
    `);
    await delay(500);
    
    console.log('  → Fetching companies...');
    const companies = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "Company" ORDER BY id
    `);
    await delay(500);
    
    console.log('  → Fetching employees...');
    const employees = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "Employee" ORDER BY id
    `);
    await delay(500);
    
    console.log('  → Fetching quotations...');
    const quotations = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "Quotation" ORDER BY id
    `);
    await delay(500);
    
    console.log('  → Fetching quotation items...');
    const quotationItems = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "QuotationItem" ORDER BY id
    `);
    await delay(500);
    
    console.log('  → Fetching communications...');
    const communications = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "Communication" ORDER BY id
    `);
    await delay(500);
    
    console.log('  → Fetching offices...');
    const offices = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "Office" ORDER BY id
    `);
    await delay(500);
    
    console.log('  → Fetching plants...');
    const plants = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "Plant" ORDER BY id
    `);
    await delay(500);
    
    console.log('  → Fetching contact persons...');
    const contactPersons = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "ContactPerson" ORDER BY id
    `);
    await delay(500);
    
    // Legacy data (if exists)
    console.log('  → Fetching legacy data (if exists)...');
    let customers: any[] = [];
    let locations: any[] = [];
    let contacts: any[] = [];
    
    try {
      customers = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM "Customer" ORDER BY id
      `);
      await delay(500);
      locations = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM "Location" ORDER BY id
      `);
      await delay(500);
      contacts = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM "Contact" ORDER BY id
      `);
    } catch (error) {
      // Legacy tables might not exist, ignore errors
      console.log('  → Legacy tables not found, skipping...');
    }
    
    // Fetch documents if table exists
    let documents: any[] = [];
    try {
      console.log('  → Fetching documents...');
      documents = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM "Document" ORDER BY id
      `);
      await delay(500);
    } catch (error) {
      console.log('  → Documents table not found, skipping...');
    }
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      schema: {
        enquiries,
        companies,
        employees,
        quotations,
        quotationItems,
        communications,
        offices,
        plants,
        contactPersons,
        customers,
        locations,
        contacts,
        documents,
      }
    };
    
    // Write backup to file
    console.log('💾 Writing backup to file...');
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    // Calculate file size
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n✅ Backup created successfully!`);
    console.log(`📁 File: ${backupFile}`);
    console.log(`📊 Size: ${fileSizeInMB} MB`);
    console.log(`\n📦 Backup contains:`);
    console.log(`   - ${backupData.schema.enquiries.length} enquiries`);
    console.log(`   - ${backupData.schema.companies.length} companies`);
    console.log(`   - ${backupData.schema.employees.length} employees`);
    console.log(`   - ${backupData.schema.quotations.length} quotations`);
    console.log(`   - ${backupData.schema.quotationItems.length} quotation items`);
    console.log(`   - ${backupData.schema.communications.length} communications`);
    console.log(`   - ${backupData.schema.offices.length} offices`);
    console.log(`   - ${backupData.schema.plants.length} plants`);
    console.log(`   - ${backupData.schema.contactPersons.length} contact persons`);
    if (backupData.schema.documents && backupData.schema.documents.length > 0) {
      console.log(`   - ${backupData.schema.documents.length} documents`);
    }
    if (backupData.schema.customers && backupData.schema.customers.length > 0) {
      console.log(`   - ${backupData.schema.customers.length} customers (legacy)`);
      console.log(`   - ${backupData.schema.locations.length} locations (legacy)`);
      console.log(`   - ${backupData.schema.contacts.length} contacts (legacy)`);
    }
    console.log(`\n⏰ Backup timestamp: ${backupData.timestamp}`);
    console.log(`\n⚠️  IMPORTANT: This backup was created BEFORE applying the migration.`);
    console.log(`   Make sure to apply the migration after verifying this backup.`);
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    // Wait a bit to ensure connection is fully closed
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run backup
backupDatabase()
  .then(() => {
    console.log('\n✨ Backup process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Backup process failed:', error);
    process.exit(1);
  });


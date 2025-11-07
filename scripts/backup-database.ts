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
  
  console.log('🔄 Creating full database backup...');
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
    
    console.log('📦 Fetching all data from database...');
    console.log('  → Using raw SQL queries to avoid connection pooling issues...');
    
    // Helper function to add small delay between queries
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Fetch data using simple queries to avoid connection pooling issues
    console.log('  → Fetching enquiries...');
    const enquiries = await prisma.enquiry.findMany();
    await delay(500);
    
    console.log('  → Fetching companies...');
    const companies = await prisma.company.findMany();
    await delay(500);
    
    console.log('  → Fetching employees...');
    const employees = await prisma.employee.findMany();
    await delay(500);
    
    console.log('  → Fetching quotations...');
    const quotations = await prisma.quotation.findMany();
    await delay(500);
    
    console.log('  → Fetching communications...');
    const communications = await prisma.communication.findMany();
    await delay(500);
    
    // Legacy data (if exists)
    console.log('  → Fetching quotation items...');
    const quotationItems = await prisma.quotationItem.findMany();
    await delay(500);
    
    console.log('  → Fetching offices...');
    const offices = await prisma.office.findMany();
    await delay(500);
    
    console.log('  → Fetching plants...');
    const plants = await prisma.plant.findMany();
    await delay(500);
    
    console.log('  → Fetching contact persons...');
    const contactPersons = await prisma.contactPerson.findMany();
    await delay(500);
    
    // Legacy data (if exists)
    console.log('  → Fetching legacy data (if exists)...');
    let customers: any[] = [];
    let locations: any[] = [];
    let contacts: any[] = [];
    
    try {
      customers = await prisma.customer.findMany();
      await delay(500);
      locations = await prisma.location.findMany();
      await delay(500);
      contacts = await prisma.contact.findMany();
    } catch (error) {
      // Legacy tables might not exist, ignore errors
      console.log('  → Legacy tables not found, skipping...');
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
    if (backupData.schema.customers && backupData.schema.customers.length > 0) {
      console.log(`   - ${backupData.schema.customers.length} customers (legacy)`);
      console.log(`   - ${backupData.schema.locations.length} locations (legacy)`);
      console.log(`   - ${backupData.schema.contacts.length} contacts (legacy)`);
    }
    console.log(`\n⏰ Backup timestamp: ${backupData.timestamp}`);
    
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


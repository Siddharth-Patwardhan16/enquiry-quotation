import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
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
  
  console.log('🔄 Creating full database backup using direct PostgreSQL connection...');
  console.log(`   Database: ${databaseUrl.substring(0, 30)}...`);
  
  // Use direct pg connection to avoid Prisma connection pooling issues
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1, // Use single connection
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
    
    // Use direct pg queries to avoid Prisma schema issues and connection pooling problems
    // Convert numberOfBlocks to text in the query to handle the type mismatch
    console.log('  → Fetching enquiries...');
    const enquiriesResult = await pool.query(`
      SELECT 
        id, subject, description, requirements, timeline, "enquiryDate", priority, source, notes, 
        status, "regretReason", "quotationNumber", "quotationDate", region, "oaNumber", "oaDate", 
        "dateOfReceipt", "blockModel", 
        CASE WHEN "numberOfBlocks" IS NOT NULL THEN "numberOfBlocks"::text ELSE NULL END as "numberOfBlocks",
        "designRequired", "customerType", "purchaseOrderNumber", "poValue", "poDate", 
        "createdAt", "updatedAt", "locationId", "officeId", "plantId", "marketingPersonId", 
        "attendedById", "customerId", "companyId"
      FROM "Enquiry" ORDER BY id
    `);
    const enquiries = enquiriesResult.rows;
    await delay(500);
    
    console.log('  → Fetching companies...');
    const companiesResult = await pool.query('SELECT * FROM "Company" ORDER BY id');
    const companies = companiesResult.rows;
    await delay(500);
    
    console.log('  → Fetching employees...');
    const employeesResult = await pool.query('SELECT * FROM "Employee" ORDER BY id');
    const employees = employeesResult.rows;
    await delay(500);
    
    console.log('  → Fetching quotations...');
    const quotationsResult = await pool.query('SELECT * FROM "Quotation" ORDER BY id');
    const quotations = quotationsResult.rows;
    await delay(500);
    
    console.log('  → Fetching quotation items...');
    const quotationItemsResult = await pool.query('SELECT * FROM "QuotationItem" ORDER BY id');
    const quotationItems = quotationItemsResult.rows;
    await delay(500);
    
    console.log('  → Fetching communications...');
    const communicationsResult = await pool.query('SELECT * FROM "Communication" ORDER BY id');
    const communications = communicationsResult.rows;
    await delay(500);
    
    console.log('  → Fetching offices...');
    const officesResult = await pool.query('SELECT * FROM "Office" ORDER BY id');
    const offices = officesResult.rows;
    await delay(500);
    
    console.log('  → Fetching plants...');
    const plantsResult = await pool.query('SELECT * FROM "Plant" ORDER BY id');
    const plants = plantsResult.rows;
    await delay(500);
    
    console.log('  → Fetching contact persons...');
    const contactPersonsResult = await pool.query('SELECT * FROM "ContactPerson" ORDER BY id');
    const contactPersons = contactPersonsResult.rows;
    await delay(500);
    
    // Legacy data (if exists)
    console.log('  → Fetching legacy data (if exists)...');
    let customers: any[] = [];
    let locations: any[] = [];
    let contacts: any[] = [];
    
    try {
      const customersResult = await pool.query('SELECT * FROM "Customer" ORDER BY id');
      customers = customersResult.rows;
      await delay(500);
      const locationsResult = await pool.query('SELECT * FROM "Location" ORDER BY id');
      locations = locationsResult.rows;
      await delay(500);
      const contactsResult = await pool.query('SELECT * FROM "Contact" ORDER BY id');
      contacts = contactsResult.rows;
    } catch (error) {
      // Legacy tables might not exist, ignore errors
      console.log('  → Legacy tables not found, skipping...');
    }
    
    // Fetch documents if table exists
    let documents: any[] = [];
    try {
      console.log('  → Fetching documents...');
      const documentsResult = await pool.query('SELECT * FROM "Document" ORDER BY id');
      documents = documentsResult.rows;
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
    await pool.end();
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


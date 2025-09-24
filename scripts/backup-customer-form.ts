import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupCustomerForm() {
  try {
    console.log('🔄 Creating backup of current customer form data...');
    
    // Create backup directory
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `customer-form-backup-${timestamp}.json`);
    
    // Backup all customer-related data
    const backupData = {
      timestamp: new Date().toISOString(),
      customers: await prisma.customer.findMany({
        include: {
          locations: {
            include: {
              contacts: true
            }
          },
          contacts: true,
          enquiries: true,
          communications: true
        }
      }),
      locations: await prisma.location.findMany({
        include: {
          contacts: true
        }
      }),
      contacts: await prisma.contact.findMany(),
      enquiries: await prisma.enquiry.findMany(),
      communications: await prisma.communication.findMany()
    };
    
    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created successfully: ${backupFile}`);
    console.log(`📊 Backup contains:`);
    console.log(`   - ${backupData.customers.length} customers`);
    console.log(`   - ${backupData.locations.length} locations`);
    console.log(`   - ${backupData.contacts.length} contacts`);
    console.log(`   - ${backupData.enquiries.length} enquiries`);
    console.log(`   - ${backupData.communications.length} communications`);
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if called directly
if (require.main === module) {
  backupCustomerForm();
}

export { backupCustomerForm };

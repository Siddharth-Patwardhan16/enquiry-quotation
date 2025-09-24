import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrateCustomerForm() {
  try {
    console.log('🔄 Starting customer form migration...');
    
    // Step 1: Backup existing data
    console.log('\n📦 Step 1: Creating backup...');
    const { backupCustomerForm } = await import('./backup-customer-form');
    const backupFile = await backupCustomerForm();
    
    // Step 2: Check if Company table exists
    console.log('\n🔍 Step 2: Checking database schema...');
    const companyCount = await prisma.company.count();
    console.log(`   - Companies in database: ${companyCount}`);
    
    // Step 3: Convert existing customers to companies if not already done
    if (companyCount === 0) {
      console.log('\n🔄 Step 3: Converting customers to companies...');
      
      const customers = await prisma.customer.findMany({
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
      });
      
      console.log(`   - Found ${customers.length} customers to convert`);
      
      for (const customer of customers) {
        try {
          // Create company from customer
          const company = await prisma.company.create({
            data: {
              name: customer.name,
              website: null,
              industry: null,
              createdById: customer.createdById,
              poRuptureDiscs: customer.poRuptureDiscs,
              poThermowells: customer.poThermowells,
              poHeatExchanger: customer.poHeatExchanger,
              poMiscellaneous: customer.poMiscellaneous,
              poWaterJetSteamJet: customer.poWaterJetSteamJet,
              existingGraphiteSuppliers: customer.existingGraphiteSuppliers,
              problemsFaced: customer.problemsFaced
            }
          });
          
          console.log(`   ✅ Company created: ${company.name}`);
          
          // Convert locations to offices/plants
          for (const location of customer.locations) {
            if (location.type === 'OFFICE') {
              const office = await prisma.office.create({
                data: {
                  companyId: company.id,
                  name: location.name,
                  address: location.address,
                  city: location.city,
                  state: location.state,
                  country: location.country,
                  receptionNumber: location.receptionNumber,
                  isHeadOffice: customer.locations.filter(l => l.type === 'OFFICE').indexOf(location) === 0
                }
              });
              
              // Convert location contacts to office contacts
              for (const contact of location.contacts) {
                await prisma.contactPerson.create({
                  data: {
                    name: contact.name,
                    designation: contact.designation,
                    phoneNumber: contact.officialCellNumber || contact.personalCellNumber,
                    emailId: null,
                    isPrimary: false,
                    officeId: office.id,
                    companyId: company.id
                  }
                });
              }
              
              console.log(`     ✅ Office created: ${office.name}`);
              
            } else if (location.type === 'PLANT') {
              const plant = await prisma.plant.create({
                data: {
                  companyId: company.id,
                  name: location.name,
                  address: location.address,
                  city: location.city,
                  state: location.state,
                  country: location.country,
                  receptionNumber: location.receptionNumber,
                  plantType: 'Manufacturing'
                }
              });
              
              // Convert location contacts to plant contacts
              for (const contact of location.contacts) {
                await prisma.contactPerson.create({
                  data: {
                    name: contact.name,
                    designation: contact.designation,
                    phoneNumber: contact.officialCellNumber || contact.personalCellNumber,
                    emailId: null,
                    isPrimary: false,
                    plantId: plant.id,
                    companyId: company.id
                  }
                });
              }
              
              console.log(`     ✅ Plant created: ${plant.name}`);
            }
          }
          
          // Convert direct customer contacts to office contacts
          if (customer.contacts.length > 0) {
            const firstOffice = await prisma.office.findFirst({
              where: { companyId: company.id }
            });
            
            if (firstOffice) {
              for (const contact of customer.contacts) {
                await prisma.contactPerson.create({
                  data: {
                    name: contact.name,
                    designation: contact.designation,
                    phoneNumber: contact.officialCellNumber || contact.personalCellNumber,
                    emailId: null,
                    isPrimary: false,
                    officeId: firstOffice.id,
                    companyId: company.id
                  }
                });
              }
              console.log(`     ✅ Converted ${customer.contacts.length} direct contacts`);
            }
          }
          
          // Update enquiries to reference the new company
          for (const enquiry of customer.enquiries) {
            await prisma.enquiry.update({
              where: { id: enquiry.id },
              data: {
                companyId: company.id
              }
            });
          }
          
          // Update communications to reference the new company
          for (const communication of customer.communications) {
            await prisma.communication.update({
              where: { id: communication.id },
              data: {
                companyId: company.id
              }
            });
          }
          
          console.log(`   ✅ Successfully converted customer: ${customer.name}`);
          
        } catch (error) {
          console.error(`   ❌ Error converting customer ${customer.name}:`, error);
        }
      }
    } else {
      console.log('   ✅ Companies already exist, skipping conversion');
    }
    
    // Step 4: Verify migration
    console.log('\n📊 Step 4: Verifying migration...');
    const totalCompanies = await prisma.company.count();
    const totalOffices = await prisma.office.count();
    const totalPlants = await prisma.plant.count();
    const totalContactPersons = await prisma.contactPerson.count();
    
    console.log(`   - Companies: ${totalCompanies}`);
    console.log(`   - Offices: ${totalOffices}`);
    console.log(`   - Plants: ${totalPlants}`);
    console.log(`   - Contact Persons: ${totalContactPersons}`);
    
    console.log('\n🎉 Customer form migration completed successfully!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCustomerForm();
}

export { migrateCustomerForm };

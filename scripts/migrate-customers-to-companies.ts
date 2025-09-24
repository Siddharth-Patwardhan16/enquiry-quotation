import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OldCustomer {
  id: string;
  name: string;
  designation?: string | null;
  phoneNumber?: string | null;
  emailId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isNew: boolean;
  createdById?: string | null;
  poRuptureDiscs: boolean;
  poThermowells: boolean;
  poHeatExchanger: boolean;
  poMiscellaneous: boolean;
  poWaterJetSteamJet: boolean;
  existingGraphiteSuppliers?: string | null;
  problemsFaced?: string | null;
  locations: Array<{
    id: string;
    name: string;
    type: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    receptionNumber?: string | null;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    designation?: string | null;
    officialCellNumber?: string | null;
    personalCellNumber?: string | null;
    locationId: string;
  }>;
}

async function migrateCustomersToCompanies() {
  console.log('🚀 Starting migration of customers to companies...');

  try {
    // Get all old customers with their related data
    const oldCustomers = await prisma.customer.findMany({
      include: {
        locations: true,
        contacts: true,
      },
    });

    console.log(`📊 Found ${oldCustomers.length} customers to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const customer of oldCustomers) {
      try {
        // Check if a company with the same name already exists
        const existingCompany = await prisma.company.findFirst({
          where: {
            name: customer.name,
          },
        });

        if (existingCompany) {
          console.log(`⏭️  Skipping customer "${customer.name}" - company already exists`);
          skippedCount++;
          continue;
        }

        // Create new company
        const newCompany = await prisma.company.create({
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
            problemsFaced: customer.problemsFaced,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
          },
        });

        console.log(`✅ Created company: ${newCompany.name}`);

        // Convert locations to offices and plants
        for (const location of customer.locations) {
          if (location.type === 'OFFICE') {
            // Create office
            const office = await prisma.office.create({
              data: {
                name: location.name,
                address: location.address,
                area: null,
                city: location.city,
                state: location.state,
                country: location.country,
                pincode: null,
                isHeadOffice: false,
                receptionNumber: location.receptionNumber,
                companyId: newCompany.id,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });

            // Convert contacts to contact persons for this office
            const officeContacts = customer.contacts.filter(
              contact => contact.locationId === location.id
            );

            for (const contact of officeContacts) {
              await prisma.contactPerson.create({
                data: {
                  name: contact.name,
                  designation: contact.designation,
                  phoneNumber: contact.officialCellNumber || contact.personalCellNumber,
                  emailId: null,
                  isPrimary: false,
                  officeId: office.id,
                  companyId: newCompany.id,
                  createdAt: contact.createdAt,
                  updatedAt: contact.updatedAt,
                },
              });
            }
          } else if (location.type === 'PLANT') {
            // Create plant
            const plant = await prisma.plant.create({
              data: {
                name: location.name,
                address: location.address,
                area: null,
                city: location.city,
                state: location.state,
                country: location.country,
                pincode: null,
                plantType: null, // Remove plantType as requested
                receptionNumber: location.receptionNumber,
                companyId: newCompany.id,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });

            // Convert contacts to contact persons for this plant
            const plantContacts = customer.contacts.filter(
              contact => contact.locationId === location.id
            );

            for (const contact of plantContacts) {
              await prisma.contactPerson.create({
                data: {
                  name: contact.name,
                  designation: contact.designation,
                  phoneNumber: contact.officialCellNumber || contact.personalCellNumber,
                  emailId: null,
                  isPrimary: false,
                  plantId: plant.id,
                  companyId: newCompany.id,
                  createdAt: contact.createdAt,
                  updatedAt: contact.updatedAt,
                },
              });
            }
          }
        }

        // If customer has phone/email but no locations, create a default office
        if (customer.phoneNumber || customer.emailId) {
          const defaultOffice = await prisma.office.create({
            data: {
              name: 'Main Office',
              address: null,
              area: null,
              city: null,
              state: null,
              country: null,
              pincode: null,
              isHeadOffice: true,
              receptionNumber: customer.phoneNumber,
              companyId: newCompany.id,
              createdAt: customer.createdAt,
              updatedAt: customer.updatedAt,
            },
          });

          // Create contact person for the customer's direct contact info
          await prisma.contactPerson.create({
            data: {
              name: customer.name,
              designation: customer.designation,
              phoneNumber: customer.phoneNumber,
              emailId: customer.emailId,
              isPrimary: true,
              officeId: defaultOffice.id,
              companyId: newCompany.id,
              createdAt: customer.createdAt,
              updatedAt: customer.updatedAt,
            },
          });
        }

        // Update any enquiries that reference this customer to reference the new company
        await prisma.enquiry.updateMany({
          where: {
            customerId: customer.id,
          },
          data: {
            companyId: newCompany.id,
            customerId: null, // Remove old customer reference
          },
        });

        migratedCount++;
        console.log(`✅ Migrated customer "${customer.name}" to company`);

      } catch (error) {
        console.error(`❌ Error migrating customer "${customer.name}":`, error);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} customers`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} customers`);
    console.log(`📊 Total processed: ${oldCustomers.length} customers`);

    // Verify migration
    const totalCompanies = await prisma.company.count();
    const totalOffices = await prisma.office.count();
    const totalPlants = await prisma.plant.count();
    const totalContactPersons = await prisma.contactPerson.count();

    console.log(`\n🔍 Verification:`);
    console.log(`📊 Total companies: ${totalCompanies}`);
    console.log(`🏢 Total offices: ${totalOffices}`);
    console.log(`🏭 Total plants: ${totalPlants}`);
    console.log(`👥 Total contact persons: ${totalContactPersons}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function cleanupOldData() {
  console.log('\n🧹 Cleaning up old customer data...');

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
    await migrateCustomersToCompanies();
    
    // Ask for confirmation before cleanup
    console.log('\n⚠️  Migration completed successfully!');
    console.log('🔍 Please verify the data before proceeding with cleanup.');
    console.log('📝 To clean up old customer data, run: npm run cleanup-old-customers');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  main();
}

export { migrateCustomersToCompanies, cleanupOldData };

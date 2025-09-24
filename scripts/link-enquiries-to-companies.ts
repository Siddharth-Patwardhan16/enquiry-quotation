import { prisma } from '../src/server/db';

async function linkEnquiriesToCompanies() {
  console.log('🔗 Linking enquiries to new company structure...');
  
  try {
    // Get all enquiries that have customerId but no companyId
    const enquiriesToUpdate = await prisma.enquiry.findMany({
      where: {
        customerId: { not: null },
        companyId: null
      },
      include: {
        customer: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`\n📊 Found ${enquiriesToUpdate.length} enquiries to update:`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const enquiry of enquiriesToUpdate) {
      if (!enquiry.customer) {
        console.log(`⚠️ Enquiry ${enquiry.id} has customerId but no customer data`);
        skippedCount++;
        continue;
      }

      // Find matching company by name (case insensitive)
      const matchingCompany = await prisma.company.findFirst({
        where: {
          name: {
            equals: enquiry.customer.name,
            mode: 'insensitive'
          }
        }
      });

      if (matchingCompany) {
        // Update the enquiry to link to the company
        await prisma.enquiry.update({
          where: { id: enquiry.id },
          data: {
            companyId: matchingCompany.id
          }
        });

        console.log(`✅ Updated enquiry ${enquiry.id}: "${enquiry.customer.name}" → Company "${matchingCompany.name}"`);
        updatedCount++;
      } else {
        console.log(`⚠️ No matching company found for enquiry ${enquiry.id}: "${enquiry.customer.name}"`);
        skippedCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} enquiries`);
    console.log(`   ⚠️ Skipped: ${skippedCount} enquiries`);
    console.log(`   📊 Total processed: ${enquiriesToUpdate.length} enquiries`);

    // Verify the results
    console.log(`\n🔍 Verification - Checking updated enquiries:`);
    const updatedEnquiries = await prisma.enquiry.findMany({
      where: {
        companyId: { not: null }
      },
      include: {
        customer: {
          select: { name: true }
        },
        company: {
          select: { name: true }
        }
      }
    });

    console.log(`\n📋 Found ${updatedEnquiries.length} enquiries now linked to companies:`);
    updatedEnquiries.forEach((enquiry, index) => {
      console.log(`${index + 1}. Enquiry ${enquiry.id}: "${enquiry.customer?.name || 'N/A'}" → Company "${enquiry.company?.name || 'N/A'}"`);
    });

  } catch (error) {
    console.error('❌ Error linking enquiries to companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkEnquiriesToCompanies();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCompanies() {
  try {
    console.log('🔍 Checking existing companies...\n');
    
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            offices: true,
            plants: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (companies.length === 0) {
      console.log('✅ No companies found in database');
    } else {
      console.log(`📊 Found ${companies.length} companies:\n`);
      companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Created: ${company.createdAt.toISOString()}`);
        console.log(`   Offices: ${company._count.offices}, Plants: ${company._count.plants}`);
        console.log('');
      });
    }

    // Check if there are any duplicate names
    const companyNames = companies.map(c => c.name);
    const uniqueNames = new Set(companyNames);
    
    if (companyNames.length !== uniqueNames.size) {
      console.log('⚠️  WARNING: Duplicate company names found!');
      const duplicates = companyNames.filter((name, index) => companyNames.indexOf(name) !== index);
      console.log('Duplicates:', [...new Set(duplicates)]);
    } else {
      console.log('✅ No duplicate company names found');
    }

  } catch (error) {
    console.error('❌ Error checking companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanies();

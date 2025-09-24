import { prisma } from '../src/server/db';

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate data...');
  
  try {
    // Check customers
    const customers = await prisma.customer.findMany({
      select: { id: true, name: true, createdAt: true }
    });
    console.log(`\n📊 Found ${customers.length} customers:`);
    customers.forEach(c => console.log(`- ${c.name} (ID: ${c.id})`));
    
    // Check companies
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, createdAt: true }
    });
    console.log(`\n🏢 Found ${companies.length} companies:`);
    companies.forEach(c => console.log(`- ${c.name} (ID: ${c.id})`));
    
    // Check for duplicate names
    const allNames = [...customers.map(c => c.name), ...companies.map(c => c.name)];
    const duplicateNames = allNames.filter((name, index) => allNames.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      console.log(`\n⚠️ Duplicate names found:`);
      duplicateNames.forEach(name => console.log(`- ${name}`));
    } else {
      console.log(`\n✅ No duplicate names found`);
    }
    
    // Check for potential duplicates based on similar names
    console.log(`\n🔍 Checking for similar names...`);
    const allEntities = [
      ...customers.map(c => ({ ...c, type: 'customer' as const })),
      ...companies.map(c => ({ ...c, type: 'company' as const }))
    ];
    
    for (let i = 0; i < allEntities.length; i++) {
      for (let j = i + 1; j < allEntities.length; j++) {
        const entity1 = allEntities[i];
        const entity2 = allEntities[j];
        
        // Check for exact matches (case insensitive)
        if (entity1.name.toLowerCase() === entity2.name.toLowerCase()) {
          console.log(`⚠️ Exact match found: "${entity1.name}" (${entity1.type}) and "${entity2.name}" (${entity2.type})`);
        }
        // Check for similar names (fuzzy matching)
        else if (entity1.name.toLowerCase().includes(entity2.name.toLowerCase()) || 
                 entity2.name.toLowerCase().includes(entity1.name.toLowerCase())) {
          console.log(`🔍 Similar names: "${entity1.name}" (${entity1.type}) and "${entity2.name}" (${entity2.type})`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();

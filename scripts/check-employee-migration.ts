import { prisma } from '../src/server/db';

async function checkMigration() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log('Current employees:');
  employees.forEach(e => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.id);
    console.log(`  ${e.name}: ${e.id} ${isUUID ? '✅' : '❌'}`);
  });

  await prisma.$disconnect();
}

checkMigration();



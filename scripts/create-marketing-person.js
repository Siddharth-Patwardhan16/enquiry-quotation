const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMarketingPerson() {
  try {
    console.log('Creating default marketing person...');
    
    // Check if a marketing person already exists
    const existingMarketing = await prisma.employee.findFirst({
      where: { role: 'MARKETING' },
    });

    if (existingMarketing) {
      console.log('✅ Marketing person already exists:');
      console.log(`  - ID: ${existingMarketing.id}`);
      console.log(`  - Name: ${existingMarketing.name}`);
      console.log(`  - Email: ${existingMarketing.email}`);
      console.log(`  - Role: ${existingMarketing.role}`);
      return;
    }
    
    // Create a default marketing person
    const marketingPerson = await prisma.employee.create({
      data: {
        id: 'default-marketing-001', // Use a fixed ID for the default marketing person
        name: 'Default Marketing Person',
        email: 'marketing@company.com',
        role: 'MARKETING',
      },
    });
    
    console.log('✅ Default marketing person created successfully:');
    console.log(`  - ID: ${marketingPerson.id}`);
    console.log(`  - Name: ${marketingPerson.name}`);
    console.log(`  - Email: ${marketingPerson.email}`);
    console.log(`  - Role: ${marketingPerson.role}`);
    
    // Verify the employee was created
    const employeeCount = await prisma.employee.count();
    console.log(`📊 Total employees in database: ${employeeCount}`);
    
    // List all employees
    const allEmployees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('👥 All employees in database:');
    allEmployees.forEach(employee => {
      console.log(`  - ${employee.name} (${employee.email}) - Role: ${employee.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating marketing person:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMarketingPerson();

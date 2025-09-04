const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSignup() {
  try {
    console.log('Testing signup process...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testName = 'Test User';
    
    // Check if user already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: testEmail },
    });

    if (existingEmployee) {
      console.log('❌ Employee already exists with this email');
      return;
    }

    // Create a new Employee record
    const employee = await prisma.employee.create({
      data: {
        id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: testName,
        email: testEmail,
        role: 'MARKETING',
      },
    });

    console.log('✅ Employee created successfully:');
    console.log(`  - ID: ${employee.id}`);
    console.log(`  - Name: ${employee.name}`);
    console.log(`  - Email: ${employee.email}`);
    console.log(`  - Role: ${employee.role}`);
    
    // Clean up - delete the test employee
    await prisma.employee.delete({
      where: { id: employee.id }
    });
    console.log('🧹 Test employee cleaned up');
    
  } catch (error) {
    console.error('❌ Error testing signup:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSignup();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check Employee table (current schema uses Employee, not User)
    const employeeCount = await prisma.employee.count();
    console.log(`📊 Employees in database: ${employeeCount}`);
    
    if (employeeCount > 0) {
      const employees = await prisma.employee.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });
      console.log('👥 Sample employees:');
      employees.forEach(employee => {
        console.log(`  - ${employee.name} (${employee.email}) - Role: ${employee.role}`);
      });
    }
    
    // Check other tables
    const customerCount = await prisma.customer.count();
    console.log(`📊 Customers in database: ${customerCount}`);
    
    const quotationCount = await prisma.quotation.count();
    console.log(`📊 Quotations in database: ${quotationCount}`);
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();


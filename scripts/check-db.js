const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if User table exists and has data
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          supabaseId: true,
          createdAt: true
        }
      });
      console.log('👥 Sample users:');
      users.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    }
    
    // Check Employee table
    const employeeCount = await prisma.employee.count();
    console.log(`📊 Employees in database: ${employeeCount}`);
    
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


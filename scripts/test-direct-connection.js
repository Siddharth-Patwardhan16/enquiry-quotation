const { PrismaClient } = require('@prisma/client');

async function testDirectConnection() {
  // Create a new Prisma client with direct URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('Testing direct database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Direct connection successful');
    
    // Check users
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
    
    // Try to create a test user
    console.log('\nAttempting to create test user...');
    const newUser = await prisma.user.create({
      data: {
        email: 'direct-test@example.com',
        supabaseId: 'direct-test-123',
      },
    });
    
    console.log('✅ Test user created successfully:');
    console.log(`  - ID: ${newUser.id}`);
    console.log(`  - Email: ${newUser.email}`);
    
    // Verify the user was created
    const newUserCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${newUserCount}`);
    
  } catch (error) {
    console.error('❌ Direct connection test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectConnection();


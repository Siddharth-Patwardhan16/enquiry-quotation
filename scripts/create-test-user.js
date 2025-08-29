const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Create a test user
    const newUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        supabaseId: 'test-supabase-id-123',
      },
    });
    
    console.log('✅ Test user created successfully:');
    console.log(`  - ID: ${newUser.id}`);
    console.log(`  - Email: ${newUser.email}`);
    console.log(`  - Supabase ID: ${newUser.supabaseId}`);
    
    // Verify the user was created
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // List all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        supabaseId: true,
        createdAt: true
      }
    });
    
    console.log('👥 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();


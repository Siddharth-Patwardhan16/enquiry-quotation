// scripts/update-demo-admin.js
// Run this script to update the demo user to admin role

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDemoToAdmin() {
  try {
    // Update the demo user to admin role
    const updatedUser = await prisma.employee.update({
      where: { email: 'alice@company.com' },
      data: {
        role: 'ADMINISTRATOR',
      },
    });

    console.log('Demo user updated to admin successfully:', updatedUser);
    console.log('You can now login with:');
    console.log('Email: alice@company.com');
    console.log('Password: demo123');
  } catch (error) {
    console.error('Error updating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoToAdmin();


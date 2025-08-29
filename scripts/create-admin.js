// scripts/create-admin.js
// Run this script to create an admin user for testing

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.employee.findUnique({
      where: { email: 'admin@company.com' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin);
      return;
    }

    // Create admin user
    const adminUser = await prisma.employee.create({
      data: {
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'ADMINISTRATOR',
      },
    });

    console.log('Admin user created successfully:', adminUser);
    console.log('You can now login with:');
    console.log('Email: admin@company.com');
    console.log('Password: admin123 (or any password >= 6 characters)');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();


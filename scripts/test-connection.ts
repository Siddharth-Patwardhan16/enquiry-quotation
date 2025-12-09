import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  // Check if environment variables are set
  console.log('📋 Environment Variables Check:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   DIRECT_URL: ${process.env.DIRECT_URL ? '✅ Set' : '❌ Missing'}\n`);

  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    console.error('❌ ERROR: Neither DATABASE_URL nor DIRECT_URL is set!');
    console.log('\n💡 Please set these in your .env or .env.local file:');
    console.log('   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"');
    console.log('   DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"');
    process.exit(1);
  }

  // Test DATABASE_URL (Connection Pooling)
  if (process.env.DATABASE_URL) {
    console.log('🔗 Testing DATABASE_URL (Connection Pooling)...');
    try {
      const prismaPooling = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      await prismaPooling.$connect();
      console.log('   ✅ DATABASE_URL connection successful!');
      await prismaPooling.$disconnect();
    } catch (error: any) {
      console.log(`   ❌ DATABASE_URL connection failed: ${error.message}`);
      if (error.message.includes('P1001')) {
        console.log('   💡 Tip: Check if database is paused or connection string is incorrect');
      }
    }
  }

  // Test DIRECT_URL
  if (process.env.DIRECT_URL) {
    console.log('\n🔗 Testing DIRECT_URL (Direct Connection)...');
    try {
      const prismaDirect = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DIRECT_URL,
          },
        },
      });
      await prismaDirect.$connect();
      console.log('   ✅ DIRECT_URL connection successful!');
      
      // Try a simple query
      const result = await prismaDirect.$queryRaw`SELECT 1 as test`;
      console.log('   ✅ Query test successful!');
      
      await prismaDirect.$disconnect();
    } catch (error: any) {
      console.log(`   ❌ DIRECT_URL connection failed: ${error.message}`);
      if (error.message.includes('P1001')) {
        console.log('   💡 Tip: Check if database is paused or connection string is incorrect');
      }
      if (error.message.includes('password')) {
        console.log('   💡 Tip: Check if password is correct and URL-encoded');
      }
    }
  }

  // Test with Prisma's default (uses DIRECT_URL if available)
  console.log('\n🔗 Testing Prisma Default Connection...');
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('   ✅ Prisma default connection successful!');
    
    // Try to list tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    console.log(`   📊 Found ${tables.length} tables in database`);
    if (tables.length > 0) {
      console.log('   📋 Tables:', tables.map(t => t.tablename).join(', '));
    }
    
    await prisma.$disconnect();
    console.log('\n✅ All connection tests completed!');
  } catch (error: any) {
    console.log(`   ❌ Prisma default connection failed: ${error.message}`);
    console.log('\n❌ Connection test failed. Please check:');
    console.log('   1. Database is not paused in Supabase Dashboard');
    console.log('   2. Connection strings are correct');
    console.log('   3. Password is URL-encoded if it contains special characters');
    console.log('   4. Network/firewall allows connection');
    process.exit(1);
  }
}

testConnection().catch(console.error);


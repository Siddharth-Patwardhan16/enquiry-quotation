import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config(); // Also try .env

async function applyMigration() {
  // Check if DATABASE_URL is set and strip quotes if present
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set!');
    console.error('   Please ensure your .env or .env.local file contains DATABASE_URL');
    process.exit(1);
  }
  
  // Strip quotes if present (common in .env files)
  databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');
  
  console.log('🔄 Applying migration to convert numberOfBlocks from Decimal to String...');
  console.log(`   Database: ${databaseUrl.substring(0, 30)}...`);
  
  // Use direct pg connection
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1, // Use single connection
  });
  
  try {
    console.log('📦 Converting numberOfBlocks column type...');
    
    // Execute the migration SQL
    await pool.query(`
      ALTER TABLE "Enquiry" 
      ALTER COLUMN "numberOfBlocks" TYPE TEXT 
      USING "numberOfBlocks"::TEXT;
    `);
    
    console.log('✅ Migration applied successfully!');
    console.log('   The numberOfBlocks column has been converted from Decimal to String.');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await pool.end();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('\n✨ Migration process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration process failed:', error);
    process.exit(1);
  });


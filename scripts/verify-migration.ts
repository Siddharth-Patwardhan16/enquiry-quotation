import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config();

async function verifyMigration() {
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set!');
    process.exit(1);
  }
  
  databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });
  
  try {
    // Check the column type
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        udt_name
      FROM information_schema.columns 
      WHERE table_name = 'Enquiry' 
      AND column_name = 'numberOfBlocks'
    `);
    
    if (result.rows.length > 0) {
      const column = result.rows[0];
      console.log('✅ Column type check:');
      console.log(`   Column: ${column.column_name}`);
      console.log(`   Data Type: ${column.data_type}`);
      console.log(`   UDT Name: ${column.udt_name}`);
      
      if (column.data_type === 'text' || column.udt_name === 'text') {
        console.log('\n✅ Migration verified: numberOfBlocks is now TEXT type');
      } else {
        console.log('\n⚠️  Warning: Column type is not TEXT yet');
      }
      
      // Test query to see if we can fetch data
      const testResult = await pool.query('SELECT id, "numberOfBlocks" FROM "Enquiry" WHERE "numberOfBlocks" IS NOT NULL LIMIT 3');
      console.log(`\n📊 Sample data (first 3 records with numberOfBlocks):`);
      testResult.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. Enquiry ID ${row.id}: numberOfBlocks = "${row.numberOfBlocks}" (type: ${typeof row.numberOfBlocks})`);
      });
    } else {
      console.log('❌ Column not found');
    }
    
  } catch (error) {
    console.error('❌ Error verifying migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

verifyMigration()
  .then(() => {
    console.log('\n✨ Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });


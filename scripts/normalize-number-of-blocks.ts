import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config();

async function normalizeNumberOfBlocks() {
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set!');
    process.exit(1);
  }
  
  databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');
  
  console.log('🔄 Normalizing numberOfBlocks values...');
  console.log(`   Database: ${databaseUrl.substring(0, 30)}...`);
  
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });
  
  try {
    // First, let's see what we're working with
    console.log('\n📊 Checking current values...');
    const checkResult = await pool.query(`
      SELECT id, "numberOfBlocks" 
      FROM "Enquiry" 
      WHERE "numberOfBlocks" IS NOT NULL 
      ORDER BY id
    `);
    
    console.log(`   Found ${checkResult.rows.length} enquiries with numberOfBlocks values`);
    
    if (checkResult.rows.length === 0) {
      console.log('✅ No values to normalize.');
      return;
    }
    
    // Show some examples
    console.log('\n📋 Sample values before normalization:');
    checkResult.rows.slice(0, 5).forEach((row, idx) => {
      console.log(`   ${idx + 1}. Enquiry ID ${row.id}: "${row.numberOfBlocks}"`);
    });
    
    // Normalize the values
    // Convert decimal strings like "4.000000000000000000000000000000" to "4"
    // or "9.5" to "9.5" (preserve actual decimals)
    // Handle negative numbers and zeros properly
    console.log('\n🔄 Normalizing values...');
    
    const updateResult = await pool.query(`
      UPDATE "Enquiry"
      SET "numberOfBlocks" = CASE
        -- Handle zero values - keep as "0"
        WHEN "numberOfBlocks" = '0' OR "numberOfBlocks" ~ '^0+\.0+$' OR "numberOfBlocks" ~ '^-0+\.0+$' OR "numberOfBlocks" = '' THEN 
          '0'
        -- Handle whole numbers (positive and negative) - remove decimal part
        WHEN "numberOfBlocks" ~ '^-?[0-9]+\.0+$' THEN 
          SPLIT_PART("numberOfBlocks", '.', 1)
        -- Handle decimals - remove trailing zeros
        WHEN "numberOfBlocks" ~ '^-?[0-9]+\.[0-9]+$' THEN 
          REGEXP_REPLACE(
            REGEXP_REPLACE("numberOfBlocks", '0+$', ''), 
            '\\.$', 
            ''
          )
        ELSE 
          "numberOfBlocks"
      END
      WHERE "numberOfBlocks" IS NOT NULL AND "numberOfBlocks" != ''
    `);
    
    // Also update empty strings to NULL or '0' - let's set them to NULL since they're optional
    await pool.query(`
      UPDATE "Enquiry"
      SET "numberOfBlocks" = NULL
      WHERE "numberOfBlocks" = '' OR TRIM("numberOfBlocks") = ''
    `);
    
    console.log(`   ✅ Updated ${updateResult.rowCount} records`);
    
    // Verify the results
    console.log('\n📊 Verifying normalized values...');
    const verifyResult = await pool.query(`
      SELECT id, "numberOfBlocks" 
      FROM "Enquiry" 
      WHERE "numberOfBlocks" IS NOT NULL 
      ORDER BY id
    `);
    
    console.log('\n📋 Sample values after normalization:');
    verifyResult.rows.slice(0, 5).forEach((row, idx) => {
      console.log(`   ${idx + 1}. Enquiry ID ${row.id}: "${row.numberOfBlocks}"`);
    });
    
    console.log('\n✅ Normalization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error normalizing values:', error);
    throw error;
  } finally {
    await pool.end();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

normalizeNumberOfBlocks()
  .then(() => {
    console.log('\n✨ Normalization process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Normalization process failed:', error);
    process.exit(1);
  });


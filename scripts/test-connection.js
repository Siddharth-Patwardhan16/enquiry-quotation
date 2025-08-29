const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Check if User table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ User table exists');
      
      // Count users
      const userCount = await client.query('SELECT COUNT(*) FROM "User"');
      console.log(`📊 Users in database: ${userCount.rows[0].count}`);
      
      if (parseInt(userCount.rows[0].count) > 0) {
        const users = await client.query('SELECT id, email, "supabaseId" FROM "User" LIMIT 5');
        console.log('👥 Sample users:');
        users.rows.forEach(user => {
          console.log(`  - ${user.email} (ID: ${user.id})`);
        });
      }
    } else {
      console.log('❌ User table does not exist');
    }
    
    // Check Employee table
    const employeeResult = await client.query(`
      SELECT COUNT(*) FROM "Employee"
    `);
    console.log(`📊 Employees in database: ${employeeResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();


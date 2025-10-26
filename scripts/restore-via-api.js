const fs = require('fs');

async function restoreViaAPI() {
  try {
    console.log('🔄 Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync('backups/customer-form-backup-2025-09-23T06-32-40-418Z.json', 'utf8'));
    
    console.log(`📊 Found ${backupData.customers.length} customers in backup`);
    console.log('\n📋 Manual restoration instructions:');
    console.log('Since there are Prisma client issues, please restore the data manually through the application:');
    console.log('\n1. Open your browser to http://localhost:3000');
    console.log('2. Navigate to the customer creation page');
    console.log('3. Create the following companies with their data:\n');
    
    backupData.customers.forEach((customer, index) => {
      console.log(`${index + 1}. Company: "${customer.name.trim()}"`);
      console.log(`   - PO Rupture Discs: ${customer.poRuptureDiscs}`);
      console.log(`   - PO Thermowells: ${customer.poThermowells}`);
      console.log(`   - PO Heat Exchanger: ${customer.poHeatExchanger}`);
      console.log(`   - PO Miscellaneous: ${customer.poMiscellaneous}`);
      console.log(`   - PO Water Jet/Steam Jet: ${customer.poWaterJetSteamJet}`);
      
      if (customer.locations && customer.locations.length > 0) {
        console.log('   - Locations:');
        customer.locations.forEach(location => {
          console.log(`     * ${location.type}: ${location.name} (${location.city}, ${location.state}, ${location.country})`);
        });
      }
      
      if (customer.enquiries && customer.enquiries.length > 0) {
        console.log('   - Enquiries:');
        customer.enquiries.forEach(enquiry => {
          console.log(`     * ${enquiry.subject} (${enquiry.source}, ${enquiry.priority})`);
          console.log(`       Quotation #: ${enquiry.quotationNumber}`);
        });
      }
      
      if (customer.communications && customer.communications.length > 0) {
        console.log('   - Communications:');
        customer.communications.forEach(comm => {
          console.log(`     * ${comm.subject} (${comm.type}, ${comm.status})`);
        });
      }
      
      console.log('');
    });
    
    console.log('✅ Once you have manually created this data, all the improvements will be available!');
    console.log('🎯 The migration has already been applied, so you can test:');
    console.log('   - New quotation statuses (BUDGETARY, DEAD)');
    console.log('   - Simplified forms (no industry, website, area, pincode)');
    console.log('   - "Visit" source option in enquiries');
    console.log('   - Status filtering in quotation status page');
    console.log('   - PO Value field in quotations');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

restoreViaAPI();


#!/usr/bin/env node

const { createDummyData } = require('./create-dummy-data');

console.log('🎯 Dummy Data Generator for Enquiry System');
console.log('===========================================\n');

createDummyData()
  .then(() => {
    console.log('\n🎉 All done! You can now test your application with the dummy data.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Something went wrong:', error.message);
    process.exit(1);
  });


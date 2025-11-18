#!/usr/bin/env node

/**
 * Generate a secure random secret for Vercel Cron Jobs
 * 
 * Usage: node scripts/generate-cron-secret.js
 */

const crypto = require('crypto');

// Generate a 32-byte (256-bit) random secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 Generated CRON_SECRET:\n');
console.log(secret);
console.log('\n📋 Copy this value and add it to Vercel:');
console.log('   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
console.log('   2. Add new variable:');
console.log('      - Key: CRON_SECRET');
console.log(`      - Value: ${secret}`);
console.log('      - Environments: Select all (Production, Preview, Development)');
console.log('   3. Save and redeploy your project\n');


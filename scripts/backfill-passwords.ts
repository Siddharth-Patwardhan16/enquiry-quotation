/**
 * scripts/backfill-passwords.ts
 *
 * Safe admin utility to inspect employees and optionally set a temporary initial password
 * for existing accounts that do not have a passwordHash set yet.
 *
 * Usage:
 *   npx tsx scripts/backfill-passwords.ts --check
 *   npx tsx scripts/backfill-passwords.ts --set-default=<password>
 */

import { db } from '../src/server/db';
import { hashPassword } from '../src/server/auth/password';

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check') || args.length === 0;
  const setDefaultArg = args.find((a) => a.startsWith('--set-default='));
  const defaultPassword = setDefaultArg ? setDefaultArg.split('=')[1] : null;

  console.log('🔍 Fetching all employees from database...');
  const employees = await db.employee.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  console.log(`Found ${employees.length} employees:`);
  for (const emp of employees) {
    const hasPassword = emp.passwordHash !== null;
    console.log(` - [${emp.role}] ${emp.name} (${emp.email}): ${hasPassword ? '✅ Password Set' : '⚠️ No Password Set'}`);
  }

  if (defaultPassword) {
    console.log(`\n🔑 Setting initial password for employees with no password set...`);
    const hash = await hashPassword(defaultPassword);

    let updatedCount = 0;
    for (const emp of employees) {
      if (!emp.passwordHash) {
        await db.employee.update({
          where: { id: emp.id },
          data: { passwordHash: hash },
        });
        console.log(` ✅ Updated password for ${emp.email}`);
        updatedCount++;
      }
    }
    console.log(`\nDone! Updated ${updatedCount} employees with initial password.`);
  } else if (checkOnly) {
    console.log('\n(Run with --set-default=<password> if you wish to batch-set a known initial password for all unset accounts)');
  }
}

main()
  .catch((e) => {
    console.error('Error running backfill-passwords:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

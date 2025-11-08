import { prisma } from '../src/server/db';
import { randomUUID } from 'crypto';

/**
 * Migrates all employee IDs from custom format to UUID format
 * Updates all foreign key references in related tables
 */
async function migrateEmployeeIdsToUUID() {
  console.log('🔄 Starting Employee ID Migration to UUID Format\n');
  console.log('='.repeat(80));

  try {
    // Get all employees
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (employees.length === 0) {
      console.log('ℹ️  No employees found in database.');
      return;
    }

    console.log(`📋 Found ${employees.length} employee(s) to migrate:\n`);
    employees.forEach((emp, idx) => {
      console.log(`   ${idx + 1}. ${emp.name} (${emp.email}) - Current ID: ${emp.id}`);
    });
    console.log('');

    // Check UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const employeesNeedingMigration = employees.filter(emp => !uuidRegex.test(emp.id));

    if (employeesNeedingMigration.length === 0) {
      console.log('✅ All employee IDs are already in UUID format. No migration needed.');
      return;
    }

    console.log(`⚠️  ${employeesNeedingMigration.length} employee(s) need migration.\n`);

    // Create mapping of old ID to new UUID
    const idMapping = new Map<string, string>();
    employeesNeedingMigration.forEach(emp => {
      idMapping.set(emp.id, randomUUID());
    });

    console.log('📝 ID Mapping (Old -> New):\n');
    idMapping.forEach((newId, oldId) => {
      const emp = employeesNeedingMigration.find(e => e.id === oldId);
      console.log(`   ${emp?.name || oldId}: ${oldId} -> ${newId}`);
    });
    console.log('');

    // Start transaction to update all references
    console.log('🔄 Starting database transaction...\n');

    // Process each employee separately to avoid transaction timeouts
    for (const [oldId, newId] of idMapping) {
      const employee = employeesNeedingMigration.find(e => e.id === oldId);
      if (!employee) continue;

      console.log(`\n🔄 Processing ${employee.name}...`);
      
      await prisma.$transaction(async (tx) => {
        // Step 1: Get employee data
        const emp = await tx.employee.findUnique({
          where: { id: oldId },
        });

        if (!emp) {
          console.log(`   ⚠️  Employee ${oldId} not found, skipping`);
          return;
        }

        // Step 2: Create new employee with UUID and temporary email
        console.log(`   1. Creating new employee with UUID...`);
        await tx.employee.create({
          data: {
            id: newId,
            name: emp.name,
            email: `${emp.email}.temp.${Date.now()}`,
            role: emp.role,
            createdAt: emp.createdAt,
            updatedAt: emp.updatedAt,
          },
        });

        // Step 3: Update all foreign key references
        console.log(`   2. Updating foreign key references...`);
        await tx.customer.updateMany({
          where: { createdById: oldId },
          data: { createdById: newId },
        });
        await tx.company.updateMany({
          where: { createdById: oldId },
          data: { createdById: newId },
        });
        await tx.enquiry.updateMany({
          where: { marketingPersonId: oldId },
          data: { marketingPersonId: newId },
        });
        await tx.enquiry.updateMany({
          where: { attendedById: oldId },
          data: { attendedById: newId },
        });
        await tx.quotation.updateMany({
          where: { createdById: oldId },
          data: { createdById: newId },
        });
        await tx.communication.updateMany({
          where: { employeeId: oldId },
          data: { employeeId: newId },
        });

        // Step 4: Delete old employee first (to free up the email)
        console.log(`   3. Deleting old employee record...`);
        await tx.employee.delete({
          where: { id: oldId },
        });

        // Step 5: Update email to original (now that old employee is deleted)
        console.log(`   4. Updating email to original...`);
        await tx.employee.update({
          where: { id: newId },
          data: { email: emp.email },
        });

        console.log(`   ✅ Successfully migrated ${emp.name}`);
      }, {
        timeout: 30000, // 30 second timeout
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Migration completed successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');
    const allEmployees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const allValidUUIDs = allEmployees.every(emp => uuidRegex.test(emp.id));
    if (allValidUUIDs) {
      console.log('✅ All employee IDs are now in UUID format.');
    } else {
      console.log('⚠️  Some employee IDs are still not in UUID format.');
      allEmployees.forEach(emp => {
        if (!uuidRegex.test(emp.id)) {
          console.log(`   ❌ ${emp.name}: ${emp.id}`);
        }
      });
    }

    console.log(`\n📊 Final employee count: ${allEmployees.length}`);
    allEmployees.forEach((emp, idx) => {
      console.log(`   ${idx + 1}. ${emp.name} - ${emp.id}`);
    });

  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateEmployeeIdsToUUID().catch(console.error);


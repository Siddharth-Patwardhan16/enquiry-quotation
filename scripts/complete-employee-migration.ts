import { prisma } from '../src/server/db';

async function completeMigration() {
  console.log('🔍 Checking for duplicate employees...\n');

  // Find employees with temporary emails
  const allEmployees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  // Group by name to find duplicates
  const employeesByName = new Map<string, typeof allEmployees>();
  allEmployees.forEach(emp => {
    if (!employeesByName.has(emp.name)) {
      employeesByName.set(emp.name, []);
    }
    employeesByName.get(emp.name)!.push(emp);
  });

  console.log('Found employee groups:');
  employeesByName.forEach((emps, name) => {
    console.log(`\n${name}:`);
    emps.forEach(emp => {
      const isUUID = uuidRegex.test(emp.id);
      const isTemp = emp.email.includes('.temp.');
      console.log(`  - ${emp.id} (${emp.email}) ${isUUID ? '✅ UUID' : '❌ Not UUID'} ${isTemp ? '⚠️ TEMP' : ''}`);
    });
  });

  // Clean up: delete old non-UUID employees and update temp emails
  console.log('\n\n🧹 Cleaning up...\n');

  for (const [name, emps] of employeesByName) {
    const uuidEmps = emps.filter(e => uuidRegex.test(e.id));
    const nonUuidEmps = emps.filter(e => !uuidRegex.test(e.id));
    const tempEmps = emps.filter(e => e.email.includes('.temp.'));

    if (uuidEmps.length > 0 && nonUuidEmps.length > 0) {
      // We have both UUID and non-UUID - need to clean up
      const uuidEmp = uuidEmps[0]!;
      const nonUuidEmp = nonUuidEmps[0]!;

      if (tempEmps.length > 0) {
        // Update temp email to original
        const tempEmp = tempEmps[0]!;
        console.log(`Updating ${name}: fixing temp email for ${tempEmp.id}`);
        await prisma.employee.update({
          where: { id: tempEmp.id },
          data: { email: nonUuidEmp.email },
        });
      }

      // Delete old non-UUID employee
      console.log(`Deleting old employee ${name}: ${nonUuidEmp.id}`);
      await prisma.employee.delete({
        where: { id: nonUuidEmp.id },
      });
    } else if (tempEmps.length > 0 && nonUuidEmps.length > 0) {
      // We have temp UUID employee and old non-UUID - update email and delete old
      const tempEmp = tempEmps[0]!;
      const oldEmp = nonUuidEmps[0]!;
      
      console.log(`Updating ${name}: fixing temp email for ${tempEmp.id}`);
      await prisma.employee.update({
        where: { id: tempEmp.id },
        data: { email: oldEmp.email },
      });

      console.log(`Deleting old employee ${name}: ${oldEmp.id}`);
      await prisma.employee.delete({
        where: { id: oldEmp.id },
      });
    }
  }

  console.log('\n✅ Cleanup completed!\n');

  // Verify final state
  const finalEmployees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log('Final employees:');
  finalEmployees.forEach(e => {
    const isUUID = uuidRegex.test(e.id);
    console.log(`  ${e.name}: ${e.id} ${isUUID ? '✅' : '❌'}`);
  });

  await prisma.$disconnect();
}

completeMigration().catch(console.error);



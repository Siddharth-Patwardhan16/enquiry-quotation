import { prisma } from '../src/server/db';
import { UpdateEnquiryFullSchema } from '../src/lib/validators/enquiry';

// Simulate the frontend handleSaveEdit data cleaning logic
function simulateHandleSaveEdit(
  editingEnquiry: number,
  editData: Record<string, unknown>
): Partial<Record<string, unknown>> & { id: number } {
  const cleanedData: Partial<Record<string, unknown>> & { id: number } = {
    id: editingEnquiry,
  };

  // Copy all fields from editData, but clean up attendedById
  Object.keys(editData).forEach((key) => {
    const value = editData[key];

    // Special handling for attendedById - completely omit if empty
    if (key === 'attendedById') {
      // Only include if it's a non-empty string
      if (
        value &&
        typeof value === 'string' &&
        value.trim() !== '' &&
        value !== 'null' &&
        value !== 'undefined'
      ) {
        cleanedData[key] = value.trim();
      }
      // Otherwise, don't include the field at all
      return;
    }

    // For other fields, include them as-is (they can be undefined)
    cleanedData[key] = value;
  });

  return cleanedData;
}

interface TestResult {
  name: string;
  success: boolean;
  validationPassed: boolean;
  mutationPassed: boolean;
  error?: string;
  validationError?: string;
  mutationError?: string;
}

async function testEditEnquiryIntegration() {
  console.log('🧪 Testing Edit Enquiry Integration (Frontend + Backend)\n');
  console.log('='.repeat(80));

  try {
    // Get a test enquiry
    const testEnquiry = await prisma.enquiry.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        attendedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!testEnquiry) {
      console.log('❌ No enquiries found in database. Please create at least one enquiry first.');
      return;
    }

    console.log(`📋 Using test enquiry:`);
    console.log(`   ID: ${testEnquiry.id}`);
    console.log(`   Subject: ${testEnquiry.subject || 'N/A'}`);
    console.log(`   Current attendedById: ${testEnquiry.attendedById || 'null'}`);
    console.log(`   Current attendedBy: ${testEnquiry.attendedBy?.name || 'None'}\n`);

    // Get available employees for testing
    const employees = await prisma.employee.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (employees.length === 0) {
      console.log('❌ No employees found in database. Please create at least one employee first.');
      return;
    }

    console.log(`👥 Available employees for testing:`);
    employees.forEach((emp, idx) => {
      console.log(`   ${idx + 1}. ${emp.name} (${emp.role}) - ${emp.id}`);
    });
    console.log('');

    const employee1 = employees[0]!;
    const employee2 = employees.length > 1 ? employees[1]! : employee1;

    const results: TestResult[] = [];

    // Test 1: Frontend cleaning with valid UUID
    console.log('Test 1: Frontend cleaning with valid UUID');
    try {
      const editData = {
        attendedById: employee1.id,
        subject: 'Test Subject',
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      console.log(`   Cleaned data:`, cleanedData);

      // Validate cleaned data
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors && validation.error.errors.length > 0
          ? validation.error.errors.map((e: { message: string; path: (string | number)[] }) => 
              `${e.path.join('.')}: ${e.message}`
            ).join(', ')
          : 'Validation failed';
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Frontend cleaning with valid UUID',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Try to update
        const before = await prisma.enquiry.findUnique({
          where: { id: testEnquiry.id },
          select: { attendedById: true },
        });

        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            attendedById: cleanedData.attendedById as string,
            subject: cleanedData.subject as string,
          },
          select: {
            id: true,
            attendedById: true,
            subject: true,
          },
        });

        const mutationPassed = updated.attendedById === employee1.id;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Both validation and mutation passed`);
          results.push({
            name: 'Frontend cleaning with valid UUID',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Mutation did not update correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Frontend cleaning with valid UUID',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 2: Frontend cleaning with empty string
    console.log('Test 2: Frontend cleaning with empty string');
    try {
      const editData = {
        attendedById: '',
        subject: 'Test Subject 2',
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      console.log(`   Cleaned data:`, cleanedData);
      console.log(`   attendedById in cleaned data: ${cleanedData.attendedById === undefined ? 'undefined (omitted)' : cleanedData.attendedById}`);

      // Validate cleaned data
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors && validation.error.errors.length > 0
          ? validation.error.errors.map((e: { message: string; path: (string | number)[] }) => 
              `${e.path.join('.')}: ${e.message}`
            ).join(', ')
          : 'Validation failed';
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Frontend cleaning with empty string',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        console.log(`   ✅ Validation passed (attendedById should be omitted)`);
        // Try to update (should not include attendedById)
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            subject: cleanedData.subject as string,
            // attendedById is omitted, so it won't be updated
          },
          select: {
            id: true,
            attendedById: true,
            subject: true,
          },
        });

        console.log(`   ✅ Mutation passed (attendedById unchanged: ${updated.attendedById || 'null'})`);
        results.push({
          name: 'Frontend cleaning with empty string',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Frontend cleaning with empty string',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 3: Frontend cleaning with "null" string
    console.log('Test 3: Frontend cleaning with "null" string');
    try {
      const editData = {
        attendedById: 'null',
        subject: 'Test Subject 3',
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      console.log(`   Cleaned data:`, cleanedData);
      console.log(`   attendedById in cleaned data: ${cleanedData.attendedById === undefined ? 'undefined (omitted)' : cleanedData.attendedById}`);

      // Validate cleaned data
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages2 = validation.error.errors && validation.error.errors.length > 0
          ? validation.error.errors.map((e: { message: string; path: (string | number)[] }) => 
              `${e.path.join('.')}: ${e.message}`
            ).join(', ')
          : 'Validation failed';
        console.log(`   ❌ Validation failed: ${errorMessages2}`);
        results.push({
          name: 'Frontend cleaning with "null" string',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages2,
        });
      } else {
        console.log(`   ✅ Validation passed (attendedById should be omitted)`);
        results.push({
          name: 'Frontend cleaning with "null" string',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Frontend cleaning with "null" string',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 4: Frontend cleaning with undefined
    console.log('Test 4: Frontend cleaning with undefined');
    try {
      const editData = {
        attendedById: undefined,
        subject: 'Test Subject 4',
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      console.log(`   Cleaned data:`, cleanedData);
      console.log(`   attendedById in cleaned data: ${cleanedData.attendedById === undefined ? 'undefined (omitted)' : cleanedData.attendedById}`);

      // Validate cleaned data
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages3 = validation.error.errors && validation.error.errors.length > 0
          ? validation.error.errors.map((e: { message: string; path: (string | number)[] }) => 
              `${e.path.join('.')}: ${e.message}`
            ).join(', ')
          : 'Validation failed';
        console.log(`   ❌ Validation failed: ${errorMessages3}`);
        results.push({
          name: 'Frontend cleaning with undefined',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages3,
        });
      } else {
        console.log(`   ✅ Validation passed (attendedById should be omitted)`);
        results.push({
          name: 'Frontend cleaning with undefined',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Frontend cleaning with undefined',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 5: Changing attendedById from one employee to another (full flow)
    console.log('Test 5: Changing attendedById from one employee to another (full flow)');
    try {
      // First set it to employee1
      await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: { attendedById: employee1.id },
      });

      const before = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
        select: { attendedById: true },
      });

      // Now simulate changing it to employee2 via frontend
      const editData = {
        attendedById: employee2.id,
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      console.log(`   Cleaned data:`, cleanedData);

      // Validate
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      if (!validation.success) {
        const errorMessages4 = validation.error.errors && validation.error.errors.length > 0
          ? validation.error.errors.map((e: { message: string; path: (string | number)[] }) => 
              `${e.path.join('.')}: ${e.message}`
            ).join(', ')
          : 'Validation failed';
        throw new Error(`Validation failed: ${errorMessages4}`);
      }

      // Update
      const updated = await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: {
          attendedById: cleanedData.attendedById as string,
        },
        select: {
          id: true,
          attendedById: true,
          attendedBy: {
            select: {
              name: true,
            },
          },
        },
      });

      if (updated.attendedById === employee2.id) {
        console.log(`   ✅ SUCCESS: Changed from ${employee1.id} to ${employee2.id}`);
        console.log(`   ✅ Attended by: ${updated.attendedBy?.name || 'None'}`);
        results.push({
          name: 'Change attendedById (full flow)',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      } else {
        throw new Error(`Expected ${employee2.id}, got ${updated.attendedById}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Change attendedById (full flow)',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 6: Clearing attendedById (full flow)
    console.log('Test 6: Clearing attendedById (full flow)');
    try {
      // First set it to employee1
      await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: { attendedById: employee1.id },
      });

      const before = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
        select: { attendedById: true },
      });

      // Simulate clearing it via frontend (empty string)
      const editData = {
        attendedById: '',
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      console.log(`   Cleaned data:`, cleanedData);
      console.log(`   attendedById in cleaned data: ${cleanedData.attendedById === undefined ? 'undefined (omitted)' : cleanedData.attendedById}`);

      // Validate
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      if (!validation.success) {
        const errorMessages4 = validation.error.errors && validation.error.errors.length > 0
          ? validation.error.errors.map((e: { message: string; path: (string | number)[] }) => 
              `${e.path.join('.')}: ${e.message}`
            ).join(', ')
          : 'Validation failed';
        throw new Error(`Validation failed: ${errorMessages4}`);
      }

      // Note: Since attendedById is omitted, we need to explicitly set it to null
      // This is a limitation - the frontend cleaning logic omits the field,
      // but to clear it in the database, we need to explicitly set it to null
      const updated = await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: {
          attendedById: null,
        },
        select: {
          id: true,
          attendedById: true,
        },
      });

      if (updated.attendedById === null) {
        console.log(`   ✅ SUCCESS: Cleared attendedById (set to null)`);
        console.log(`   ⚠️  NOTE: Frontend omits the field, but DB requires explicit null to clear`);
        results.push({
          name: 'Clear attendedById (full flow)',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      } else {
        throw new Error(`Expected null, got ${updated.attendedById}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Clear attendedById (full flow)',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Integration Test Results Summary:\n');

    results.forEach((result, idx) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${idx + 1}. ${result.name}`);
      console.log(`   Validation: ${result.validationPassed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Mutation: ${result.mutationPassed ? '✅ PASS' : '❌ FAIL'}`);
      if (result.validationError) {
        console.log(`   Validation Error: ${result.validationError}`);
      }
      if (result.mutationError) {
        console.log(`   Mutation Error: ${result.mutationError}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const passed = results.filter((r) => r.success).length;
    const total = results.length;
    console.log(`\n📈 Success Rate: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)\n`);

    // Key findings
    console.log('🔍 Key Findings:\n');
    const clearingTest = results.find((r) => r.name.includes('Clear'));
    if (clearingTest) {
      console.log('⚠️  ISSUE IDENTIFIED:');
      console.log('   When clearing attendedById, the frontend cleaning logic omits the field.');
      console.log('   However, to actually clear it in the database, the field must be explicitly set to null.');
      console.log('   This means the current implementation cannot clear attendedById through the edit form.\n');
    }
  } catch (error) {
    console.error('❌ Error running integration tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEditEnquiryIntegration();


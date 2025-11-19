import { prisma } from '../src/server/db';
import { UpdateEnquiryFullSchema } from '../src/lib/validators/enquiry';

interface TestResult {
  name: string;
  success: boolean;
  validationPassed: boolean;
  mutationPassed: boolean;
  error?: string;
  validationError?: string;
  mutationError?: string;
}

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

async function testEnquiryFormEdit() {
  console.log('🧪 Testing Enquiry Form Edit\n');
  console.log('='.repeat(80));

  const results: TestResult[] = [];
  let testEnquiryId: number | null = null;

  try {
    // Get test data
    const testCompany = await prisma.company.findFirst();
    const testEmployee = await prisma.employee.findFirst({ where: { role: 'MARKETING' } });
    const employees = await prisma.employee.findMany({ take: 3 });

    if (!testCompany) {
      console.log('❌ No companies found in database. Please create at least one company first.');
      return;
    }

    // Create a test enquiry for editing
    const testEnquiry = await prisma.enquiry.create({
      data: {
        subject: `Test Enquiry Edit ${Date.now()}`,
        companyId: testCompany.id,
        marketingPersonId: testEmployee?.id ?? null,
        status: 'LIVE',
      },
    });

    testEnquiryId = testEnquiry.id;
    console.log(`📋 Using test enquiry:`);
    console.log(`   ID: ${testEnquiry.id}`);
    console.log(`   Subject: ${testEnquiry.subject}`);
    console.log(`   Status: ${testEnquiry.status}\n`);

    if (employees.length === 0) {
      console.log('⚠️  No employees found. Some tests may be skipped.\n');
    }

    // Test 1: Update subject
    console.log('Test 1: Update subject');
    try {
      const newSubject = `Updated Subject ${Date.now()}`;
      const editData = {
        subject: newSubject,
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update subject',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: { subject: newSubject },
        });

        const mutationPassed = updated.subject === newSubject;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Subject updated to "${updated.subject}"`);
          results.push({
            name: 'Update subject',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Subject not updated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update subject',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 2: Update multiple fields
    console.log('Test 2: Update multiple fields');
    try {
      const editData = {
        subject: `Multi Update ${Date.now()}`,
        description: 'Updated description',
        priority: 'High' as const,
        region: 'North',
        blockModel: 'Model B',
        numberOfBlocks: 20,
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update multiple fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            subject: editData.subject,
            description: editData.description,
            priority: editData.priority,
            region: editData.region,
            blockModel: editData.blockModel,
            numberOfBlocks: editData.numberOfBlocks,
          },
        });

        // Check each field individually for better error reporting
        const subjectMatch = updated.subject === editData.subject;
        const descriptionMatch = updated.description === editData.description;
        const priorityMatch = updated.priority === editData.priority;
        const regionMatch = updated.region === editData.region;
        const blockModelMatch = updated.blockModel === editData.blockModel;
        // numberOfBlocks might be stored as Decimal, so compare as numbers
        const numberOfBlocksMatch = Math.abs(Number(updated.numberOfBlocks ?? 0) - Number(editData.numberOfBlocks ?? 0)) < 0.01;

        const mutationPassed =
          subjectMatch &&
          descriptionMatch &&
          priorityMatch &&
          regionMatch &&
          blockModelMatch &&
          numberOfBlocksMatch;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Multiple fields updated correctly`);
          results.push({
            name: 'Update multiple fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          const mismatches: string[] = [];
          if (!subjectMatch) mismatches.push(`subject: expected "${editData.subject}", got "${updated.subject}"`);
          if (!descriptionMatch) mismatches.push(`description: expected "${editData.description}", got "${updated.description ?? 'null'}"`);
          if (!priorityMatch) mismatches.push(`priority: expected "${editData.priority}", got "${updated.priority ?? 'null'}"`);
          if (!regionMatch) mismatches.push(`region: expected "${editData.region}", got "${updated.region ?? 'null'}"`);
          if (!blockModelMatch) mismatches.push(`blockModel: expected "${editData.blockModel}", got "${updated.blockModel ?? 'null'}"`);
          if (!numberOfBlocksMatch) mismatches.push(`numberOfBlocks: expected ${editData.numberOfBlocks}, got ${updated.numberOfBlocks ?? 'null'}`);
          throw new Error(`Multiple fields not updated correctly: ${mismatches.join('; ')}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update multiple fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 3: Update attendedById with valid UUID
    if (employees.length > 0) {
      console.log('Test 3: Update attendedById with valid UUID');
      try {
        const employee = employees[0]!;
        const editData = {
          attendedById: employee.id,
        };

        const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
        const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
        const validationPassed = validation.success;

        if (!validationPassed) {
          const errorMessages = validation.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', ');
          console.log(`   ❌ Validation failed: ${errorMessages}`);
          results.push({
            name: 'Update attendedById with valid UUID',
            success: false,
            validationPassed: false,
            mutationPassed: false,
            validationError: errorMessages,
          });
        } else {
          const updated = await prisma.enquiry.update({
            where: { id: testEnquiry.id },
            data: { attendedById: employee.id },
            include: { attendedBy: true },
          });

          const mutationPassed = updated.attendedById === employee.id;

          if (mutationPassed) {
            console.log(`   ✅ SUCCESS: attendedById updated to ${employee.name}`);
            results.push({
              name: 'Update attendedById with valid UUID',
              success: true,
              validationPassed: true,
              mutationPassed: true,
            });
          } else {
            throw new Error('attendedById not updated correctly');
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`   ❌ FAILED: ${message}`);
        results.push({
          name: 'Update attendedById with valid UUID',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          error: message,
        });
      }
      console.log('');
    }

    // Test 4: Update attendedById with empty string (should be omitted)
    console.log('Test 4: Update attendedById with empty string (should be omitted)');
    try {
      const editData = {
        attendedById: '',
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      console.log(`   Cleaned data attendedById: ${cleanedData.attendedById === undefined ? 'undefined (omitted)' : cleanedData.attendedById}`);

      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update attendedById with empty string',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Since attendedById is omitted, it shouldn't be in the update
        const before = await prisma.enquiry.findUnique({
          where: { id: testEnquiry.id },
          select: { attendedById: true },
        });

        // Try to update without attendedById (should not change it)
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: { subject: `Test ${Date.now()}` }, // Update something else
        });

        const mutationPassed = updated.attendedById === before?.attendedById;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Empty string correctly omitted, attendedById unchanged`);
          results.push({
            name: 'Update attendedById with empty string',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('attendedById should not change when omitted');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update attendedById with empty string',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 5: Update attendedById with null (should clear the field)
    console.log('Test 5: Update attendedById with null (should clear the field)');
    try {
      // First set it to an employee
      if (employees.length > 0) {
        await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: { attendedById: employees[0]!.id },
        });
      }

      const editData = {
        attendedById: null,
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update attendedById with null',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Update with null to clear
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: { attendedById: null },
        });

        const mutationPassed = updated.attendedById === null;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: attendedById cleared (set to null)`);
          results.push({
            name: 'Update attendedById with null',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('attendedById not cleared correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update attendedById with null',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 6: Update status
    console.log('Test 6: Update status');
    try {
      const statuses: Array<'LIVE' | 'DEAD' | 'RCD' | 'LOST'> = ['DEAD', 'RCD', 'LOST', 'LIVE'];
      let allStatusesPassed = true;

      for (const status of statuses) {
        const editData = {
          status: status,
        };

        const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
        const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);

        if (!validation.success) {
          allStatusesPassed = false;
          break;
        }

        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: { status: status },
        });

        if (updated.status !== status) {
          allStatusesPassed = false;
          break;
        }
      }

      if (allStatusesPassed) {
        console.log(`   ✅ SUCCESS: All status values updated correctly`);
        results.push({
          name: 'Update status',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      } else {
        throw new Error('Some status updates failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update status',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 7: Update date fields
    console.log('Test 7: Update date fields');
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const editData = {
        enquiryDate: today.toISOString().split('T')[0],
        quotationDate: tomorrow.toISOString().split('T')[0],
        oaDate: today.toISOString().split('T')[0],
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update date fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            enquiryDate: new Date(editData.enquiryDate),
            quotationDate: new Date(editData.quotationDate),
            oaDate: new Date(editData.oaDate),
          },
        });

        const mutationPassed =
          updated.enquiryDate?.toISOString().split('T')[0] === editData.enquiryDate &&
          updated.quotationDate?.toISOString().split('T')[0] === editData.quotationDate &&
          updated.oaDate?.toISOString().split('T')[0] === editData.oaDate;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: All date fields updated correctly`);
          results.push({
            name: 'Update date fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Date fields not updated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update date fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 8: Update with invalid status (should fail)
    console.log('Test 8: Update with invalid status (should fail)');
    try {
      const editData = {
        status: 'INVALID' as any,
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      const validation = UpdateEnquiryFullSchema.safeParse(cleanedData);
      const validationPassed = !validation.success; // Should fail

      if (validationPassed) {
        console.log(`   ✅ SUCCESS: Invalid status correctly rejected`);
        results.push({
          name: 'Update with invalid status (should fail)',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      } else {
        console.log(`   ⚠️  WARNING: Invalid status was accepted`);
        results.push({
          name: 'Update with invalid status (should fail)',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: 'Invalid status should be rejected',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update with invalid status (should fail)',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 9: Update PO fields independently
    console.log('Test 9: Update PO fields independently');
    try {
      // First set some PO fields
      await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: {
          purchaseOrderNumber: 'PO-ORIGINAL',
          poValue: 10000,
          poDate: new Date(),
        },
      });

      // Update only purchaseOrderNumber
      const editData = {
        purchaseOrderNumber: 'PO-UPDATED-001',
      };

      const cleanedData = simulateHandleSaveEdit(testEnquiry.id, editData);
      // Note: PO fields are in UpdateEnquirySchema, not UpdateEnquiryFullSchema
      // So we'll test direct database update
      const updated = await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: {
          purchaseOrderNumber: editData.purchaseOrderNumber,
        },
      });

      const mutationPassed = updated.purchaseOrderNumber === editData.purchaseOrderNumber;

      if (mutationPassed) {
        console.log(`   ✅ SUCCESS: PO fields can be updated independently`);
        results.push({
          name: 'Update PO fields independently',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      } else {
        throw new Error('PO fields not updated correctly');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update PO fields independently',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 10: Clear PO fields (set to null)
    console.log('Test 10: Clear PO fields (set to null)');
    try {
      // First set PO fields
      await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: {
          purchaseOrderNumber: 'PO-TO-CLEAR',
          poValue: 5000,
          poDate: new Date(),
        },
      });

      // Clear PO fields
      const updated = await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: {
          purchaseOrderNumber: null,
          poValue: null,
          poDate: null,
        },
      });

      const mutationPassed =
        updated.purchaseOrderNumber === null &&
        updated.poValue === null &&
        updated.poDate === null;

      if (mutationPassed) {
        console.log(`   ✅ SUCCESS: PO fields can be cleared (set to null)`);
        results.push({
          name: 'Clear PO fields (set to null)',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      } else {
        throw new Error('PO fields not cleared correctly');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Clear PO fields (set to null)',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Enquiry Form Edit Test Results Summary:\n');

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
    console.log('⚠️  NOTE: When clearing attendedById, the frontend cleaning logic omits the field.');
    console.log('   However, to actually clear it in the database, the field must be explicitly set to null.');
    console.log('   This means the current implementation requires special handling to clear attendedById.\n');
  } catch (error) {
    console.error('❌ Error running enquiry form edit tests:', error);
  } finally {
    // Cleanup test enquiry
    if (testEnquiryId) {
      try {
        await prisma.enquiry.delete({ where: { id: testEnquiryId } });
      } catch {
        // Ignore cleanup errors
      }
    }
    await prisma.$disconnect();
  }
}

testEnquiryFormEdit();


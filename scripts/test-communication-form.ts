import { prisma } from '../src/server/db';
import { z } from 'zod';

interface TestResult {
  name: string;
  success: boolean;
  validationPassed: boolean;
  mutationPassed: boolean;
  error?: string;
  validationError?: string;
  mutationError?: string;
}

// Communication schema matching the API
const CreateCommunicationSchema = z.object({
  date: z.string().optional(),
  companyId: z.string().optional(),
  subject: z.string().optional(),
  enquiryRelated: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']),
  nextCommunicationDate: z.string().optional(),
  proposedNextAction: z.string().optional(),
  contactId: z.string().optional(),
});

const UpdateCommunicationSchema = CreateCommunicationSchema.extend({
  id: z.string(),
});

// Simulate frontend data cleaning logic
function simulateFormSubmission(data: unknown) {
  return data;
}

async function testCommunicationForm() {
  console.log('🧪 Testing Communication Form (Create & Edit)\n');
  console.log('='.repeat(80));

  const results: TestResult[] = [];
  let testCommunicationId: string | null = null;

  try {
    // Get test data
    const testCompany = await prisma.company.findFirst();
    const testEnquiry = await prisma.enquiry.findFirst();
    const testEmployee = await prisma.employee.findFirst({ where: { role: 'MARKETING' } });
    const testContact = await prisma.contactPerson.findFirst();

    if (!testCompany) {
      console.log('❌ No companies found in database. Please create at least one company first.');
      return;
    }

    console.log(`📋 Using test data:`);
    console.log(`   Company: "${testCompany.name}" (ID: ${testCompany.id})`);
    if (testEnquiry) console.log(`   Enquiry: "${testEnquiry.subject}" (ID: ${testEnquiry.id})`);
    if (testEmployee) console.log(`   Employee: "${testEmployee.name}"`);
    if (testContact) console.log(`   Contact: "${testContact.name}"`);
    console.log('');

    // Test 1: Create minimal communication (only required type)
    console.log('Test 1: Create minimal communication (only required type)');
    try {
      const formData = {
        type: 'TELEPHONIC' as const,
        companyId: testCompany.id,
        subject: 'Test Communication',
        description: 'Test description',
      };

      const cleanedData = simulateFormSubmission(formData);
      const validation = CreateCommunicationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Create minimal communication',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const communication = await prisma.communication.create({
          data: {
            subject: formData.subject ?? '',
            description: formData.description ?? '',
            type: formData.type,
            companyId: formData.companyId ?? null,
            employeeId: testEmployee?.id ?? null,
          },
        });

        const mutationPassed =
          !!communication.id &&
          communication.type === formData.type &&
          communication.companyId === testCompany.id;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Communication created with ID ${communication.id}`);
          // Cleanup
          await prisma.communication.delete({ where: { id: communication.id } });
          results.push({
            name: 'Create minimal communication',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Communication creation failed');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Create minimal communication',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 2: Create communication with all fields
    console.log('Test 2: Create communication with all fields');
    try {
      const formData = {
        date: new Date().toISOString().split('T')[0],
        companyId: testCompany.id,
        subject: 'Complete Communication Test',
        enquiryRelated: testEnquiry?.id.toString(),
        description: 'Complete description',
        type: 'EMAIL' as const,
        nextCommunicationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        proposedNextAction: 'Follow up next week',
        contactId: testContact?.id,
      };

      const cleanedData = simulateFormSubmission(formData);
      const validation = CreateCommunicationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Create communication with all fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Use contactPersonId if testContact exists (it's a ContactPerson)
        const communication = await prisma.communication.create({
          data: {
            subject: formData.subject ?? '',
            description: formData.description ?? '',
            type: formData.type,
            companyId: formData.companyId ?? null,
            enquiryRelated: formData.enquiryRelated ?? null,
            nextCommunicationDate: formData.nextCommunicationDate
              ? new Date(formData.nextCommunicationDate)
              : null,
            proposedNextAction: formData.proposedNextAction ?? null,
            contactPersonId: testContact?.id ?? null,
            employeeId: testEmployee?.id ?? null,
          },
        });

        const mutationPassed =
          communication.subject === formData.subject &&
          communication.type === formData.type &&
          communication.enquiryRelated === formData.enquiryRelated &&
          communication.proposedNextAction === formData.proposedNextAction;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Complete communication created with all fields`);
          // Cleanup
          await prisma.communication.delete({ where: { id: communication.id } });
          results.push({
            name: 'Create communication with all fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Communication fields not saved correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Create communication with all fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 3: Create communication with different types
    console.log('Test 3: Create communication with different types');
    const types: Array<'TELEPHONIC' | 'VIRTUAL_MEETING' | 'EMAIL' | 'PLANT_VISIT' | 'OFFICE_VISIT'> = [
      'TELEPHONIC',
      'VIRTUAL_MEETING',
      'EMAIL',
      'PLANT_VISIT',
      'OFFICE_VISIT',
    ];
    let typeTestPassed = true;

    for (const type of types) {
      try {
        const formData = {
          type: type,
          companyId: testCompany.id,
          subject: `Test ${type}`,
          description: 'Test description',
        };

        const cleanedData = simulateFormSubmission(formData);
        const validation = CreateCommunicationSchema.safeParse(cleanedData);

        if (!validation.success) {
          typeTestPassed = false;
          break;
        }

        const communication = await prisma.communication.create({
          data: {
            subject: formData.subject,
            description: formData.description,
            type: type,
            companyId: testCompany.id,
            employeeId: testEmployee?.id ?? null,
          },
        });

        if (communication.type !== type) {
          typeTestPassed = false;
          break;
        }

        // Cleanup
        await prisma.communication.delete({ where: { id: communication.id } });
      } catch {
        typeTestPassed = false;
        break;
      }
    }

    if (typeTestPassed) {
      console.log(`   ✅ SUCCESS: All communication types accepted and saved correctly`);
      results.push({
        name: 'Create communication with different types',
        success: true,
        validationPassed: true,
        mutationPassed: true,
      });
    } else {
      console.log(`   ❌ FAILED: Some communication types not handled correctly`);
      results.push({
        name: 'Create communication with different types',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: 'Type validation or saving failed',
      });
    }
    console.log('');

    // Test 4: Create communication with invalid type (should fail)
    console.log('Test 4: Create communication with invalid type (should fail)');
    try {
      const formData = {
        type: 'INVALID_TYPE' as any,
        companyId: testCompany.id,
        subject: 'Test',
        description: 'Test',
      };

      const cleanedData = simulateFormSubmission(formData);
      const validation = CreateCommunicationSchema.safeParse(cleanedData);
      const validationPassed = !validation.success; // Should fail

      if (validationPassed) {
        console.log(`   ✅ SUCCESS: Invalid type correctly rejected`);
        results.push({
          name: 'Create communication with invalid type (should fail)',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      } else {
        console.log(`   ⚠️  WARNING: Invalid type was accepted`);
        results.push({
          name: 'Create communication with invalid type (should fail)',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: 'Invalid type should be rejected',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Create communication with invalid type (should fail)',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 5: Edit communication - update subject and description
    console.log('Test 5: Edit communication - update subject and description');
    try {
      // Create a test communication for editing
      const testCommunication = await prisma.communication.create({
        data: {
          subject: 'Original Subject',
          description: 'Original Description',
          type: 'TELEPHONIC',
          companyId: testCompany.id,
          employeeId: testEmployee?.id ?? null,
        },
      });

      testCommunicationId = testCommunication.id;

      const updateData = {
        id: testCommunication.id,
        type: 'TELEPHONIC' as const,
        companyId: testCompany.id,
        subject: 'Updated Subject',
        description: 'Updated Description',
      };

      const cleanedData = simulateFormSubmission(updateData);
      const validation = UpdateCommunicationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Edit communication - update subject and description',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.communication.update({
          where: { id: testCommunication.id },
          data: {
            subject: updateData.subject,
            description: updateData.description,
          },
        });

        const mutationPassed =
          updated.subject === updateData.subject &&
          updated.description === updateData.description;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Communication updated correctly`);
          results.push({
            name: 'Edit communication - update subject and description',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Communication not updated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Edit communication - update subject and description',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 6: Edit communication - update type
    console.log('Test 6: Edit communication - update type');
    try {
      if (!testCommunicationId) {
        throw new Error('Test communication not created');
      }

      const updateData = {
        id: testCommunicationId,
        type: 'EMAIL' as const,
        companyId: testCompany.id,
        subject: 'Test Subject',
        description: 'Test Description',
      };

      const cleanedData = simulateFormSubmission(updateData);
      const validation = UpdateCommunicationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Edit communication - update type',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.communication.update({
          where: { id: testCommunicationId },
          data: { type: updateData.type },
        });

        const mutationPassed = updated.type === updateData.type;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Communication type updated to ${updated.type}`);
          results.push({
            name: 'Edit communication - update type',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Communication type not updated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Edit communication - update type',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 7: Edit communication - update nextCommunicationDate
    console.log('Test 7: Edit communication - update nextCommunicationDate');
    try {
      if (!testCommunicationId) {
        throw new Error('Test communication not created');
      }

      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const updateData = {
        id: testCommunicationId,
        type: 'TELEPHONIC' as const,
        companyId: testCompany.id,
        subject: 'Test Subject',
        description: 'Test Description',
        nextCommunicationDate: futureDate,
      };

      const cleanedData = simulateFormSubmission(updateData);
      const validation = UpdateCommunicationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Edit communication - update nextCommunicationDate',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.communication.update({
          where: { id: testCommunicationId },
          data: {
            nextCommunicationDate: new Date(updateData.nextCommunicationDate),
          },
        });

        const mutationPassed =
          updated.nextCommunicationDate?.toISOString().split('T')[0] === futureDate;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Next communication date updated correctly`);
          results.push({
            name: 'Edit communication - update nextCommunicationDate',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Next communication date not updated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Edit communication - update nextCommunicationDate',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 8: Edit communication - clear nextCommunicationDate (set to null)
    console.log('Test 8: Edit communication - clear nextCommunicationDate');
    try {
      if (!testCommunicationId) {
        throw new Error('Test communication not created');
      }

      const updateData = {
        id: testCommunicationId,
        type: 'TELEPHONIC' as const,
        companyId: testCompany.id,
        subject: 'Test Subject',
        description: 'Test Description',
        nextCommunicationDate: undefined,
      };

      const cleanedData = simulateFormSubmission(updateData);
      const validation = UpdateCommunicationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Edit communication - clear nextCommunicationDate',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.communication.update({
          where: { id: testCommunicationId },
          data: { nextCommunicationDate: null },
        });

        const mutationPassed = updated.nextCommunicationDate === null;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Next communication date cleared (set to null)`);
          results.push({
            name: 'Edit communication - clear nextCommunicationDate',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Next communication date not cleared correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Edit communication - clear nextCommunicationDate',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Communication Form Test Results Summary:\n');

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
  } catch (error) {
    console.error('❌ Error running communication form tests:', error);
  } finally {
    // Cleanup test communication
    if (testCommunicationId) {
      try {
        await prisma.communication.delete({ where: { id: testCommunicationId } });
      } catch {
        // Ignore cleanup errors
      }
    }
    await prisma.$disconnect();
  }
}

testCommunicationForm();


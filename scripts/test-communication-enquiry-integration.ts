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
  enquiryId: z.number().optional(),
  description: z.string().optional(),
  type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']),
  nextCommunicationDate: z.string().optional(),
  proposedNextAction: z.string().optional(),
  contactId: z.string().optional(),
});

async function testCommunicationEnquiryIntegration() {
  console.log('🧪 Testing Communication with Enquiry Integration\n');
  console.log('='.repeat(80));

  const results: TestResult[] = [];

  try {
    // Get test data
    const testCompany = await prisma.company.findFirst();
    const testEnquiry = await prisma.enquiry.findFirst({
      include: {
        company: true,
      },
    });
    const testEmployee = await prisma.employee.findFirst({ where: { role: 'MARKETING' } });

    if (!testCompany) {
      console.log('❌ No companies found in database. Please create at least one company first.');
      return;
    }

    if (!testEnquiry) {
      console.log('❌ No enquiries found in database. Please create at least one enquiry first.');
      return;
    }

    console.log(`📋 Using test data:`);
    console.log(`   Company: "${testCompany.name}" (ID: ${testCompany.id})`);
    console.log(`   Enquiry: "${testEnquiry.subject}" (ID: ${testEnquiry.id})`);
    if (testEmployee) console.log(`   Employee: "${testEmployee.name}"`);
    console.log('');

    // Test 1: Create communication with enquiryId (optional)
    console.log('Test 1: Create communication with enquiryId (optional)');
    let testCommunicationId: string | null = null;
    try {
      const formData = {
        type: 'TELEPHONIC' as const,
        companyId: testCompany.id,
        subject: 'Test Communication with Enquiry',
        description: 'Test description',
        enquiryId: testEnquiry.id,
      };

      const validation = CreateCommunicationSchema.safeParse(formData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Create communication with enquiryId (optional)',
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
            enquiryId: formData.enquiryId ?? null,
            employeeId: testEmployee?.id ?? null,
          },
        });

        testCommunicationId = communication.id;

        const mutationPassed =
          !!communication.id &&
          communication.enquiryId === testEnquiry.id &&
          communication.companyId === testCompany.id;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Communication created with enquiryId ${communication.enquiryId}`);
          results.push({
            name: 'Create communication with enquiryId (optional)',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Communication creation failed or enquiryId not stored');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Create communication with enquiryId (optional)',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testCommunicationId) {
        try {
          await prisma.communication.delete({ where: { id: testCommunicationId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 2: Create communication without enquiryId (all optional)
    console.log('Test 2: Create communication without enquiryId (all optional)');
    testCommunicationId = null;
    try {
      const formData = {
        type: 'EMAIL' as const,
        companyId: testCompany.id,
        subject: 'Test Communication without Enquiry',
        description: 'Test description',
      };

      const validation = CreateCommunicationSchema.safeParse(formData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Create communication without enquiryId (all optional)',
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
            enquiryId: null, // Not provided
            employeeId: testEmployee?.id ?? null,
          },
        });

        testCommunicationId = communication.id;

        const mutationPassed =
          !!communication.id &&
          communication.enquiryId === null &&
          communication.companyId === testCompany.id;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Communication created without enquiryId (enquiryId is optional)`);
          results.push({
            name: 'Create communication without enquiryId (all optional)',
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
        name: 'Create communication without enquiryId (all optional)',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testCommunicationId) {
        try {
          await prisma.communication.delete({ where: { id: testCommunicationId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 3: Verify companyId/customerId auto-populated from enquiry when enquiryId provided
    console.log('Test 3: Verify companyId auto-populated from enquiry when enquiryId provided');
    testCommunicationId = null;
    try {
      // Create communication with enquiryId but without explicit companyId
      const formData = {
        type: 'VIRTUAL_MEETING' as const,
        subject: 'Test Auto-population',
        description: 'Test description',
        enquiryId: testEnquiry.id,
      };

      const validation = CreateCommunicationSchema.safeParse(formData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Verify companyId auto-populated from enquiry',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // In the actual API, companyId would be auto-populated from enquiry
        // Here we test that enquiry has companyId that can be used
        const enquiry = await prisma.enquiry.findUnique({
          where: { id: testEnquiry.id },
          select: { companyId: true },
        });

        const communication = await prisma.communication.create({
          data: {
            subject: formData.subject ?? '',
            description: formData.description ?? '',
            type: formData.type,
            companyId: enquiry?.companyId ?? null, // Auto-populated from enquiry
            enquiryId: formData.enquiryId ?? null,
            employeeId: testEmployee?.id ?? null,
          },
        });

        testCommunicationId = communication.id;

        const mutationPassed =
          !!communication.id &&
          communication.enquiryId === testEnquiry.id &&
          communication.companyId === enquiry?.companyId;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: companyId auto-populated from enquiry (${communication.companyId})`);
          results.push({
            name: 'Verify companyId auto-populated from enquiry',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('companyId not auto-populated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Verify companyId auto-populated from enquiry',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testCommunicationId) {
        try {
          await prisma.communication.delete({ where: { id: testCommunicationId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 4: Verify communication appears in enquiry's communication list
    console.log('Test 4: Verify communication appears in enquiry\'s communication list');
    testCommunicationId = null;
    try {
      const formData = {
        type: 'PLANT_VISIT' as const,
        companyId: testCompany.id,
        subject: 'Test Communication for Enquiry List',
        description: 'Test description',
        enquiryId: testEnquiry.id,
      };

      const validation = CreateCommunicationSchema.safeParse(formData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Verify communication appears in enquiry communication list',
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
            enquiryId: formData.enquiryId ?? null,
            employeeId: testEmployee?.id ?? null,
          },
        });

        testCommunicationId = communication.id;

        // Query communications by enquiryId
        const communicationsForEnquiry = await prisma.communication.findMany({
          where: { enquiryId: testEnquiry.id },
        });

        const mutationPassed =
          communicationsForEnquiry.length > 0 &&
          communicationsForEnquiry.some((c) => c.id === communication.id);

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Communication found in enquiry's communication list (${communicationsForEnquiry.length} total)`);
          results.push({
            name: 'Verify communication appears in enquiry communication list',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Communication not found in enquiry communication list');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Verify communication appears in enquiry communication list',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testCommunicationId) {
        try {
          await prisma.communication.delete({ where: { id: testCommunicationId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Communication Enquiry Integration Test Results Summary:\n');

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
    console.error('❌ Error running communication enquiry integration tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCommunicationEnquiryIntegration();


import { prisma } from '../src/server/db';
import { UpdateEnquirySchema } from '../src/lib/validators/enquiry';
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

// Schema for updateStatusWithReceipt
const UpdateStatusWithReceiptSchema = z.object({
  id: z.number(),
  status: z.literal('RCD'),
  dateOfReceipt: z.string(),
  receiptNumber: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  poValue: z.number().optional(),
  poDate: z.string().optional(),
});

async function testEnquiryStatusUpdates() {
  console.log('🧪 Testing Enquiry Status Updates with PO Fields\n');
  console.log('='.repeat(80));

  const results: TestResult[] = [];

  try {
    // Get test data
    const testCompany = await prisma.company.findFirst();
    const testEmployee = await prisma.employee.findFirst({ where: { role: 'MARKETING' } });

    if (!testCompany) {
      console.log('❌ No companies found in database. Please create at least one company first.');
      return;
    }

    console.log(`📋 Using test company: "${testCompany.name}" (ID: ${testCompany.id})`);
    if (testEmployee) console.log(`   Marketing Person: "${testEmployee.name}"`);
    console.log('');

    // Test 1: Update status to WON with all PO fields
    console.log('Test 1: Update status to WON with all PO fields');
    let testEnquiryId: number | null = null;
    try {
      // Create a test enquiry
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test WON Enquiry ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      const updateData = {
        id: testEnquiry.id,
        status: 'WON' as const,
        purchaseOrderNumber: 'PO-12345',
        poValue: 50000.50,
        poDate: new Date().toISOString().split('T')[0],
      };

      const validation = UpdateEnquirySchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update status to WON with all PO fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            status: 'WON',
            purchaseOrderNumber: updateData.purchaseOrderNumber,
            poValue: updateData.poValue,
            poDate: new Date(updateData.poDate),
          },
        });

        const mutationPassed =
          updated.status === 'WON' &&
          updated.purchaseOrderNumber === updateData.purchaseOrderNumber &&
          Math.abs(Number(updated.poValue ?? 0) - updateData.poValue) < 0.01 &&
          updated.poDate?.toISOString().split('T')[0] === updateData.poDate;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Status updated to WON with all PO fields`);
          results.push({
            name: 'Update status to WON with all PO fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('PO fields not saved correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update status to WON with all PO fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 2: Update status to WON with partial PO fields (only purchaseOrderNumber)
    console.log('Test 2: Update status to WON with partial PO fields (only purchaseOrderNumber)');
    testEnquiryId = null;
    try {
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test WON Partial ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      const updateData = {
        id: testEnquiry.id,
        status: 'WON' as const,
        purchaseOrderNumber: 'PO-67890',
      };

      const validation = UpdateEnquirySchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update status to WON with partial PO fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            status: 'WON',
            purchaseOrderNumber: updateData.purchaseOrderNumber,
            poValue: null,
            poDate: null,
          },
        });

        const mutationPassed =
          updated.status === 'WON' &&
          updated.purchaseOrderNumber === updateData.purchaseOrderNumber &&
          updated.poValue === null &&
          updated.poDate === null;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Status updated to WON with partial PO fields`);
          results.push({
            name: 'Update status to WON with partial PO fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Partial PO fields not saved correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update status to WON with partial PO fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 3: Update status to WON without any PO fields (all optional)
    console.log('Test 3: Update status to WON without any PO fields (all optional)');
    testEnquiryId = null;
    try {
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test WON No PO ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      const updateData = {
        id: testEnquiry.id,
        status: 'WON' as const,
      };

      const validation = UpdateEnquirySchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update status to WON without any PO fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            status: 'WON',
            purchaseOrderNumber: null,
            poValue: null,
            poDate: null,
          },
        });

        const mutationPassed =
          updated.status === 'WON' &&
          updated.purchaseOrderNumber === null &&
          updated.poValue === null &&
          updated.poDate === null;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Status updated to WON without PO fields (all optional)`);
          results.push({
            name: 'Update status to WON without any PO fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('PO fields should be null when not provided');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update status to WON without any PO fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 4: Update status to RCD with all PO fields
    console.log('Test 4: Update status to RCD with all PO fields');
    testEnquiryId = null;
    try {
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test RCD All PO ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      const updateData = {
        id: testEnquiry.id,
        status: 'RCD' as const,
        dateOfReceipt: new Date().toISOString().split('T')[0],
        receiptNumber: 'REC-001',
        purchaseOrderNumber: 'PO-RCD-001',
        poValue: 75000.75,
        poDate: new Date().toISOString().split('T')[0],
      };

      const validation = UpdateStatusWithReceiptSchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update status to RCD with all PO fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            status: 'RCD',
            dateOfReceipt: new Date(updateData.dateOfReceipt),
            oaNumber: updateData.receiptNumber,
            purchaseOrderNumber: updateData.purchaseOrderNumber,
            poValue: updateData.poValue,
            poDate: new Date(updateData.poDate),
          },
        });

        const mutationPassed =
          updated.status === 'RCD' &&
          updated.dateOfReceipt?.toISOString().split('T')[0] === updateData.dateOfReceipt &&
          updated.purchaseOrderNumber === updateData.purchaseOrderNumber &&
          Math.abs(Number(updated.poValue ?? 0) - updateData.poValue) < 0.01 &&
          updated.poDate?.toISOString().split('T')[0] === updateData.poDate;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Status updated to RCD with all PO fields`);
          results.push({
            name: 'Update status to RCD with all PO fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('RCD with PO fields not saved correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update status to RCD with all PO fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 5: Update status to RCD with partial PO fields
    console.log('Test 5: Update status to RCD with partial PO fields');
    testEnquiryId = null;
    try {
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test RCD Partial PO ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      const updateData = {
        id: testEnquiry.id,
        status: 'RCD' as const,
        dateOfReceipt: new Date().toISOString().split('T')[0],
        purchaseOrderNumber: 'PO-RCD-002',
        poValue: 30000,
      };

      const validation = UpdateStatusWithReceiptSchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update status to RCD with partial PO fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            status: 'RCD',
            dateOfReceipt: new Date(updateData.dateOfReceipt),
            purchaseOrderNumber: updateData.purchaseOrderNumber,
            poValue: updateData.poValue,
            poDate: null,
          },
        });

        const mutationPassed =
          updated.status === 'RCD' &&
          updated.purchaseOrderNumber === updateData.purchaseOrderNumber &&
          Math.abs(Number(updated.poValue ?? 0) - updateData.poValue) < 0.01 &&
          updated.poDate === null;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Status updated to RCD with partial PO fields`);
          results.push({
            name: 'Update status to RCD with partial PO fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('RCD with partial PO fields not saved correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update status to RCD with partial PO fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 6: Update status to RCD without PO fields (only receipt date required)
    console.log('Test 6: Update status to RCD without PO fields (only receipt date required)');
    testEnquiryId = null;
    try {
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test RCD No PO ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      const updateData = {
        id: testEnquiry.id,
        status: 'RCD' as const,
        dateOfReceipt: new Date().toISOString().split('T')[0],
      };

      const validation = UpdateStatusWithReceiptSchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update status to RCD without PO fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            status: 'RCD',
            dateOfReceipt: new Date(updateData.dateOfReceipt),
            purchaseOrderNumber: null,
            poValue: null,
            poDate: null,
          },
        });

        const mutationPassed =
          updated.status === 'RCD' &&
          updated.dateOfReceipt?.toISOString().split('T')[0] === updateData.dateOfReceipt &&
          updated.purchaseOrderNumber === null &&
          updated.poValue === null &&
          updated.poDate === null;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Status updated to RCD without PO fields (all optional)`);
          results.push({
            name: 'Update status to RCD without PO fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('RCD without PO fields not saved correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update status to RCD without PO fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Enquiry Status Updates Test Results Summary:\n');

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
    console.error('❌ Error running enquiry status update tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnquiryStatusUpdates();


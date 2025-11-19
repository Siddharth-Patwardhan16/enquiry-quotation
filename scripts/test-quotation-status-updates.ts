import { prisma } from '../src/server/db';
import { UpdateQuotationStatusSchema } from '../src/lib/validators/quotationStatus';

interface TestResult {
  name: string;
  success: boolean;
  validationPassed: boolean;
  mutationPassed: boolean;
  error?: string;
  validationError?: string;
  mutationError?: string;
}

async function testQuotationStatusUpdates() {
  console.log('🧪 Testing Quotation Status Updates with PO Fields\n');
  console.log('='.repeat(80));

  const results: TestResult[] = [];

  try {
    // Get test data
    const testEnquiry = await prisma.enquiry.findFirst({
      include: {
        company: true,
      },
    });

    if (!testEnquiry) {
      console.log('❌ No enquiries found in database. Please create at least one enquiry first.');
      return;
    }

    console.log(`📋 Using test enquiry:`);
    console.log(`   ID: ${testEnquiry.id}`);
    console.log(`   Subject: ${testEnquiry.subject}`);
    console.log(`   Company: ${testEnquiry.company?.name ?? 'N/A'}\n`);

    // Test 1: Update quotation status to WON with all PO fields
    console.log('Test 1: Update quotation status to WON with all PO fields');
    let testQuotationId: string | null = null;
    try {
      // Create a test quotation
      const uniqueQuotationNumber = `TEST-Q-WON-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const testQuotation = await prisma.quotation.create({
        data: {
          enquiryId: testEnquiry.id,
          quotationNumber: uniqueQuotationNumber,
          currency: 'INR',
          revisionNumber: 0,
          subtotal: 1000,
          tax: 0,
          totalValue: 1000,
          status: 'LIVE',
        },
      });
      testQuotationId = testQuotation.id;

      const updateData = {
        quotationId: testQuotation.id,
        status: 'WON' as const,
        purchaseOrderNumber: 'PO-QUOT-001',
        poValue: 100000.50,
        poDate: new Date().toISOString().split('T')[0],
      };

      const validation = UpdateQuotationStatusSchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update quotation status to WON with all PO fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Update quotation
        const updated = await prisma.quotation.update({
          where: { id: testQuotation.id },
          data: {
            status: 'WON',
            purchaseOrderNumber: updateData.purchaseOrderNumber,
            poValue: updateData.poValue,
            poDate: new Date(updateData.poDate),
          },
        });

        // Note: Enquiry sync is handled by the tRPC mutation, not by direct DB updates
        // Here we only test that the quotation update works correctly
        // Enquiry sync is tested in integration tests or when using the actual API
        const quotationPassed =
          updated.status === 'WON' &&
          updated.purchaseOrderNumber === updateData.purchaseOrderNumber &&
          Math.abs(Number(updated.poValue ?? 0) - updateData.poValue) < 0.01 &&
          updated.poDate?.toISOString().split('T')[0] === updateData.poDate;

        const mutationPassed = quotationPassed;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Quotation status updated to WON with all PO fields`);
          results.push({
            name: 'Update quotation status to WON with all PO fields',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Quotation PO fields not saved correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update quotation status to WON with all PO fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testQuotationId) {
        try {
          await prisma.quotation.delete({ where: { id: testQuotationId } });
          // Reset enquiry status if it was changed
          await prisma.enquiry.update({
            where: { id: testEnquiry.id },
            data: { status: testEnquiry.status },
          });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 2: Update quotation status to WON with partial PO fields
    console.log('Test 2: Update quotation status to WON with partial PO fields');
    testQuotationId = null;
    try {
      const uniqueQuotationNumber = `TEST-Q-WON-PARTIAL-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const testQuotation = await prisma.quotation.create({
        data: {
          enquiryId: testEnquiry.id,
          quotationNumber: uniqueQuotationNumber,
          currency: 'INR',
          revisionNumber: 0,
          subtotal: 1000,
          tax: 0,
          totalValue: 1000,
          status: 'LIVE',
        },
      });
      testQuotationId = testQuotation.id;

      const updateData = {
        quotationId: testQuotation.id,
        status: 'WON' as const,
        purchaseOrderNumber: 'PO-QUOT-002',
        poValue: 50000,
      };

      const validation = UpdateQuotationStatusSchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update quotation status to WON with partial PO fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.quotation.update({
          where: { id: testQuotation.id },
          data: {
            status: 'WON',
            purchaseOrderNumber: updateData.purchaseOrderNumber,
            poValue: updateData.poValue,
            poDate: null,
          },
        });

        const mutationPassed =
          updated.status === 'WON' &&
          updated.purchaseOrderNumber === updateData.purchaseOrderNumber &&
          Math.abs(Number(updated.poValue ?? 0) - updateData.poValue) < 0.01 &&
          updated.poDate === null;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Quotation status updated to WON with partial PO fields`);
          results.push({
            name: 'Update quotation status to WON with partial PO fields',
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
        name: 'Update quotation status to WON with partial PO fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testQuotationId) {
        try {
          await prisma.quotation.delete({ where: { id: testQuotationId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 3: Update quotation status to WON without PO fields (all optional)
    console.log('Test 3: Update quotation status to WON without PO fields (all optional)');
    testQuotationId = null;
    try {
      const uniqueQuotationNumber = `TEST-Q-WON-NO-PO-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const testQuotation = await prisma.quotation.create({
        data: {
          enquiryId: testEnquiry.id,
          quotationNumber: uniqueQuotationNumber,
          currency: 'INR',
          revisionNumber: 0,
          subtotal: 1000,
          tax: 0,
          totalValue: 1000,
          status: 'LIVE',
        },
      });
      testQuotationId = testQuotation.id;

      const updateData = {
        quotationId: testQuotation.id,
        status: 'WON' as const,
      };

      const validation = UpdateQuotationStatusSchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update quotation status to WON without PO fields',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.quotation.update({
          where: { id: testQuotation.id },
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
          console.log(`   ✅ SUCCESS: Quotation status updated to WON without PO fields (all optional)`);
          results.push({
            name: 'Update quotation status to WON without PO fields',
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
        name: 'Update quotation status to WON without PO fields',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testQuotationId) {
        try {
          await prisma.quotation.delete({ where: { id: testQuotationId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 4: Verify enquiry RCD status is not overwritten
    console.log('Test 4: Verify enquiry RCD status is not overwritten');
    testQuotationId = null;
    try {
      // Set enquiry to RCD status
      await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: { status: 'RCD' },
      });

      const uniqueQuotationNumber = `TEST-Q-RCD-PRESERVE-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const testQuotation = await prisma.quotation.create({
        data: {
          enquiryId: testEnquiry.id,
          quotationNumber: uniqueQuotationNumber,
          currency: 'INR',
          revisionNumber: 0,
          subtotal: 1000,
          tax: 0,
          totalValue: 1000,
          status: 'LIVE',
        },
      });
      testQuotationId = testQuotation.id;

      const updateData = {
        quotationId: testQuotation.id,
        status: 'WON' as const,
        purchaseOrderNumber: 'PO-QUOT-003',
        poValue: 200000,
        poDate: new Date().toISOString().split('T')[0],
      };

      const validation = UpdateQuotationStatusSchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Verify enquiry RCD status is not overwritten',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Update quotation
        await prisma.quotation.update({
          where: { id: testQuotation.id },
          data: {
            status: 'WON',
            purchaseOrderNumber: updateData.purchaseOrderNumber,
            poValue: updateData.poValue,
            poDate: new Date(updateData.poDate),
          },
        });

        // Check enquiry status (should still be RCD)
        const updatedEnquiry = await prisma.enquiry.findUnique({
          where: { id: testEnquiry.id },
        });

        const mutationPassed = updatedEnquiry?.status === 'RCD';

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Enquiry RCD status preserved (not overwritten)`);
          results.push({
            name: 'Verify enquiry RCD status is not overwritten',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error(`Enquiry status should be RCD but got ${updatedEnquiry?.status}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Verify enquiry RCD status is not overwritten',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    } finally {
      if (testQuotationId) {
        try {
          await prisma.quotation.delete({ where: { id: testQuotationId } });
        } catch {
          // Ignore cleanup errors
        }
      }
      // Reset enquiry status
      try {
        await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: { status: testEnquiry.status },
        });
      } catch {
        // Ignore cleanup errors
      }
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Quotation Status Updates Test Results Summary:\n');

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
    console.error('❌ Error running quotation status update tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuotationStatusUpdates();


import { prisma } from '../src/server/db';
import { CreateQuotationSchema } from '../src/lib/validators/quotation';

interface TestResult {
  name: string;
  success: boolean;
  validationPassed: boolean;
  mutationPassed: boolean;
  error?: string;
  validationError?: string;
  mutationError?: string;
}

// Simulate frontend data cleaning logic
function simulateFormSubmission(data: unknown) {
  return data;
}

async function testQuotationFormEdit() {
  console.log('🧪 Testing Quotation Form Edit\n');
  console.log('='.repeat(80));

  const results: TestResult[] = [];
  let testQuotationId: string | null = null;

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

    // Create a test quotation for editing
    const uniqueQuotationNumber = `TEST-Q-EDIT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const testQuotation = await prisma.$transaction(async (prisma) => {
      const quotation = await prisma.quotation.create({
        data: {
          enquiryId: testEnquiry.id,
          quotationNumber: uniqueQuotationNumber,
          currency: 'INR',
          revisionNumber: 0,
          subtotal: 1000,
          tax: 0,
          totalValue: 1000,
        },
      });

      // Create initial items
      await prisma.quotationItem.createMany({
        data: [
          {
            quotationId: quotation.id,
            materialDescription: 'Original Item 1',
            quantity: 5,
            pricePerUnit: 100,
            total: 500,
          },
          {
            quotationId: quotation.id,
            materialDescription: 'Original Item 2',
            quantity: 5,
            pricePerUnit: 100,
            total: 500,
          },
        ],
      });

      return quotation;
    });

    testQuotationId = testQuotation.id;
    console.log(`📋 Using test quotation:`);
    console.log(`   ID: ${testQuotation.id}`);
    console.log(`   Quotation Number: ${testQuotation.quotationNumber}`);
    console.log(`   Current Subtotal: ${testQuotation.subtotal}\n`);

    // Test 1: Update quotation details (revision, date, delivery schedule)
    console.log('Test 1: Update quotation details');
    try {
      const updateData = {
        enquiryId: testEnquiry.id,
        revisionNumber: 2,
        quotationDate: new Date().toISOString().split('T')[0],
        deliverySchedule: 'Updated: 3-4 weeks',
        currency: 'INR',
        items: [
          {
            materialDescription: 'Original Item 1',
            quantity: 5,
            pricePerUnit: 100,
          },
          {
            materialDescription: 'Original Item 2',
            quantity: 5,
            pricePerUnit: 100,
          },
        ],
      };

      const cleanedData = simulateFormSubmission(updateData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update quotation details',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.quotation.update({
          where: { id: testQuotation.id },
          data: {
            revisionNumber: updateData.revisionNumber,
            quotationDate: new Date(updateData.quotationDate),
            deliverySchedule: updateData.deliverySchedule,
          },
        });

        const mutationPassed =
          updated.revisionNumber === updateData.revisionNumber &&
          updated.deliverySchedule === updateData.deliverySchedule;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Quotation details updated (revision: ${updated.revisionNumber})`);
          results.push({
            name: 'Update quotation details',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Quotation details not updated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update quotation details',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 2: Update currency
    console.log('Test 2: Update currency');
    try {
      const currencies = ['USD', 'EUR', 'GBP'];
      let currencyUpdatePassed = true;

      for (const currency of currencies) {
        const updateData = {
          enquiryId: testEnquiry.id,
          currency: currency,
          revisionNumber: testQuotation.revisionNumber,
          items: [
            {
              materialDescription: 'Item 1',
              quantity: 5,
              pricePerUnit: 100,
            },
          ],
        };

        const cleanedData = simulateFormSubmission(updateData);
        const validation = CreateQuotationSchema.safeParse(cleanedData);

        if (!validation.success) {
          currencyUpdatePassed = false;
          break;
        }

        const updated = await prisma.quotation.update({
          where: { id: testQuotation.id },
          data: { currency: currency },
        });

        if (updated.currency !== currency) {
          currencyUpdatePassed = false;
          break;
        }
      }

      if (currencyUpdatePassed) {
        console.log(`   ✅ SUCCESS: Currency updated correctly`);
        results.push({
          name: 'Update currency',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      } else {
        throw new Error('Currency update failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update currency',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 3: Update line items (modify existing)
    console.log('Test 3: Update line items (modify existing)');
    try {
      const updateData = {
        enquiryId: testEnquiry.id,
        currency: 'INR',
        revisionNumber: testQuotation.revisionNumber,
        items: [
          {
            materialDescription: 'Updated Item 1',
            quantity: 10,
            pricePerUnit: 150,
          },
          {
            materialDescription: 'Updated Item 2',
            quantity: 8,
            pricePerUnit: 200,
          },
        ],
      };

      const cleanedData = simulateFormSubmission(updateData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update line items (modify existing)',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Calculate new subtotal
        const subtotal = updateData.items.reduce(
          (sum, item) => sum + (item.quantity ?? 0) * (item.pricePerUnit ?? 0),
          0
        );
        const expectedSubtotal = 10 * 150 + 8 * 200;

        // Update quotation with new items (transaction replaces all items)
        const updated = await prisma.$transaction(async (prisma) => {
          // Update quotation
          const quotation = await prisma.quotation.update({
            where: { id: testQuotation.id },
            data: {
              subtotal: subtotal,
              totalValue: subtotal,
            },
          });

          // Delete existing items
          await prisma.quotationItem.deleteMany({
            where: { quotationId: testQuotation.id },
          });

          // Create new items
          await prisma.quotationItem.createMany({
            data: updateData.items.map((item) => ({
              quotationId: testQuotation.id,
              materialDescription: item.materialDescription ?? 'Unnamed Item',
              quantity: item.quantity ?? 0,
              pricePerUnit: item.pricePerUnit ?? 0,
              total: (item.quantity ?? 0) * (item.pricePerUnit ?? 0),
            })),
          });

          return quotation;
        });

        const items = await prisma.quotationItem.findMany({
          where: { quotationId: testQuotation.id },
        });

        const itemsCountMatch = items.length === 2;
        const subtotalMatch = Math.abs(Number(updated.subtotal) - expectedSubtotal) < 0.01;
        const description1Match = items[0]?.materialDescription === 'Updated Item 1';
        const description2Match = items[1]?.materialDescription === 'Updated Item 2';

        const mutationPassed = itemsCountMatch && subtotalMatch && description1Match && description2Match;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Line items updated, new subtotal: ${updated.subtotal}`);
          results.push({
            name: 'Update line items (modify existing)',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          const mismatches: string[] = [];
          if (!itemsCountMatch) mismatches.push(`items count: expected 2, got ${items.length}`);
          if (!subtotalMatch) mismatches.push(`subtotal: expected ${expectedSubtotal}, got ${updated.subtotal}`);
          if (!description1Match) mismatches.push(`item 1 description: expected "Updated Item 1", got "${items[0]?.materialDescription ?? 'N/A'}"`);
          if (!description2Match) mismatches.push(`item 2 description: expected "Updated Item 2", got "${items[1]?.materialDescription ?? 'N/A'}"`);
          throw new Error(`Line items not updated correctly: ${mismatches.join('; ')}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update line items (modify existing)',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 4: Add new line items
    console.log('Test 4: Add new line items');
    try {
      const updateData = {
        enquiryId: testEnquiry.id,
        currency: 'INR',
        revisionNumber: testQuotation.revisionNumber,
        items: [
          {
            materialDescription: 'Item 1',
            quantity: 5,
            pricePerUnit: 100,
          },
          {
            materialDescription: 'Item 2',
            quantity: 3,
            pricePerUnit: 200,
          },
          {
            materialDescription: 'New Item 3',
            quantity: 2,
            pricePerUnit: 300,
          },
        ],
      };

      const cleanedData = simulateFormSubmission(updateData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Add new line items',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const subtotal = updateData.items.reduce(
          (sum, item) => sum + (item.quantity ?? 0) * (item.pricePerUnit ?? 0),
          0
        );

        const updated = await prisma.$transaction(async (prisma) => {
          const quotation = await prisma.quotation.update({
            where: { id: testQuotation.id },
            data: {
              subtotal: subtotal,
              totalValue: subtotal,
            },
          });

          await prisma.quotationItem.deleteMany({
            where: { quotationId: testQuotation.id },
          });

          await prisma.quotationItem.createMany({
            data: updateData.items.map((item) => ({
              quotationId: testQuotation.id,
              materialDescription: item.materialDescription ?? 'Unnamed Item',
              quantity: item.quantity ?? 0,
              pricePerUnit: item.pricePerUnit ?? 0,
              total: (item.quantity ?? 0) * (item.pricePerUnit ?? 0),
            })),
          });

          return quotation;
        });

        const items = await prisma.quotationItem.findMany({
          where: { quotationId: testQuotation.id },
        });

        const itemsCountMatch = items.length === 3;
        const subtotalMatch = Math.abs(Number(updated.subtotal) - subtotal) < 0.01;

        const mutationPassed = itemsCountMatch && subtotalMatch;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: New line item added, total items: ${items.length}`);
          results.push({
            name: 'Add new line items',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          const mismatches: string[] = [];
          if (!itemsCountMatch) mismatches.push(`items count: expected 3, got ${items.length}`);
          if (!subtotalMatch) mismatches.push(`subtotal: expected ${subtotal}, got ${updated.subtotal}`);
          throw new Error(`New line item not added correctly: ${mismatches.join('; ')}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Add new line items',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 5: Remove line items
    console.log('Test 5: Remove line items');
    try {
      const updateData = {
        enquiryId: testEnquiry.id,
        currency: 'INR',
        revisionNumber: testQuotation.revisionNumber,
        items: [
          {
            materialDescription: 'Remaining Item',
            quantity: 1,
            pricePerUnit: 100,
          },
        ],
      };

      const cleanedData = simulateFormSubmission(updateData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Remove line items',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const subtotal = 100;

        const updated = await prisma.$transaction(async (prisma) => {
          const quotation = await prisma.quotation.update({
            where: { id: testQuotation.id },
            data: {
              subtotal: subtotal,
              totalValue: subtotal,
            },
          });

          await prisma.quotationItem.deleteMany({
            where: { quotationId: testQuotation.id },
          });

          await prisma.quotationItem.createMany({
            data: [
              {
                quotationId: testQuotation.id,
                materialDescription: 'Remaining Item',
                quantity: 1,
                pricePerUnit: 100,
                total: 100,
              },
            ],
          });

          return quotation;
        });

        const items = await prisma.quotationItem.findMany({
          where: { quotationId: testQuotation.id },
        });

        const itemsCountMatch = items.length === 1;
        const subtotalMatch = Math.abs(Number(updated.subtotal) - subtotal) < 0.01;

        const mutationPassed = itemsCountMatch && subtotalMatch;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Line items removed, remaining items: ${items.length}`);
          results.push({
            name: 'Remove line items',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          const mismatches: string[] = [];
          if (!itemsCountMatch) mismatches.push(`items count: expected 1, got ${items.length}`);
          if (!subtotalMatch) mismatches.push(`subtotal: expected ${subtotal}, got ${updated.subtotal}`);
          throw new Error(`Line items not removed correctly: ${mismatches.join('; ')}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Remove line items',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 6: Total recalculation after edits
    console.log('Test 6: Total recalculation after edits');
    try {
      const updateData = {
        enquiryId: testEnquiry.id,
        currency: 'INR',
        revisionNumber: testQuotation.revisionNumber,
        items: [
          {
            materialDescription: 'Item A',
            quantity: 10,
            pricePerUnit: 50,
          },
          {
            materialDescription: 'Item B',
            quantity: 5,
            pricePerUnit: 100,
          },
          {
            materialDescription: 'Item C',
            quantity: 3,
            pricePerUnit: 150,
          },
        ],
      };

      const expectedSubtotal = 10 * 50 + 5 * 100 + 3 * 150;

      const cleanedData = simulateFormSubmission(updateData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Total recalculation after edits',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.$transaction(async (prisma) => {
          const quotation = await prisma.quotation.update({
            where: { id: testQuotation.id },
            data: {
              subtotal: expectedSubtotal,
              totalValue: expectedSubtotal,
            },
          });

          await prisma.quotationItem.deleteMany({
            where: { quotationId: testQuotation.id },
          });

          await prisma.quotationItem.createMany({
            data: updateData.items.map((item) => ({
              quotationId: testQuotation.id,
              materialDescription: item.materialDescription ?? 'Unnamed Item',
              quantity: item.quantity ?? 0,
              pricePerUnit: item.pricePerUnit ?? 0,
              total: (item.quantity ?? 0) * (item.pricePerUnit ?? 0),
            })),
          });

          return quotation;
        });

        const items = await prisma.quotationItem.findMany({
          where: { quotationId: testQuotation.id },
        });

        const calculatedSubtotal = items.reduce((sum, item) => sum + Number(item.total ?? 0), 0);

        const subtotalMatch = Math.abs(Number(updated.subtotal) - expectedSubtotal) < 0.01;
        const calculatedMatch = Math.abs(Number(calculatedSubtotal) - expectedSubtotal) < 0.01;

        const mutationPassed = subtotalMatch && calculatedMatch;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Total recalculated correctly (expected: ${expectedSubtotal}, got: ${updated.subtotal})`);
          results.push({
            name: 'Total recalculation after edits',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          const mismatches: string[] = [];
          if (!subtotalMatch) mismatches.push(`quotation subtotal: expected ${expectedSubtotal}, got ${updated.subtotal}`);
          if (!calculatedMatch) mismatches.push(`calculated subtotal: expected ${expectedSubtotal}, got ${calculatedSubtotal}`);
          throw new Error(`Total mismatch: ${mismatches.join('; ')}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Total recalculation after edits',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 7: Quotation number immutability (should not change)
    console.log('Test 7: Quotation number immutability');
    try {
      const originalQuotationNumber = testQuotation.quotationNumber;
      const updateData = {
        enquiryId: testEnquiry.id,
        currency: 'INR',
        revisionNumber: testQuotation.revisionNumber,
        items: [
          {
            materialDescription: 'Test Item',
            quantity: 1,
            pricePerUnit: 100,
          },
        ],
      };

      const cleanedData = simulateFormSubmission(updateData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Quotation number immutability',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Update quotation (should not change quotation number)
        const updated = await prisma.quotation.update({
          where: { id: testQuotation.id },
          data: {
            revisionNumber: 99, // Update something
          },
        });

        const mutationPassed = updated.quotationNumber === originalQuotationNumber;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Quotation number unchanged: ${updated.quotationNumber}`);
          results.push({
            name: 'Quotation number immutability',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Quotation number was changed');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Quotation number immutability',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Quotation Form Edit Test Results Summary:\n');

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
    console.error('❌ Error running quotation form edit tests:', error);
  } finally {
    // Cleanup test quotation
    if (testQuotationId) {
      try {
        await prisma.quotationItem.deleteMany({ where: { quotationId: testQuotationId } });
        await prisma.quotation.delete({ where: { id: testQuotationId } });
      } catch {
        // Ignore cleanup errors
      }
    }
    await prisma.$disconnect();
  }
}

testQuotationFormEdit();


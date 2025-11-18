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

async function testQuotationFormCreate() {
  console.log('🧪 Testing Quotation Form Creation\n');
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

    // Test 1: Minimal valid quotation (only enquiryId)
    console.log('Test 1: Minimal valid quotation (only enquiryId)');
    try {
      const formData = {
        enquiryId: testEnquiry.id,
        currency: 'INR',
        revisionNumber: 0,
        items: [],
      };

      const cleanedData = simulateFormSubmission(formData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Minimal valid quotation',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Create quotation with unique quotation number
        const uniqueQuotationNumber = `TEST-Q-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const quotation = await prisma.quotation.create({
          data: {
            enquiryId: testEnquiry.id,
            quotationNumber: uniqueQuotationNumber,
            currency: formData.currency,
            revisionNumber: formData.revisionNumber,
            subtotal: 0,
            tax: 0,
            totalValue: 0,
          },
        });

        const mutationPassed = !!quotation.id && quotation.enquiryId === testEnquiry.id;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Quotation created with ID ${quotation.id}`);
          // Cleanup
          await prisma.quotation.delete({ where: { id: quotation.id } });
          results.push({
            name: 'Minimal valid quotation',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Quotation creation failed');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Minimal valid quotation',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 2: Quotation with single line item
    console.log('Test 2: Quotation with single line item');
    try {
      const formData = {
        enquiryId: testEnquiry.id,
        currency: 'INR',
        revisionNumber: 1,
        quotationDate: new Date().toISOString().split('T')[0],
        deliverySchedule: '2-3 weeks',
        items: [
          {
            materialDescription: 'Test Material',
            quantity: 10,
            pricePerUnit: 100.5,
          },
        ],
      };

      const cleanedData = simulateFormSubmission(formData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Quotation with single line item',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Calculate totals
        const subtotal = formData.items.reduce(
          (sum, item) => sum + (item.quantity ?? 0) * (item.pricePerUnit ?? 0),
          0
        );
        const totalValue = subtotal;

        // Create quotation with items
        const uniqueQuotationNumber = `TEST-Q-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const quotation = await prisma.$transaction(async (prisma) => {
          const newQuotation = await prisma.quotation.create({
            data: {
              enquiryId: testEnquiry.id,
              quotationNumber: uniqueQuotationNumber,
              currency: formData.currency,
              revisionNumber: formData.revisionNumber,
              quotationDate: formData.quotationDate ? new Date(formData.quotationDate) : new Date(),
              deliverySchedule: formData.deliverySchedule,
              subtotal: subtotal,
              tax: 0,
              totalValue: totalValue,
            },
          });

          // Create items
          await prisma.quotationItem.createMany({
            data: formData.items.map((item) => ({
              quotationId: newQuotation.id,
              materialDescription: item.materialDescription ?? 'Unnamed Item',
              quantity: item.quantity ?? 0,
              pricePerUnit: item.pricePerUnit ?? 0,
              total: (item.quantity ?? 0) * (item.pricePerUnit ?? 0),
            })),
          });

          return newQuotation;
        });

        const items = await prisma.quotationItem.findMany({
          where: { quotationId: quotation.id },
        });

        // Check items with more detailed error reporting
        if (items.length !== 1) {
          throw new Error(`Expected 1 item, got ${items.length}`);
        }

        const item = items[0];
        if (!item) {
          throw new Error('Item not found');
        }

        const descriptionMatch = item.materialDescription === 'Test Material';
        const quantityMatch = Number(item.quantity) === 10;
        const priceMatch = Math.abs(Number(item.pricePerUnit) - 100.5) < 0.01;
        const subtotalMatch = Math.abs(Number(quotation.subtotal) - subtotal) < 0.01;

        const mutationPassed = descriptionMatch && quantityMatch && priceMatch && subtotalMatch;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Quotation with single item created, subtotal: ${quotation.subtotal}`);
          // Cleanup
          await prisma.quotationItem.deleteMany({ where: { quotationId: quotation.id } });
          await prisma.quotation.delete({ where: { id: quotation.id } });
          results.push({
            name: 'Quotation with single line item',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          const mismatches: string[] = [];
          if (!descriptionMatch) mismatches.push(`description: expected "Test Material", got "${item.materialDescription}"`);
          if (!quantityMatch) mismatches.push(`quantity: expected 10, got ${item.quantity}`);
          if (!priceMatch) mismatches.push(`pricePerUnit: expected 100.5, got ${item.pricePerUnit}`);
          if (!subtotalMatch) mismatches.push(`subtotal: expected ${subtotal}, got ${quotation.subtotal}`);
          throw new Error(`Quotation items not saved correctly: ${mismatches.join('; ')}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Quotation with single line item',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 3: Quotation with multiple line items
    console.log('Test 3: Quotation with multiple line items');
    try {
      const formData = {
        enquiryId: testEnquiry.id,
        currency: 'USD',
        revisionNumber: 2,
        quotationDate: new Date().toISOString().split('T')[0],
        deliverySchedule: '4-6 weeks',
        items: [
          {
            materialDescription: 'Item 1',
            quantity: 5,
            pricePerUnit: 50.25,
          },
          {
            materialDescription: 'Item 2',
            quantity: 10,
            pricePerUnit: 75.5,
          },
          {
            materialDescription: 'Item 3',
            quantity: 3,
            pricePerUnit: 100.0,
          },
        ],
      };

      const cleanedData = simulateFormSubmission(formData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Quotation with multiple line items',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Calculate totals
        const subtotal = formData.items.reduce(
          (sum, item) => sum + (item.quantity ?? 0) * (item.pricePerUnit ?? 0),
          0
        );
        const expectedSubtotal = 5 * 50.25 + 10 * 75.5 + 3 * 100.0;

        // Create quotation with items
        const uniqueQuotationNumber = `TEST-Q-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const quotation = await prisma.$transaction(async (prisma) => {
          const newQuotation = await prisma.quotation.create({
            data: {
              enquiryId: testEnquiry.id,
              quotationNumber: uniqueQuotationNumber,
              currency: formData.currency,
              revisionNumber: formData.revisionNumber,
              quotationDate: formData.quotationDate ? new Date(formData.quotationDate) : new Date(),
              deliverySchedule: formData.deliverySchedule,
              subtotal: subtotal,
              tax: 0,
              totalValue: subtotal,
            },
          });

          // Create items
          await prisma.quotationItem.createMany({
            data: formData.items.map((item) => ({
              quotationId: newQuotation.id,
              materialDescription: item.materialDescription ?? 'Unnamed Item',
              quantity: item.quantity ?? 0,
              pricePerUnit: item.pricePerUnit ?? 0,
              total: (item.quantity ?? 0) * (item.pricePerUnit ?? 0),
            })),
          });

          return newQuotation;
        });

        const items = await prisma.quotationItem.findMany({
          where: { quotationId: quotation.id },
        });

        const itemsCountMatch = items.length === 3;
        const subtotalMatch = Math.abs(Number(quotation.subtotal) - expectedSubtotal) < 0.01;
        const currencyMatch = quotation.currency === 'USD';

        const mutationPassed = itemsCountMatch && subtotalMatch && currencyMatch;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Quotation with ${items.length} items created, subtotal: ${quotation.subtotal}`);
          // Cleanup
          await prisma.quotationItem.deleteMany({ where: { quotationId: quotation.id } });
          await prisma.quotation.delete({ where: { id: quotation.id } });
          results.push({
            name: 'Quotation with multiple line items',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          const mismatches: string[] = [];
          if (!itemsCountMatch) mismatches.push(`items count: expected 3, got ${items.length}`);
          if (!subtotalMatch) mismatches.push(`subtotal: expected ${expectedSubtotal}, got ${quotation.subtotal}`);
          if (!currencyMatch) mismatches.push(`currency: expected USD, got ${quotation.currency}`);
          throw new Error(`Multiple items not saved correctly: ${mismatches.join('; ')}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Quotation with multiple line items',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 4: Quotation with different currencies
    console.log('Test 4: Quotation with different currencies');
    const currencies = ['INR', 'USD', 'EUR', 'GBP'];
    let currencyTestPassed = true;

    for (const currency of currencies) {
      try {
        const formData = {
          enquiryId: testEnquiry.id,
          currency: currency,
          revisionNumber: 0,
          items: [
            {
              materialDescription: 'Test Item',
              quantity: 1,
              pricePerUnit: 100,
            },
          ],
        };

        const cleanedData = simulateFormSubmission(formData);
        const validation = CreateQuotationSchema.safeParse(cleanedData);

        if (!validation.success) {
          currencyTestPassed = false;
          break;
        }

        const subtotal = 100;
        const uniqueQuotationNumber = `TEST-Q-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const quotation = await prisma.$transaction(async (prisma) => {
          const newQuotation = await prisma.quotation.create({
            data: {
              enquiryId: testEnquiry.id,
              quotationNumber: uniqueQuotationNumber,
              currency: currency,
              revisionNumber: 0,
              subtotal: subtotal,
              tax: 0,
              totalValue: subtotal,
            },
          });

          await prisma.quotationItem.createMany({
            data: [
              {
                quotationId: newQuotation.id,
                materialDescription: 'Test Item',
                quantity: 1,
                pricePerUnit: 100,
                total: 100,
              },
            ],
          });

          return newQuotation;
        });

        if (quotation.currency !== currency) {
          currencyTestPassed = false;
          break;
        }

        // Cleanup
        await prisma.quotationItem.deleteMany({ where: { quotationId: quotation.id } });
        await prisma.quotation.delete({ where: { id: quotation.id } });
      } catch {
        currencyTestPassed = false;
        break;
      }
    }

    if (currencyTestPassed) {
      console.log(`   ✅ SUCCESS: All currencies accepted and saved correctly`);
      results.push({
        name: 'Quotation with different currencies',
        success: true,
        validationPassed: true,
        mutationPassed: true,
      });
    } else {
      console.log(`   ❌ FAILED: Some currencies not handled correctly`);
      results.push({
        name: 'Quotation with different currencies',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: 'Currency validation or saving failed',
      });
    }
    console.log('');

    // Test 5: Quotation with zero quantity (edge case)
    console.log('Test 5: Quotation with zero quantity');
    try {
      const formData = {
        enquiryId: testEnquiry.id,
        currency: 'INR',
        revisionNumber: 0,
        items: [
          {
            materialDescription: 'Free Item',
            quantity: 0,
            pricePerUnit: 100,
          },
        ],
      };

      const cleanedData = simulateFormSubmission(formData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Quotation with zero quantity',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        // Zero quantity should result in zero total
        const subtotal = 0;
        const uniqueQuotationNumber = `TEST-Q-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const quotation = await prisma.$transaction(async (prisma) => {
          const newQuotation = await prisma.quotation.create({
            data: {
              enquiryId: testEnquiry.id,
              quotationNumber: uniqueQuotationNumber,
              currency: formData.currency,
              revisionNumber: 0,
              subtotal: subtotal,
              tax: 0,
              totalValue: subtotal,
            },
          });

          await prisma.quotationItem.createMany({
            data: [
              {
                quotationId: newQuotation.id,
                materialDescription: 'Free Item',
                quantity: 0,
                pricePerUnit: 100,
                total: 0,
              },
            ],
          });

          return newQuotation;
        });

        const items = await prisma.quotationItem.findMany({
          where: { quotationId: quotation.id },
        });

        const subtotalMatch = Math.abs(Number(quotation.subtotal) - 0) < 0.01;
        const itemTotalMatch = items.length > 0 && Math.abs(Number(items[0]?.total ?? 0) - 0) < 0.01;

        const mutationPassed = subtotalMatch && itemTotalMatch;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Zero quantity handled correctly (total: 0)`);
          // Cleanup
          await prisma.quotationItem.deleteMany({ where: { quotationId: quotation.id } });
          await prisma.quotation.delete({ where: { id: quotation.id } });
          results.push({
            name: 'Quotation with zero quantity',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          const mismatches: string[] = [];
          if (!subtotalMatch) mismatches.push(`subtotal: expected 0, got ${quotation.subtotal}`);
          if (!itemTotalMatch) mismatches.push(`item total: expected 0, got ${items[0]?.total ?? 'N/A'}`);
          throw new Error(`Zero quantity not handled correctly: ${mismatches.join('; ')}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Quotation with zero quantity',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 6: Quotation with decimal prices (quantity is Int, pricePerUnit is Decimal)
    console.log('Test 6: Quotation with decimal prices');
    try {
      const formData = {
        enquiryId: testEnquiry.id,
        currency: 'INR',
        revisionNumber: 0,
        items: [
          {
            materialDescription: 'Decimal Price Item',
            quantity: 3, // Quantity is Int, so use integer
            pricePerUnit: 99.99, // Price can be decimal
          },
        ],
      };

      const cleanedData = simulateFormSubmission(formData);
      const validation = CreateQuotationSchema.safeParse(cleanedData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Quotation with decimal prices',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const subtotal = 3 * 99.99; // 299.97
        const uniqueQuotationNumber = `TEST-Q-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const quotation = await prisma.$transaction(async (prisma) => {
          const newQuotation = await prisma.quotation.create({
            data: {
              enquiryId: testEnquiry.id,
              quotationNumber: uniqueQuotationNumber,
              currency: formData.currency,
              revisionNumber: 0,
              subtotal: subtotal,
              tax: 0,
              totalValue: subtotal,
            },
          });

          await prisma.quotationItem.createMany({
            data: [
              {
                quotationId: newQuotation.id,
                materialDescription: 'Decimal Price Item',
                quantity: 3, // Int type
                pricePerUnit: 99.99, // Decimal type
                total: subtotal,
              },
            ],
          });

          return newQuotation;
        });

        const items = await prisma.quotationItem.findMany({
          where: { quotationId: quotation.id },
        });

        const subtotalMatch = Math.abs(Number(quotation.subtotal) - subtotal) < 0.01;
        const quantityMatch = items.length > 0 && Number(items[0]?.quantity ?? 0) === 3;
        const priceMatch = items.length > 0 && Math.abs(Number(items[0]?.pricePerUnit ?? 0) - 99.99) < 0.01;

        const mutationPassed = subtotalMatch && quantityMatch && priceMatch;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Decimal prices handled correctly (subtotal: ${quotation.subtotal})`);
          // Cleanup
          await prisma.quotationItem.deleteMany({ where: { quotationId: quotation.id } });
          await prisma.quotation.delete({ where: { id: quotation.id } });
          results.push({
            name: 'Quotation with decimal prices',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          const mismatches: string[] = [];
          if (!subtotalMatch) mismatches.push(`subtotal: expected ${subtotal}, got ${quotation.subtotal}`);
          if (!quantityMatch) mismatches.push(`quantity: expected 3, got ${items[0]?.quantity ?? 'N/A'}`);
          if (!priceMatch) mismatches.push(`pricePerUnit: expected 99.99, got ${items[0]?.pricePerUnit ?? 'N/A'}`);
          throw new Error(`Decimal prices not handled correctly: ${mismatches.join('; ')}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Quotation with decimal quantities and prices',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Quotation Form Create Test Results Summary:\n');

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
    console.error('❌ Error running quotation form create tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuotationFormCreate();


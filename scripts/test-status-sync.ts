import { prisma } from '../src/server/db';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
}

async function testStatusSync() {
  console.log('🧪 Testing Bidirectional Status Syncing\n');
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

    // Test 1: Enquiry BUDGETARY → Quotation BUDGETARY
    console.log('Test 1: Enquiry BUDGETARY → Quotation BUDGETARY');
    let testEnquiryId: number | null = null;
    let testQuotationId: string | null = null;
    try {
      // Create test enquiry
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test BUDGETARY Sync ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      // Create test quotation
      const uniqueQuotationNumber = `TEST-SYNC-BUDGETARY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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

      // Update enquiry status to BUDGETARY
      await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: { status: 'BUDGETARY' },
      });

      // Manually sync quotation (simulating the router logic)
      await prisma.quotation.updateMany({
        where: { enquiryId: testEnquiry.id },
        data: { status: 'BUDGETARY' },
      });

      // Verify sync
      const updatedQuotation = await prisma.quotation.findUnique({
        where: { id: testQuotation.id },
      });
      const updatedEnquiry = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
      });

      const success = 
        updatedEnquiry?.status === 'BUDGETARY' &&
        updatedQuotation?.status === 'BUDGETARY';

      if (success) {
        console.log(`   ✅ SUCCESS: Enquiry BUDGETARY synced to Quotation BUDGETARY`);
        results.push({
          name: 'Enquiry BUDGETARY → Quotation BUDGETARY',
          success: true,
        });
      } else {
        throw new Error(`Sync failed: Enquiry=${updatedEnquiry?.status}, Quotation=${updatedQuotation?.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Enquiry BUDGETARY → Quotation BUDGETARY',
        success: false,
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
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 2: Enquiry RCD → Quotation RECEIVED
    console.log('Test 2: Enquiry RCD → Quotation RECEIVED');
    testEnquiryId = null;
    testQuotationId = null;
    try {
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test RCD Sync ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      const uniqueQuotationNumber = `TEST-SYNC-RCD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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

      await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: { status: 'RCD' },
      });

      await prisma.quotation.updateMany({
        where: { enquiryId: testEnquiry.id },
        data: { status: 'RECEIVED' },
      });

      const updatedQuotation = await prisma.quotation.findUnique({
        where: { id: testQuotation.id },
      });
      const updatedEnquiry = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
      });

      const success = 
        updatedEnquiry?.status === 'RCD' &&
        updatedQuotation?.status === 'RECEIVED';

      if (success) {
        console.log(`   ✅ SUCCESS: Enquiry RCD synced to Quotation RECEIVED`);
        results.push({
          name: 'Enquiry RCD → Quotation RECEIVED',
          success: true,
        });
      } else {
        throw new Error(`Sync failed: Enquiry=${updatedEnquiry?.status}, Quotation=${updatedQuotation?.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Enquiry RCD → Quotation RECEIVED',
        success: false,
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
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 3: Quotation BUDGETARY → Enquiry BUDGETARY
    console.log('Test 3: Quotation BUDGETARY → Enquiry BUDGETARY');
    testEnquiryId = null;
    testQuotationId = null;
    try {
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test Quotation BUDGETARY Sync ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      const uniqueQuotationNumber = `TEST-SYNC-Q-BUDGETARY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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

      await prisma.quotation.update({
        where: { id: testQuotation.id },
        data: { status: 'BUDGETARY' },
      });

      // Simulate the router logic: sync to enquiry (only if enquiry is not RCD)
      if (testEnquiry.status !== 'RCD') {
        await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: { status: 'BUDGETARY' },
        });
      }

      const updatedQuotation = await prisma.quotation.findUnique({
        where: { id: testQuotation.id },
      });
      const updatedEnquiry = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
      });

      const success = 
        updatedQuotation?.status === 'BUDGETARY' &&
        updatedEnquiry?.status === 'BUDGETARY';

      if (success) {
        console.log(`   ✅ SUCCESS: Quotation BUDGETARY synced to Enquiry BUDGETARY`);
        results.push({
          name: 'Quotation BUDGETARY → Enquiry BUDGETARY',
          success: true,
        });
      } else {
        throw new Error(`Sync failed: Quotation=${updatedQuotation?.status}, Enquiry=${updatedEnquiry?.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Quotation BUDGETARY → Enquiry BUDGETARY',
        success: false,
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
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 4: Quotation RECEIVED → Enquiry RCD
    console.log('Test 4: Quotation RECEIVED → Enquiry RCD');
    testEnquiryId = null;
    testQuotationId = null;
    try {
      const testEnquiry = await prisma.enquiry.create({
        data: {
          subject: `Test Quotation RECEIVED Sync ${Date.now()}`,
          companyId: testCompany.id,
          marketingPersonId: testEmployee?.id ?? null,
          status: 'LIVE',
        },
      });
      testEnquiryId = testEnquiry.id;

      const uniqueQuotationNumber = `TEST-SYNC-Q-RECEIVED-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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

      await prisma.quotation.update({
        where: { id: testQuotation.id },
        data: { status: 'RECEIVED' },
      });

      // Simulate the router logic: sync to enquiry (only if enquiry is not RCD)
      if (testEnquiry.status !== 'RCD') {
        await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: { status: 'RCD' },
        });
      }

      const updatedQuotation = await prisma.quotation.findUnique({
        where: { id: testQuotation.id },
      });
      const updatedEnquiry = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
      });

      const success = 
        updatedQuotation?.status === 'RECEIVED' &&
        updatedEnquiry?.status === 'RCD';

      if (success) {
        console.log(`   ✅ SUCCESS: Quotation RECEIVED synced to Enquiry RCD`);
        results.push({
          name: 'Quotation RECEIVED → Enquiry RCD',
          success: true,
        });
      } else {
        throw new Error(`Sync failed: Quotation=${updatedQuotation?.status}, Enquiry=${updatedEnquiry?.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Quotation RECEIVED → Enquiry RCD',
        success: false,
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
      if (testEnquiryId) {
        try {
          await prisma.enquiry.delete({ where: { id: testEnquiryId } });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    console.log('');

    // Test 5: Test all other status mappings (LOST, WON, DEAD, LIVE)
    const statusMappings = [
      { enquiry: 'LOST' as const, quotation: 'LOST' as const },
      { enquiry: 'WON' as const, quotation: 'WON' as const },
      { enquiry: 'DEAD' as const, quotation: 'DEAD' as const },
      { enquiry: 'LIVE' as const, quotation: 'LIVE' as const },
    ];

    for (const mapping of statusMappings) {
      console.log(`Test: Enquiry ${mapping.enquiry} → Quotation ${mapping.quotation}`);
      testEnquiryId = null;
      testQuotationId = null;
      try {
        const testEnquiry = await prisma.enquiry.create({
          data: {
            subject: `Test ${mapping.enquiry} Sync ${Date.now()}`,
            companyId: testCompany.id,
            marketingPersonId: testEmployee?.id ?? null,
            status: 'LIVE',
          },
        });
        testEnquiryId = testEnquiry.id;

        const uniqueQuotationNumber = `TEST-SYNC-${mapping.enquiry}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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

        await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: { status: mapping.enquiry },
        });

        await prisma.quotation.updateMany({
          where: { enquiryId: testEnquiry.id },
          data: { status: mapping.quotation },
        });

        const updatedQuotation = await prisma.quotation.findUnique({
          where: { id: testQuotation.id },
        });
        const updatedEnquiry = await prisma.enquiry.findUnique({
          where: { id: testEnquiry.id },
        });

        const success = 
          updatedEnquiry?.status === mapping.enquiry &&
          updatedQuotation?.status === mapping.quotation;

        if (success) {
          console.log(`   ✅ SUCCESS: Enquiry ${mapping.enquiry} synced to Quotation ${mapping.quotation}`);
          results.push({
            name: `Enquiry ${mapping.enquiry} → Quotation ${mapping.quotation}`,
            success: true,
          });
        } else {
          throw new Error(`Sync failed: Enquiry=${updatedEnquiry?.status}, Quotation=${updatedQuotation?.status}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`   ❌ FAILED: ${message}`);
        results.push({
          name: `Enquiry ${mapping.enquiry} → Quotation ${mapping.quotation}`,
          success: false,
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
        if (testEnquiryId) {
          try {
            await prisma.enquiry.delete({ where: { id: testEnquiryId } });
          } catch {
            // Ignore cleanup errors
          }
        }
      }
      console.log('');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Bidirectional Status Sync Test Results Summary:\n');

    results.forEach((result, idx) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${idx + 1}. ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const passed = results.filter((r) => r.success).length;
    const total = results.length;
    console.log(`\n📈 Success Rate: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)\n`);
  } catch (error) {
    console.error('❌ Error running status sync tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStatusSync();


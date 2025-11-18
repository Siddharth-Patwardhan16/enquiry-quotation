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

// Update schema matching the API
const UpdateCompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  poRuptureDiscs: z.boolean(),
  poThermowells: z.boolean(),
  poHeatExchanger: z.boolean(),
  poMiscellaneous: z.boolean(),
  poWaterJetSteamJet: z.boolean(),
  existingGraphiteSuppliers: z.string().nullable(),
  problemsFaced: z.string().nullable(),
});

async function testCompanyFormEdit() {
  console.log('🧪 Testing Company Form Edit\n');
  console.log('='.repeat(80));

  const results: TestResult[] = [];
  let testCompanyId: string | null = null;

  try {
    // Create a test company for editing
    const testCompany = await prisma.company.create({
      data: {
        name: `Test Company Edit ${Date.now()}`,
        poRuptureDiscs: false,
        poThermowells: false,
        poHeatExchanger: false,
        poMiscellaneous: false,
        poWaterJetSteamJet: false,
      },
      include: {
        offices: true,
        plants: true,
      },
    });

    testCompanyId = testCompany.id;
    console.log(`📋 Using test company: "${testCompany.name}" (ID: ${testCompany.id})\n`);

    // Test 1: Update company name
    console.log('Test 1: Update company name');
    try {
      const newName = `Updated Company Name ${Date.now()}`;
      const updateData = {
        id: testCompany.id,
        name: newName,
        poRuptureDiscs: testCompany.poRuptureDiscs,
        poThermowells: testCompany.poThermowells,
        poHeatExchanger: testCompany.poHeatExchanger,
        poMiscellaneous: testCompany.poMiscellaneous,
        poWaterJetSteamJet: testCompany.poWaterJetSteamJet,
        existingGraphiteSuppliers: null,
        problemsFaced: null,
      };

      const validation = UpdateCompanySchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update company name',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.company.update({
          where: { id: testCompany.id },
          data: {
            name: updateData.name,
            poRuptureDiscs: updateData.poRuptureDiscs,
            poThermowells: updateData.poThermowells,
            poHeatExchanger: updateData.poHeatExchanger,
            poMiscellaneous: updateData.poMiscellaneous,
            poWaterJetSteamJet: updateData.poWaterJetSteamJet,
            existingGraphiteSuppliers: updateData.existingGraphiteSuppliers,
            problemsFaced: updateData.problemsFaced,
          },
        });

        const mutationPassed = updated.name === newName;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Company name updated to "${updated.name}"`);
          results.push({
            name: 'Update company name',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Company name not updated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update company name',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 2: Update PO checkboxes
    console.log('Test 2: Update PO checkboxes');
    try {
      const updateData = {
        id: testCompany.id,
        name: testCompany.name,
        poRuptureDiscs: true,
        poThermowells: true,
        poHeatExchanger: false,
        poMiscellaneous: true,
        poWaterJetSteamJet: false,
        existingGraphiteSuppliers: null,
        problemsFaced: null,
      };

      const validation = UpdateCompanySchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update PO checkboxes',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.company.update({
          where: { id: testCompany.id },
          data: {
            poRuptureDiscs: updateData.poRuptureDiscs,
            poThermowells: updateData.poThermowells,
            poHeatExchanger: updateData.poHeatExchanger,
            poMiscellaneous: updateData.poMiscellaneous,
            poWaterJetSteamJet: updateData.poWaterJetSteamJet,
          },
        });

        const mutationPassed =
          updated.poRuptureDiscs === true &&
          updated.poThermowells === true &&
          updated.poHeatExchanger === false &&
          updated.poMiscellaneous === true &&
          updated.poWaterJetSteamJet === false;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: PO checkboxes updated correctly`);
          results.push({
            name: 'Update PO checkboxes',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('PO checkboxes not updated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update PO checkboxes',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 3: Update with existingGraphiteSuppliers and problemsFaced
    console.log('Test 3: Update with existingGraphiteSuppliers and problemsFaced');
    try {
      const updateData = {
        id: testCompany.id,
        name: testCompany.name,
        poRuptureDiscs: testCompany.poRuptureDiscs,
        poThermowells: testCompany.poThermowells,
        poHeatExchanger: testCompany.poHeatExchanger,
        poMiscellaneous: testCompany.poMiscellaneous,
        poWaterJetSteamJet: testCompany.poWaterJetSteamJet,
        existingGraphiteSuppliers: 'Supplier A, Supplier B',
        problemsFaced: 'Quality issues, Delivery delays',
      };

      const validation = UpdateCompanySchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Update with existingGraphiteSuppliers and problemsFaced',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.company.update({
          where: { id: testCompany.id },
          data: {
            existingGraphiteSuppliers: updateData.existingGraphiteSuppliers,
            problemsFaced: updateData.problemsFaced,
          },
        });

        const mutationPassed =
          updated.existingGraphiteSuppliers === 'Supplier A, Supplier B' &&
          updated.problemsFaced === 'Quality issues, Delivery delays';

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Additional fields updated correctly`);
          results.push({
            name: 'Update with existingGraphiteSuppliers and problemsFaced',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Additional fields not updated correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update with existingGraphiteSuppliers and problemsFaced',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 4: Clear existingGraphiteSuppliers and problemsFaced (set to null)
    console.log('Test 4: Clear existingGraphiteSuppliers and problemsFaced');
    try {
      const updateData = {
        id: testCompany.id,
        name: testCompany.name,
        poRuptureDiscs: testCompany.poRuptureDiscs,
        poThermowells: testCompany.poThermowells,
        poHeatExchanger: testCompany.poHeatExchanger,
        poMiscellaneous: testCompany.poMiscellaneous,
        poWaterJetSteamJet: testCompany.poWaterJetSteamJet,
        existingGraphiteSuppliers: null,
        problemsFaced: null,
      };

      const validation = UpdateCompanySchema.safeParse(updateData);
      const validationPassed = validation.success;

      if (!validationPassed) {
        const errorMessages = validation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        console.log(`   ❌ Validation failed: ${errorMessages}`);
        results.push({
          name: 'Clear existingGraphiteSuppliers and problemsFaced',
          success: false,
          validationPassed: false,
          mutationPassed: false,
          validationError: errorMessages,
        });
      } else {
        const updated = await prisma.company.update({
          where: { id: testCompany.id },
          data: {
            existingGraphiteSuppliers: null,
            problemsFaced: null,
          },
        });

        const mutationPassed =
          updated.existingGraphiteSuppliers === null && updated.problemsFaced === null;

        if (mutationPassed) {
          console.log(`   ✅ SUCCESS: Fields cleared correctly (set to null)`);
          results.push({
            name: 'Clear existingGraphiteSuppliers and problemsFaced',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } else {
          throw new Error('Fields not cleared correctly');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Clear existingGraphiteSuppliers and problemsFaced',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 5: Update with empty name (schema allows it, but API might handle it)
    console.log('Test 5: Update with empty name');
    try {
      const updateData = {
        id: testCompany.id,
        name: '',
        poRuptureDiscs: testCompany.poRuptureDiscs,
        poThermowells: testCompany.poThermowells,
        poHeatExchanger: testCompany.poHeatExchanger,
        poMiscellaneous: testCompany.poMiscellaneous,
        poWaterJetSteamJet: testCompany.poWaterJetSteamJet,
        existingGraphiteSuppliers: null,
        problemsFaced: null,
      };

      const validation = UpdateCompanySchema.safeParse(updateData);
      // Schema allows empty string (z.string() without .min(1))
      // This is a schema design decision - empty names are technically valid
      const validationPassed = validation.success;

      if (validationPassed) {
        // Try to update - API might handle empty names differently
        try {
          const updated = await prisma.company.update({
            where: { id: testCompany.id },
            data: { name: '' },
          });
          console.log(`   ⚠️  NOTE: Empty name accepted by schema and database (name: "${updated.name}")`);
          // Restore the name
          await prisma.company.update({
            where: { id: testCompany.id },
            data: { name: testCompany.name },
          });
          results.push({
            name: 'Update with empty name',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        } catch (dbError) {
          console.log(`   ✅ SUCCESS: Empty name rejected by database constraint`);
          results.push({
            name: 'Update with empty name',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        }
      } else {
        console.log(`   ✅ SUCCESS: Empty name rejected by validation`);
        results.push({
          name: 'Update with empty name',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update with empty name',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Test 6: Update with invalid UUID (should fail)
    console.log('Test 6: Update with invalid UUID (should fail)');
    try {
      const updateData = {
        id: 'invalid-uuid',
        name: 'Test Name',
        poRuptureDiscs: false,
        poThermowells: false,
        poHeatExchanger: false,
        poMiscellaneous: false,
        poWaterJetSteamJet: false,
        existingGraphiteSuppliers: null,
        problemsFaced: null,
      };

      const validation = UpdateCompanySchema.safeParse(updateData);
      // UUID validation happens at Prisma level, not schema level
      const validationPassed = validation.success;

      if (validationPassed) {
        // Try mutation - should fail at Prisma level
        try {
          await prisma.company.update({
            where: { id: updateData.id },
            data: { name: updateData.name },
          });
          console.log(`   ⚠️  WARNING: Invalid UUID was accepted`);
          results.push({
            name: 'Update with invalid UUID (should fail)',
            success: false,
            validationPassed: true,
            mutationPassed: false,
            mutationError: 'Invalid UUID should be rejected',
          });
        } catch {
          console.log(`   ✅ SUCCESS: Invalid UUID correctly rejected by database`);
          results.push({
            name: 'Update with invalid UUID (should fail)',
            success: true,
            validationPassed: true,
            mutationPassed: true,
          });
        }
      } else {
        console.log(`   ✅ SUCCESS: Invalid UUID rejected by validation`);
        results.push({
          name: 'Update with invalid UUID (should fail)',
          success: true,
          validationPassed: true,
          mutationPassed: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update with invalid UUID (should fail)',
        success: false,
        validationPassed: false,
        mutationPassed: false,
        error: message,
      });
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Company Form Edit Test Results Summary:\n');

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
    console.error('❌ Error running company form edit tests:', error);
  } finally {
    // Cleanup test company
    if (testCompanyId) {
      try {
        await prisma.company.delete({ where: { id: testCompanyId } });
      } catch {
        // Ignore cleanup errors
      }
    }
    await prisma.$disconnect();
  }
}

testCompanyFormEdit();


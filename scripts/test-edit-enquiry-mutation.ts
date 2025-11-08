import { prisma } from '../src/server/db';
import { UpdateEnquiryFullSchema } from '../src/lib/validators/enquiry';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  beforeValue?: string | null;
  afterValue?: string | null;
}

async function testEditEnquiryMutation() {
  console.log('🧪 Testing Edit Enquiry Mutation (attendedById)\n');
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
    // Filter to only employees with valid UUID format (required by validation schema)
    const allEmployees = await prisma.employee.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        role: true,
      },
    });
    
    // UUID regex pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const employees = allEmployees.filter(emp => uuidRegex.test(emp.id));
    
    if (employees.length === 0) {
      console.log('❌ No employees with valid UUID format found in database.');
      console.log('   The validation schema requires UUID format for attendedById.');
      console.log('   Available employees (non-UUID IDs):');
      allEmployees.forEach((emp, idx) => {
        console.log(`   ${idx + 1}. ${emp.name} (${emp.role}) - ${emp.id}`);
      });
      console.log('\n   ⚠️  NOTE: Employee IDs must be in UUID format for attendedById validation to pass.');
      return;
    }
    
    console.log(`👥 Available employees for testing (with valid UUID format):`);
    employees.forEach((emp, idx) => {
      console.log(`   ${idx + 1}. ${emp.name} (${emp.role}) - ${emp.id}`);
    });
    if (allEmployees.length > employees.length) {
      console.log(`\n   ⚠️  NOTE: ${allEmployees.length - employees.length} employee(s) skipped (non-UUID IDs)`);
    }
    console.log('');
    
    const employee1 = employees[0]!;
    const employee2 = employees.length > 1 ? employees[1]! : employee1;
    
    const results: TestResult[] = [];
    
    // Test 1: Update attendedById with valid employee UUID
    console.log('Test 1: Update attendedById with valid employee UUID');
    try {
      const before = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
        select: { attendedById: true },
      });
      
      // Validate the input first
      const input = {
        id: testEnquiry.id,
        attendedById: employee1.id,
      };
      
      const validation = UpdateEnquiryFullSchema.safeParse(input);
      if (!validation.success) {
        const errorMessages = validation.error.errors.map((e: { message: string; path: (string | number)[] }) => 
          `${e.path.join('.')}: ${e.message}`
        ).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      // Update the enquiry
      const updated = await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: {
          attendedById: employee1.id,
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
      
      const after = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
        select: { attendedById: true },
      });
      
      if (updated.attendedById === employee1.id) {
        console.log(`   ✅ SUCCESS: attendedById updated to ${employee1.id}`);
        console.log(`   ✅ Attended by: ${updated.attendedBy?.name || 'None'}`);
        results.push({
          name: 'Update with valid UUID',
          success: true,
          beforeValue: before?.attendedById || null,
          afterValue: updated.attendedById || null,
        });
      } else {
        throw new Error(`Expected ${employee1.id}, got ${updated.attendedById}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update with valid UUID',
        success: false,
        error: message,
      });
    }
    console.log('');
    
    // Test 2: Change attendedById from one employee to another
    if (employees.length > 1) {
      console.log('Test 2: Change attendedById from one employee to another');
      try {
        const before = await prisma.enquiry.findUnique({
          where: { id: testEnquiry.id },
          select: { attendedById: true },
        });
        
        const input = {
          id: testEnquiry.id,
          attendedById: employee2.id,
        };
        
        const validation = UpdateEnquiryFullSchema.safeParse(input);
        if (!validation.success) {
          throw new Error(`Validation failed: ${JSON.stringify(validation.error.errors)}`);
        }
        
        const updated = await prisma.enquiry.update({
          where: { id: testEnquiry.id },
          data: {
            attendedById: employee2.id,
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
          console.log(`   ✅ SUCCESS: attendedById changed from ${employee1.id} to ${employee2.id}`);
          console.log(`   ✅ Attended by: ${updated.attendedBy?.name || 'None'}`);
          results.push({
            name: 'Change from one employee to another',
            success: true,
            beforeValue: before?.attendedById || null,
            afterValue: updated.attendedById || null,
          });
        } else {
          throw new Error(`Expected ${employee2.id}, got ${updated.attendedById}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`   ❌ FAILED: ${message}`);
        results.push({
          name: 'Change from one employee to another',
          success: false,
          error: message,
        });
      }
      console.log('');
    }
    
    // Test 3: Clear attendedById (set to null)
    console.log('Test 3: Clear attendedById (set to null)');
    try {
      const before = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
        select: { attendedById: true },
      });
      
      // Test with undefined (should not update)
      const input1 = {
        id: testEnquiry.id,
        attendedById: undefined,
      };
      
      const validation1 = UpdateEnquiryFullSchema.safeParse(input1);
      if (!validation1.success) {
        const errorMessages = validation1.error.errors.map((e: { message: string; path: (string | number)[] }) => 
          `${e.path.join('.')}: ${e.message}`
        ).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      // For clearing, we need to explicitly set to null in Prisma
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
        console.log(`   ✅ SUCCESS: attendedById cleared (set to null)`);
        results.push({
          name: 'Clear attendedById',
          success: true,
          beforeValue: before?.attendedById || null,
          afterValue: null,
        });
      } else {
        throw new Error(`Expected null, got ${updated.attendedById}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Clear attendedById',
        success: false,
        error: message,
      });
    }
    console.log('');
    
    // Test 4: Set attendedById when previously null
    console.log('Test 4: Set attendedById when previously null');
    try {
      const before = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
        select: { attendedById: true },
      });
      
      const input = {
        id: testEnquiry.id,
        attendedById: employee1.id,
      };
      
      const validation = UpdateEnquiryFullSchema.safeParse(input);
      if (!validation.success) {
        const errorMessages = validation.error.errors.map((e: { message: string; path: (string | number)[] }) => 
          `${e.path.join('.')}: ${e.message}`
        ).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      const updated = await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: {
          attendedById: employee1.id,
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
      
      if (updated.attendedById === employee1.id) {
        console.log(`   ✅ SUCCESS: attendedById set from null to ${employee1.id}`);
        console.log(`   ✅ Attended by: ${updated.attendedBy?.name || 'None'}`);
        results.push({
          name: 'Set attendedById when previously null',
          success: true,
          beforeValue: before?.attendedById || null,
          afterValue: updated.attendedById || null,
        });
      } else {
        throw new Error(`Expected ${employee1.id}, got ${updated.attendedById}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Set attendedById when previously null',
        success: false,
        error: message,
      });
    }
    console.log('');
    
    // Test 5: Invalid UUID (should fail validation)
    console.log('Test 5: Invalid UUID (should fail validation)');
    try {
      const input = {
        id: testEnquiry.id,
        attendedById: 'invalid-uuid-format',
      };
      
      const validation = UpdateEnquiryFullSchema.safeParse(input);
      if (validation.success) {
        throw new Error('Validation should have failed for invalid UUID');
      } else {
        const errorMessage = validation.error.errors && validation.error.errors.length > 0
          ? validation.error.errors[0]?.message || 'Validation failed'
          : 'Validation failed';
        console.log(`   ✅ SUCCESS: Validation correctly rejected invalid UUID`);
        console.log(`   ✅ Error: ${errorMessage}`);
        results.push({
          name: 'Invalid UUID validation',
          success: true,
          error: errorMessage,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Invalid UUID validation',
        success: false,
        error: message,
      });
    }
    console.log('');
    
    // Test 6: Update attendedById along with other fields
    console.log('Test 6: Update attendedById along with other fields');
    try {
      const before = await prisma.enquiry.findUnique({
        where: { id: testEnquiry.id },
        select: {
          attendedById: true,
          subject: true,
        },
      });
      
      const input = {
        id: testEnquiry.id,
        subject: 'Updated Subject for Test',
        attendedById: employee2.id,
        priority: 'High' as const,
      };
      
      const validation = UpdateEnquiryFullSchema.safeParse(input);
      if (!validation.success) {
        const errorMessages = validation.error.errors.map((e: { message: string; path: (string | number)[] }) => 
          `${e.path.join('.')}: ${e.message}`
        ).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      const updated = await prisma.enquiry.update({
        where: { id: testEnquiry.id },
        data: {
          subject: input.subject,
          attendedById: input.attendedById,
          priority: input.priority,
        },
        select: {
          id: true,
          subject: true,
          attendedById: true,
          priority: true,
          attendedBy: {
            select: {
              name: true,
            },
          },
        },
      });
      
      if (updated.attendedById === employee2.id && updated.subject === input.subject) {
        console.log(`   ✅ SUCCESS: Multiple fields updated including attendedById`);
        console.log(`   ✅ Subject: ${updated.subject}`);
        console.log(`   ✅ Attended by: ${updated.attendedBy?.name || 'None'}`);
        results.push({
          name: 'Update with other fields',
          success: true,
          beforeValue: before?.attendedById || null,
          afterValue: updated.attendedById || null,
        });
      } else {
        throw new Error('Fields were not updated correctly');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ FAILED: ${message}`);
      results.push({
        name: 'Update with other fields',
        success: false,
        error: message,
      });
    }
    console.log('');
    
    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Test Results Summary:\n');
    
    results.forEach((result, idx) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${idx + 1}. ${result.name}`);
      if (result.beforeValue !== undefined && result.afterValue !== undefined) {
        console.log(`   Before: ${result.beforeValue || 'null'}`);
        console.log(`   After: ${result.afterValue || 'null'}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`\n📈 Success Rate: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)\n`);
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEditEnquiryMutation();


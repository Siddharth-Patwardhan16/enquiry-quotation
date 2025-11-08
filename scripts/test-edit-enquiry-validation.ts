import { UpdateEnquiryFullSchema } from '../src/lib/validators/enquiry';

// Generate a valid UUID for testing
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const validUUID = generateUUID();
const anotherValidUUID = generateUUID();

interface TestCase {
  name: string;
  data: unknown;
  shouldPass: boolean;
  expectedError?: string;
}

const testCases: TestCase[] = [
  // Test 1: Valid attendedById UUID
  {
    name: 'Valid attendedById UUID',
    data: {
      id: 1,
      attendedById: validUUID,
    },
    shouldPass: true,
  },
  
  // Test 2: Invalid UUID format - too short
  {
    name: 'Invalid UUID format - too short',
    data: {
      id: 1,
      attendedById: 'invalid-uuid',
    },
    shouldPass: false,
    expectedError: 'Invalid UUID format',
  },
  
  // Test 3: Invalid UUID format - wrong structure
  {
    name: 'Invalid UUID format - wrong structure',
    data: {
      id: 1,
      attendedById: '12345-67890-abcdef',
    },
    shouldPass: false,
    expectedError: 'Invalid UUID format',
  },
  
  // Test 4: Empty string for attendedById
  {
    name: 'Empty string for attendedById',
    data: {
      id: 1,
      attendedById: '',
    },
    shouldPass: true, // Should be converted to undefined
  },
  
  // Test 5: Null for attendedById
  {
    name: 'Null for attendedById',
    data: {
      id: 1,
      attendedById: null,
    },
    shouldPass: true, // Should be converted to undefined
  },
  
  // Test 6: Undefined for attendedById
  {
    name: 'Undefined for attendedById',
    data: {
      id: 1,
      attendedById: undefined,
    },
    shouldPass: true,
  },
  
  // Test 7: Whitespace-only string
  {
    name: 'Whitespace-only string for attendedById',
    data: {
      id: 1,
      attendedById: '   ',
    },
    shouldPass: true, // Should be converted to undefined
  },
  
  // Test 8: String "null"
  {
    name: 'String "null" for attendedById',
    data: {
      id: 1,
      attendedById: 'null',
    },
    shouldPass: true, // Should be converted to undefined by preprocess
  },
  
  // Test 9: String "undefined"
  {
    name: 'String "undefined" for attendedById',
    data: {
      id: 1,
      attendedById: 'undefined',
    },
    shouldPass: true, // Should be converted to undefined by preprocess
  },
  
  // Test 10: Valid priority enum
  {
    name: 'Valid priority enum',
    data: {
      id: 1,
      priority: 'High',
    },
    shouldPass: true,
  },
  
  // Test 11: Invalid priority enum
  {
    name: 'Invalid priority enum',
    data: {
      id: 1,
      priority: 'InvalidPriority',
    },
    shouldPass: false,
  },
  
  // Test 12: Valid source enum
  {
    name: 'Valid source enum',
    data: {
      id: 1,
      source: 'Website',
    },
    shouldPass: true,
  },
  
  // Test 13: Empty string for source (should be converted to undefined)
  {
    name: 'Empty string for source',
    data: {
      id: 1,
      source: '',
    },
    shouldPass: true,
  },
  
  // Test 14: Valid status enum
  {
    name: 'Valid status enum',
    data: {
      id: 1,
      status: 'LIVE',
    },
    shouldPass: true,
  },
  
  // Test 15: Valid designRequired enum
  {
    name: 'Valid designRequired enum',
    data: {
      id: 1,
      designRequired: 'Yes',
    },
    shouldPass: true,
  },
  
  // Test 16: Empty string for designRequired
  {
    name: 'Empty string for designRequired',
    data: {
      id: 1,
      designRequired: '',
    },
    shouldPass: true, // Should be converted to undefined
  },
  
  // Test 17: Valid customerType enum
  {
    name: 'Valid customerType enum',
    data: {
      id: 1,
      customerType: 'NEW',
    },
    shouldPass: true,
  },
  
  // Test 18: Valid date string
  {
    name: 'Valid date string',
    data: {
      id: 1,
      enquiryDate: '2024-01-15',
    },
    shouldPass: true,
  },
  
  // Test 19: Valid numberOfBlocks number
  {
    name: 'Valid numberOfBlocks number',
    data: {
      id: 1,
      numberOfBlocks: 10,
    },
    shouldPass: true,
  },
  
  // Test 20: Empty string for numberOfBlocks (should be converted to undefined)
  {
    name: 'Empty string for numberOfBlocks',
    data: {
      id: 1,
      numberOfBlocks: '',
    },
    shouldPass: true,
  },
  
  // Test 21: NaN for numberOfBlocks (should be converted to undefined)
  {
    name: 'NaN for numberOfBlocks',
    data: {
      id: 1,
      numberOfBlocks: NaN,
    },
    shouldPass: true,
  },
  
  // Test 22: Multiple fields including valid attendedById
  {
    name: 'Multiple fields including valid attendedById',
    data: {
      id: 1,
      subject: 'Test Subject',
      attendedById: validUUID,
      priority: 'High',
      status: 'LIVE',
    },
    shouldPass: true,
  },
  
  // Test 23: Changing attendedById from one UUID to another
  {
    name: 'Changing attendedById from one UUID to another',
    data: {
      id: 1,
      attendedById: anotherValidUUID,
    },
    shouldPass: true,
  },
  
  // Test 24: Missing id (required field)
  {
    name: 'Missing id (required field)',
    data: {
      attendedById: validUUID,
    },
    shouldPass: false,
  },
  
  // Test 25: Invalid id type
  {
    name: 'Invalid id type (string instead of number)',
    data: {
      id: '1',
      attendedById: validUUID,
    },
    shouldPass: false,
  },
];

async function runValidationTests() {
  console.log('🧪 Testing UpdateEnquiryFullSchema Validation\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = UpdateEnquiryFullSchema.safeParse(testCase.data);
    const didPass = result.success;
    const shouldPass = testCase.shouldPass;
    
    if (didPass === shouldPass) {
      passed++;
      console.log(`✅ PASS: ${testCase.name}`);
      if (!didPass && result.error && result.error.errors && result.error.errors.length > 0) {
        console.log(`   Error: ${result.error.errors[0]?.message || 'Validation failed'}`);
      }
    } else {
      failed++;
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`   Expected: ${shouldPass ? 'PASS' : 'FAIL'}, Got: ${didPass ? 'PASS' : 'FAIL'}`);
      if (result.error && result.error.errors) {
        console.log(`   Error details:`, result.error.errors);
      } else if (result.error) {
        console.log(`   Error:`, result.error);
      }
      if (testCase.expectedError) {
        console.log(`   Expected error message: ${testCase.expectedError}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`   📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);
  
  // Additional detailed test for attendedById edge cases
  console.log('\n🔍 Detailed attendedById Edge Case Tests:\n');
  console.log('='.repeat(80));
  
  const attendedByIdTests = [
    { value: validUUID, description: 'Valid UUID' },
    { value: '', description: 'Empty string' },
    { value: null, description: 'Null' },
    { value: undefined, description: 'Undefined' },
    { value: '   ', description: 'Whitespace only' },
    { value: 'null', description: 'String "null"' },
    { value: 'undefined', description: 'String "undefined"' },
    { value: 'invalid', description: 'Invalid format' },
    { value: '123e4567-e89b-12d3-a456-426614174000', description: 'Valid UUID format' },
  ];
  
  for (const test of attendedByIdTests) {
    const result = UpdateEnquiryFullSchema.safeParse({
      id: 1,
      attendedById: test.value,
    });
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${test.description}: ${JSON.stringify(test.value)}`);
    if (!result.success && result.error && result.error.errors) {
      const error = result.error.errors.find((e: { path?: (string | number)[] }) => e.path && e.path.includes('attendedById'));
      if (error) {
        console.log(`   Error: ${error.message}`);
      } else if (result.error.errors.length > 0) {
        console.log(`   Error: ${result.error.errors[0]?.message || 'Validation failed'}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

runValidationTests().catch(console.error);


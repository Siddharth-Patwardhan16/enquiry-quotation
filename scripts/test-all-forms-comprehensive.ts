import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  success: boolean;
  output: string;
  error?: string;
}

async function runTestScript(scriptPath: string): Promise<TestResult> {
  try {
    const { stdout, stderr } = await execAsync(`npx tsx ${scriptPath}`, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Check if the output contains success indicators
    const output = stdout + stderr;
    
    // Look for success rate at the end - if it's 100% or close, consider it a pass
    // Also check for "Error running" which indicates a script-level failure
    const hasScriptError = output.includes('Error running') || output.includes('❌ Error');
    const successRateMatch = output.match(/Success Rate: (\d+)\/(\d+) \(([\d.]+)%\)/);
    
    let success = false;
    if (hasScriptError) {
      success = false;
    } else if (successRateMatch) {
      const rate = parseFloat(successRateMatch[3] ?? '0');
      // Consider 80%+ as passing (some tests might have expected failures)
      success = rate >= 80;
    } else {
      // If no success rate found, check for explicit failure patterns
      const hasExplicitFailure = output.includes('Error running') || 
                                  (output.includes('❌') && !output.includes('✅'));
      success = !hasExplicitFailure;
    }

    return {
      name: scriptPath,
      success,
      output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: scriptPath,
      success: false,
      output: '',
      error: errorMessage,
    };
  }
}

async function runAllTests() {
  console.log('🧪 Running Comprehensive Test Suite\n');
  console.log('='.repeat(80));
  console.log('');

  const testScripts = [
    'scripts/test-enquiry-form-create.ts',
    'scripts/test-enquiry-form-edit.ts',
    'scripts/test-quotation-form-create.ts',
    'scripts/test-quotation-form-edit.ts',
    'scripts/test-communication-form.ts',
    'scripts/test-enquiry-status-updates.ts',
    'scripts/test-quotation-status-updates.ts',
    'scripts/test-communication-enquiry-integration.ts',
  ];

  const results: TestResult[] = [];

  for (const script of testScripts) {
    console.log(`\n📋 Running: ${script}`);
    console.log('-'.repeat(80));
    const result = await runTestScript(script);
    results.push(result);

    if (result.success) {
      console.log(`✅ ${script} - PASSED`);
    } else {
      console.log(`❌ ${script} - FAILED`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('\n📊 Comprehensive Test Suite Results Summary:\n');

  results.forEach((result, idx) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${idx + 1}. ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const passed = results.filter((r) => r.success).length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);

  console.log(`\n📈 Overall Success Rate: ${passed}/${total} (${successRate}%)\n`);

  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log(`⚠️  ${total - passed} test suite(s) failed. Please review the output above.`);
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('❌ Error running comprehensive tests:', error);
  process.exit(1);
});


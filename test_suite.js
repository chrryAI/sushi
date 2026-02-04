import { initTracker, logTask, logTest, closeTracker } from './compiler/tracker.js';
import { execSync } from 'child_process';
import fs from 'fs';

const tests = [
  {
    id: 'test-existing-1',
    name: 'Simple function call',
    file: 'test_simple.js',
    expected: '15'
  },
  {
    id: 'test-existing-2', 
    name: 'Empty program',
    file: 'bench/empty.js',
    expected: ''
  },
  {
    id: 'test-semantic-1',
    name: 'Semantic: Capture detection',
    file: 'test_semantic.js',
    expected: 'makeAdder._captured: Set(1) { \'x\' }',
    isNodeTest: true
  },
  {
    id: 'test-closure-1',
    name: 'Closure: makeAdder',
    file: 'test_closure_basic.js',
    expected: '15',
    currentlyFailing: true
  }
];

async function runTest(test) {
  try {
    const cmd = test.isNodeTest 
      ? `node ${test.file}`
      : `node runtime/index.js ${test.file}`;
    
    const output = execSync(cmd, { 
      cwd: '/Users/ibrahimvelinov/Documents/porffor',
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim();
    
    const passed = test.currentlyFailing 
      ? false 
      : output.includes(test.expected) || output === test.expected;
    
    return { passed, output, error: null };
  } catch (err) {
    return { passed: false, output: err.stdout || '', error: err.message };
  }
}

async function main() {
  await initTracker();
  
  console.log('🧪 Running Test Suite\n');
  
  let passCount = 0;
  let failCount = 0;
  let expectedFailCount = 0;
  
  for (const test of tests) {
    await logTask(test.id, test.name, 'in_progress', test.file);
    
    const result = await runTest(test);
    
    if (test.currentlyFailing) {
      expectedFailCount++;
      console.log(`⏳ ${test.name}: EXPECTED FAIL`);
      console.log(`   Output: ${result.output}`);
    } else if (result.passed) {
      passCount++;
      console.log(`✅ ${test.name}: PASS`);
    } else {
      failCount++;
      console.log(`❌ ${test.name}: FAIL`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Got: ${result.output}`);
      if (result.error) console.log(`   Error: ${result.error}`);
    }
    
    await logTest(test.id, test.file, result.passed, result.error || `Output: ${result.output}`);
    await logTask(test.id, test.name, result.passed ? 'completed' : 'in_progress', test.file);
    
    console.log('');
  }
  
  console.log('📊 Summary:');
  console.log(`   ✅ Passing: ${passCount}`);
  console.log(`   ❌ Failing: ${failCount}`);
  console.log(`   ⏳ Expected Fails: ${expectedFailCount}`);
  console.log(`   📝 Total: ${tests.length}`);
  
  await closeTracker();
  
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(console.error);

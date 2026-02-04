import { initTracker, logTask, logCodeChange, logTest, getCurrentBlocker, generatePRDescription, closeTracker } from './compiler/tracker.js';
import { execSync } from 'child_process';

async function runTest() {
  try {
    execSync('node runtime/index.js test_closure_basic.js', { 
      cwd: '/Users/ibrahimvelinov/Documents/porffor',
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    return { passed: true, output: '15' };
  } catch (err) {
    return { passed: false, error: err.stderr || err.stdout || err.message };
  }
}

async function main() {
  await initTracker();
  
  console.log('\n🎯 Starting Closure Implementation\n');
  
  // Task 1: Semantic Analysis
  await logTask('task-1-semantic', 'Add captured variable tracking to semantic.js', 'in_progress', 'compiler/semantic.js');
  
  console.log('📖 Reading current semantic.js implementation...');
  console.log('📝 Will add: Variable capture detection in analyze() phase');
  console.log('📝 Will add: Mark captured variables and functions');
  
  // Test current state
  const initialTest = await runTest();
  await logTest('task-1-semantic', 'test_closure_basic.js', initialTest.passed, initialTest.error);
  
  if (!initialTest.passed) {
    console.log('\n❌ Test still failing (expected)');
    console.log('Error:', initialTest.error?.split('\n')[0]);
  }
  
  await getCurrentBlocker();
  
  console.log('\n📋 Next: Implement semantic analysis for captured variables');
  console.log('💡 This will detect that "x" in the inner function comes from outer scope');
  
  await closeTracker();
}

main().catch(console.error);

/**
 * Run AUTOFIX - Generate and apply fixes based on Memory learnings
 */

import { initAutoFix, generateFixReport, applyFixesInteractive, closeAutoFix } from './autofix.js';

async function main() {
  console.log('🔧 AUTOFIX - Automatic Code Fix Generator\n');
  
  await initAutoFix();
  
  // Generate fix report for test files
  console.log('=== Fix Report for test_suite.js ===');
  await generateFixReport('./test_suite.js');
  
  console.log('\n=== Fix Report for tools/bam.js ===');
  await generateFixReport('./tools/bam.js');
  
  console.log('\n=== Fix Report for compiler/semantic.js ===');
  await generateFixReport('./compiler/semantic.js');
  
  await closeAutoFix();
  
  console.log('\n✅ AutoFix report complete!');
  console.log('\n💡 To apply fixes, run: node tools/run-autofix.js --apply <file>');
}

main().catch(console.error);

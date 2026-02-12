/**
 * Run BAM + STRIKE on Porffor closure implementation
 * Analyzes bugs and tests mutations
 */

import { initBAM, scanDirectory, analyzeBugPatterns, closeBAM } from './bam.js';
import { initSTRIKE, runMutationTesting, analyzeMutationScore, findWeakSpots, closeSTRIKE } from './strike.js';

async function main() {
  console.log('🥋⚡ BAM + STRIKE Analysis\n');
  
  // Initialize systems
  await initBAM();
  await initSTRIKE();
  
  // Phase 1: BAM - Scan for bugs
  console.log('\n=== Phase 1: BAM Bug Detection ===');
  await scanDirectory('./compiler', ['.js']);
  await scanDirectory('./tests', ['.js']);
  await scanDirectory('.', ['.js']); // Root level test files
  
  // Analyze bug patterns
  await analyzeBugPatterns();
  
  // Phase 2: STRIKE - Mutation testing
  console.log('\n=== Phase 2: STRIKE Mutation Testing ===');
  
  // Test semantic.js mutations
  console.log('\n📍 Testing compiler/semantic.js');
  await runMutationTesting(
    './compiler/semantic.js',
    'node test_semantic.js'
  );
  
  // Test run_micro_tests.js mutations
  console.log('\n📍 Testing run_micro_tests.js');
  await runMutationTesting(
    './run_micro_tests.js',
    'node run_micro_tests.js'
  );
  
  // Analyze mutation score
  await analyzeMutationScore();
  
  // Find weak spots
  await findWeakSpots();
  
  // Close connections
  await closeBAM();
  await closeSTRIKE();
  
  console.log('\n✅ Analysis complete!');
}

main().catch(console.error);

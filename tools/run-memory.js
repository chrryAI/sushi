/**
 * Run MEMORY system - learn from BAM+STRIKE data
 */

import { initMemory, learnFromBugs, learnFromMutations, getRecommendations, generateReport, closeMemory } from './memory.js';

async function main() {
  console.log('🧠 MEMORY Learning System\n');
  
  await initMemory();
  
  // Phase 1: Learn from bugs
  console.log('=== Phase 1: Learning from Bugs ===');
  const rules = await learnFromBugs();
  console.log(`\n✅ Learned ${rules.length} prevention rules`);
  
  // Phase 2: Learn from mutations
  console.log('\n=== Phase 2: Learning from Mutations ===');
  const weakSpots = await learnFromMutations();
  console.log(`\n✅ Identified ${weakSpots.length} weak spots`);
  
  // Phase 3: Generate recommendations
  console.log('\n=== Phase 3: Recommendations ===');
  await getRecommendations('./compiler/semantic.js');
  await getRecommendations('./run_micro_tests.js');
  
  // Phase 4: Generate report
  console.log('\n=== Phase 4: System Report ===');
  await generateReport();
  
  await closeMemory();
  
  console.log('\n✅ Memory system learning complete!');
}

main().catch(console.error);

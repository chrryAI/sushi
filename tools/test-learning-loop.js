/**
 * Test Learning Loop - Log the unused import fix result
 */

import {
  closeLearningLoop,
  getLearningStats,
  initLearningLoop,
  logFixResult,
} from "./learning-loop.js";

async function main() {
  console.log("🔄 Testing Learning Loop\n");

  await initLearningLoop();

  // Log the successful fix we just applied
  const fix = {
    type: "UNUSED_IMPORT",
    file: "./tools/bam.js",
    description: "Remove unused import: execSync from child_process",
  };

  const result = {
    applied: true,
    error: null,
  };

  console.log("📝 Logging fix result...");
  await logFixResult(fix, result);

  // Get updated learning stats
  console.log("\n📊 Getting learning statistics...");
  await getLearningStats();

  await closeLearningLoop();

  console.log("\n✅ Learning loop test complete!");
  console.log("💡 System learned from the fix and updated confidence scores");
}

main().catch(console.error);

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tests = [
  {
    id: "test-existing-1",
    name: "Simple function call",
    file: "test_simple.js",
    expected: "15",
  },
  {
    id: "test-existing-2",
    name: "Empty program",
    file: "bench/empty.js",
    expected: "",
  },
  {
    id: "test-semantic-1",
    name: "Semantic: Capture detection",
    file: "test_semantic.js",
    expected: "makeAdder._captured: Set(1) { 'x' }",
    isNodeTest: true,
  },
  {
    id: "test-closure-1",
    name: "Closure: makeAdder",
    file: "test_closure_basic.js",
    expected: "15",
    currentlyFailing: true,
  },
];

async function runTest(test) {
  try {
    const cmd = test.isNodeTest
      ? `node ${test.file}`
      : `node runtime/index.js ${test.file}`;

    const output = execSync(cmd, {
      cwd: __dirname,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();

    // Compute actual pass result first
    const actualPass =
      test.expected === ""
        ? output === ""
        : output === test.expected || output.includes(test.expected);

    // Detect unexpected pass
    const unexpectedPass = test.currentlyFailing && actualPass;

    const passed = actualPass;

    return { passed, output, error: null };
  } catch (err) {
    return { passed: false, output: err.stdout || "", error: err.message };
  }
}

async function main() {
  console.log("🧪 Running Test Suite\n");

  let passCount = 0;
  let failCount = 0;
  let expectedFailCount = 0;
  let unexpectedPassCount = 0;

  for (const test of tests) {
    const result = await runTest(test);

    if (test.currentlyFailing && !result.passed) {
      expectedFailCount++;
      console.log(`⏳ ${test.name}: EXPECTED FAIL`);
      console.log(`   Output: ${result.output}`);
    } else if (test.currentlyFailing && result.passed) {
      unexpectedPassCount++;
      console.log(`🎉 ${test.name}: UNEXPECTED PASS (was marked as failing!)`);
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

    console.log("");
  }

  console.log("📊 Summary:");
  console.log(`   ✅ Passing: ${passCount}`);
  console.log(`   ❌ Failing: ${failCount}`);
  console.log(`   ⏳ Expected Fails: ${expectedFailCount}`);
  if (unexpectedPassCount > 0) {
    console.log(`   🎉 Unexpected Passes: ${unexpectedPassCount}`);
  }
  console.log(`   📝 Total: ${tests.length}`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(console.error);

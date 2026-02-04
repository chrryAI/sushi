import {
  initTracker,
  logTask,
  logTest,
  closeTracker,
} from "./compiler/tracker.js";
import { execSync } from "child_process";

const microTests = [
  {
    id: "micro-1",
    file: "tests/micro/test_1_no_closure.js",
    expected: "15",
    name: "No closure (baseline)",
  },
  {
    id: "micro-2",
    file: "tests/micro/test_2_nested_function.js",
    expected: "42",
    name: "Nested function",
  },
  {
    id: "micro-3",
    file: "tests/micro/test_3_return_function.js",
    expected: "99",
    name: "Return function",
  },
  {
    id: "micro-4",
    file: "tests/micro/test_4_simple_closure.js",
    expected: "15",
    name: "Simple closure",
    failing: true,
  },
  {
    id: "micro-5",
    file: "tests/micro/test_5_global_access.js",
    expected: "101",
    name: "Global access",
  },
];

async function runMicroTest(test) {
  try {
    const output = execSync(`node runtime/index.js ${test.file}`, {
      cwd: "/Users/ibrahimvelinov/Documents/porffor",
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();

    // Remove ANSI color codes
    const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, "").trim();
    const passed = cleanOutput === test.expected.trim();
    return { passed, output: cleanOutput, error: null };
  } catch (err) {
    return { passed: false, output: err.stdout || "", error: err.message };
  }
}

async function main() {
  await initTracker();

  console.log("🔬 Running Micro Tests\n");

  const results = [];

  for (const test of microTests) {
    await logTask(test.id, test.name, "in_progress", test.file);

    const result = await runMicroTest(test);
    results.push({ test, result });

    if (test.failing) {
      console.log(`⏳ ${test.name}: EXPECTED FAIL (got: ${result.output})`);
    } else if (result.passed) {
      console.log(`✅ ${test.name}: PASS`);
    } else {
      console.log(`❌ ${test.name}: FAIL`);
      console.log(`   Expected: ${test.expected}, Got: ${result.output}`);
    }

    await logTest(
      test.id,
      test.file,
      result.passed,
      result.error || `Output: ${result.output}`,
    );
    await logTask(
      test.id,
      test.name,
      result.passed ? "completed" : "in_progress",
      test.file,
    );
  }

  console.log("\n📊 Micro Test Results:");
  const passing = results.filter(
    (r) => !r.test.failing && r.result.passed,
  ).length;
  const failing = results.filter(
    (r) => !r.test.failing && !r.result.passed,
  ).length;
  const expected = results.filter((r) => r.test.failing).length;

  console.log(`   ✅ Passing: ${passing}/${microTests.length - expected}`);
  console.log(`   ❌ Failing: ${failing}`);
  console.log(`   ⏳ Expected Fails: ${expected}`);

  await closeTracker();

  return failing === 0;
}

main()
  .then((success) => process.exit(success ? 0 : 1))
  .catch(console.error);

/**
 * STRIKE - Mutation Testing System
 * Creates mutant code to test coverage and find logic holes
 * Logs mutations and results to FalkorDB
 */

import { FalkorDB } from "falkordb";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

let db = null;
let graph = null;

async function initSTRIKE() {
  if (graph) return;

  db = await FalkorDB.connect({
    socket: { host: "localhost", port: 6380 },
  });
  graph = db.selectGraph("porffor_mutations");
  console.log("⚡ STRIKE initialized");
}

const MUTATION_OPERATORS = {
  // Arithmetic mutations
  ARITHMETIC: [
    { from: "+", to: "-", name: "ADD_TO_SUB" },
    { from: "-", to: "+", name: "SUB_TO_ADD" },
    { from: "*", to: "/", name: "MUL_TO_DIV" },
    { from: "/", to: "*", name: "DIV_TO_MUL" },
  ],

  // Comparison mutations
  COMPARISON: [
    { from: "===", to: "!==", name: "EQ_TO_NEQ" },
    { from: "!==", to: "===", name: "NEQ_TO_EQ" },
    { from: ">", to: "<", name: "GT_TO_LT" },
    { from: "<", to: ">", name: "LT_TO_GT" },
    { from: ">=", to: "<=", name: "GTE_TO_LTE" },
    { from: "<=", to: ">=", name: "LTE_TO_GTE" },
  ],

  // Logical mutations
  LOGICAL: [
    { from: "&&", to: "||", name: "AND_TO_OR" },
    { from: "||", to: "&&", name: "OR_TO_AND" },
    { from: "!", to: "", name: "NEGATE_REMOVE" },
  ],

  // Constant mutations
  CONSTANT: [
    { from: "true", to: "false", name: "TRUE_TO_FALSE" },
    { from: "false", to: "true", name: "FALSE_TO_TRUE" },
    { from: "0", to: "1", name: "ZERO_TO_ONE" },
    { from: "1", to: "0", name: "ONE_TO_ZERO" },
  ],

  // Return mutations
  RETURN: [
    { from: /return\s+([^;]+);/, to: "return null;", name: "RETURN_TO_NULL" },
    {
      from: /return\s+([^;]+);/,
      to: "return undefined;",
      name: "RETURN_TO_UNDEFINED",
    },
  ],
};

function generateMutations(code, filePath) {
  const mutations = [];

  // Apply each mutation operator
  for (const [category, operators] of Object.entries(MUTATION_OPERATORS)) {
    for (const op of operators) {
      let mutatedCode = code;
      let mutationCount = 0;

      if (op.from instanceof RegExp) {
        // Regex-based mutation
        const matches = code.matchAll(new RegExp(op.from, "g"));
        for (const match of matches) {
          mutatedCode = code.replace(match[0], op.to);
          mutationCount++;

          mutations.push({
            id: `${filePath}_${op.name}_${mutationCount}`,
            file: filePath,
            operator: op.name,
            category,
            original: match[0],
            mutated: op.to,
            line: code.substring(0, match.index).split("\n").length,
            code: mutatedCode,
          });
        }
      } else {
        // String-based mutation
        const pattern = new RegExp(`\\b${escapeRegex(op.from)}\\b`, "g");
        const matches = code.matchAll(pattern);

        for (const match of matches) {
          mutatedCode = code.replace(match[0], op.to);
          mutationCount++;

          mutations.push({
            id: `${filePath}_${op.name}_${mutationCount}`,
            file: filePath,
            operator: op.name,
            category,
            original: op.from,
            mutated: op.to,
            line: code.substring(0, match.index).split("\n").length,
            code: mutatedCode,
          });
        }
      }
    }
  }

  return mutations;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function testMutation(mutation, testCommand) {
  // Write mutated code to temp file
  const tempFile = mutation.file + ".mutant";
  const originalCode = fs.readFileSync(mutation.file, "utf-8");

  try {
    fs.writeFileSync(tempFile, mutation.code);
    fs.renameSync(mutation.file, mutation.file + ".original");
    fs.renameSync(tempFile, mutation.file);

    // Run tests
    const result = execSync(testCommand, {
      encoding: "utf-8",
      stdio: "pipe",
    });

    // Mutation survived (tests still pass) - BAD!
    return {
      survived: true,
      output: result,
      error: null,
    };
  } catch (err) {
    // Mutation killed (tests fail) - GOOD!
    return {
      survived: false,
      output: err.stdout || "",
      error: err.message,
    };
  } finally {
    // Restore original file
    if (fs.existsSync(mutation.file + ".original")) {
      fs.renameSync(mutation.file + ".original", mutation.file);
    }
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

async function logMutationToFalkorDB(mutation, testResult) {
  if (!graph) await initSTRIKE();

  const timestamp = Date.now();

  await graph.query(
    `
    CREATE (m:Mutation {
      id: $id,
      file: $file,
      operator: $operator,
      category: $category,
      original: $original,
      mutated: $mutated,
      line: $line,
      survived: $survived,
      timestamp: $timestamp
    })
  `,
    {
      params: {
        id: mutation.id,
        file: mutation.file,
        operator: mutation.operator,
        category: mutation.category,
        original: mutation.original,
        mutated: mutation.mutated,
        line: mutation.line,
        survived: testResult.survived,
        timestamp,
      },
    },
  );

  const status = testResult.survived ? "💀 SURVIVED" : "✅ KILLED";
  console.log(
    `${status}: ${mutation.operator} at ${mutation.file}:${mutation.line}`,
  );

  return mutation.id;
}

async function analyzeMutationScore() {
  if (!graph) await initSTRIKE();

  const result = await graph.query(`
    MATCH (m:Mutation)
    WITH COUNT(m) as total, SUM(CASE WHEN m.survived THEN 0 ELSE 1 END) as killed
    RETURN total, killed, (killed * 100.0 / total) as score
  `);

  if (result && result.data && result.data.length > 0) {
    const [total, killed, score] = result.data[0];
    console.log("\n📊 Mutation Score:");
    console.log(`   Total Mutations: ${total}`);
    console.log(`   Killed: ${killed}`);
    console.log(`   Survived: ${total - killed}`);
    console.log(`   Score: ${score.toFixed(2)}%`);

    return { total, killed, score };
  }

  return { total: 0, killed: 0, score: 0 };
}

async function findWeakSpots() {
  if (!graph) await initSTRIKE();

  const result = await graph.query(`
    MATCH (m:Mutation {survived: true})
    RETURN m.file as file, m.line as line, m.operator as operator, COUNT(m) as count
    ORDER BY count DESC
    LIMIT 10
  `);

  console.log("\n🎯 Weak Spots (Survived Mutations):");
  if (result && result.data) {
    for (const row of result.data) {
      const [file, line, operator, count] = row;
      console.log(`   ${file}:${line} - ${operator} (${count}x)`);
    }
  } else {
    console.log("   No survived mutations found");
  }

  return result;
}

async function runMutationTesting(filePath, testCommand) {
  const code = fs.readFileSync(filePath, "utf-8");
  const mutations = generateMutations(code, filePath);

  console.log(`\n⚡ Generated ${mutations.length} mutations for ${filePath}`);

  let survived = 0;
  let killed = 0;

  for (const mutation of mutations) {
    const result = await testMutation(mutation, testCommand);
    await logMutationToFalkorDB(mutation, result);

    if (result.survived) {
      survived++;
    } else {
      killed++;
    }
  }

  const score = (killed / mutations.length) * 100;
  console.log(
    `\n📊 Mutation Score: ${score.toFixed(2)}% (${killed}/${mutations.length} killed)`,
  );

  return { total: mutations.length, killed, survived, score };
}

async function closeSTRIKE() {
  if (db) {
    await db.close();
    db = null;
    graph = null;
    console.log("👋 STRIKE closed");
  }
}

export {
  initSTRIKE,
  generateMutations,
  testMutation,
  logMutationToFalkorDB,
  analyzeMutationScore,
  findWeakSpots,
  runMutationTesting,
  closeSTRIKE,
};

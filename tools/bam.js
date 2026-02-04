/**
 * BAM - Bug Analysis & Memory System
 * Detects bugs, logic errors, and missing implementations
 * Logs everything to FalkorDB for learning
 */

import { FalkorDB } from "falkordb";
import fs from "fs";
import path from "path";

let db = null;
let graph = null;

async function initBAM() {
  if (graph) return;

  db = await FalkorDB.connect({
    socket: { host: "localhost", port: 6380 },
  });
  graph = db.selectGraph("porffor_bugs");
  console.log("🥋 BAM initialized");
}

async function detectBugs(filePath, code) {
  const bugs = [];

  // Pattern 1: Type mismatches
  const typeMismatchPattern =
    /local\.(set|get|tee)\[0\] expected type (\w+), found (\w+)/g;
  let match;
  while ((match = typeMismatchPattern.exec(code)) !== null) {
    bugs.push({
      type: "TYPE_MISMATCH",
      severity: "HIGH",
      file: filePath,
      pattern: match[0],
      expected: match[2],
      found: match[3],
      line: code.substring(0, match.index).split("\n").length,
    });
  }

  // Pattern 2: Hardcoded paths
  const hardcodedPathPattern = /['"]\/Users\/[^'"]+['"]/g;
  while ((match = hardcodedPathPattern.exec(code)) !== null) {
    bugs.push({
      type: "HARDCODED_PATH",
      severity: "MEDIUM",
      file: filePath,
      pattern: match[0],
      line: code.substring(0, match.index).split("\n").length,
      suggestion: "Use __dirname or process.cwd()",
    });
  }

  // Pattern 3: Unused imports
  const importPattern = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  while ((match = importPattern.exec(code)) !== null) {
    const items = match[1].split(",").map((s) => s.trim());
    items.forEach((item) => {
      const usagePattern = new RegExp(`\\b${item}\\b`, "g");
      const usageCount = (code.match(usagePattern) || []).length;
      if (usageCount === 1) {
        // Only in import statement
        bugs.push({
          type: "UNUSED_IMPORT",
          severity: "LOW",
          file: filePath,
          pattern: item,
          from: match[2],
          line: code.substring(0, match.index).split("\n").length,
        });
      }
    });
  }

  // Pattern 4: Missing error handling
  const asyncFunctionPattern = /async\s+function\s+(\w+)/g;
  while ((match = asyncFunctionPattern.exec(code)) !== null) {
    const funcName = match[1];
    const funcStart = match.index;
    const funcEnd = findFunctionEnd(code, funcStart);
    const funcBody = code.substring(funcStart, funcEnd);

    if (!funcBody.includes("try") && !funcBody.includes("catch")) {
      bugs.push({
        type: "MISSING_ERROR_HANDLING",
        severity: "MEDIUM",
        file: filePath,
        pattern: funcName,
        line: code.substring(0, match.index).split("\n").length,
        suggestion: "Add try-catch block",
      });
    }
  }

  // Pattern 5: Logic errors (test failures)
  const testFailPattern = /test\.currentlyFailing\s*\?\s*false\s*:/g;
  while ((match = testFailPattern.exec(code)) !== null) {
    bugs.push({
      type: "LOGIC_ERROR",
      severity: "HIGH",
      file: filePath,
      pattern: "currentlyFailing forces false",
      line: code.substring(0, match.index).split("\n").length,
      suggestion:
        "Compute actual pass result first, then check currentlyFailing",
    });
  }

  return bugs;
}

function findFunctionEnd(code, start) {
  let depth = 0;
  let inFunction = false;

  for (let i = start; i < code.length; i++) {
    if (code[i] === "{") {
      depth++;
      inFunction = true;
    } else if (code[i] === "}") {
      depth--;
      if (inFunction && depth === 0) {
        return i + 1;
      }
    }
  }
  return code.length;
}

async function logBugToFalkorDB(bug) {
  if (!graph) await initBAM();

  const timestamp = Date.now();
  const bugId = `bug_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

  await graph.query(
    `
    CREATE (b:Bug {
      id: $bugId,
      type: $type,
      severity: $severity,
      file: $file,
      pattern: $pattern,
      line: $line,
      timestamp: $timestamp,
      suggestion: $suggestion
    })
  `,
    {
      params: {
        bugId,
        type: bug.type,
        severity: bug.severity,
        file: bug.file,
        pattern: bug.pattern,
        line: bug.line || 0,
        timestamp,
        suggestion: bug.suggestion || "",
      },
    },
  );

  console.log(`💥 BAM: Logged ${bug.type} in ${bug.file}:${bug.line}`);
  return bugId;
}

async function analyzeBugPatterns() {
  if (!graph) await initBAM();

  const result = await graph.query(`
    MATCH (b:Bug)
    RETURN b.type as type, COUNT(b) as count, AVG(b.line) as avgLine
    ORDER BY count DESC
  `);

  console.log("\n📊 Bug Pattern Analysis:");

  // FalkorDB returns ResultSet, need to iterate properly
  if (result && result.data) {
    for (const row of result.data) {
      const type = row[0] || "UNKNOWN";
      const count = row[1] || 0;
      const avgLine = row[2] || 0;
      console.log(
        `   ${type}: ${count} occurrences (avg line: ${Math.round(avgLine)})`,
      );
    }
  } else {
    console.log("   No bugs found in database");
  }

  return result;
}

async function scanFile(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  const bugs = await detectBugs(filePath, code);

  for (const bug of bugs) {
    await logBugToFalkorDB(bug);
  }

  return bugs;
}

async function scanDirectory(
  dirPath,
  extensions = [".js", ".ts", ".jsx", ".tsx"],
) {
  const files = [];

  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.startsWith(".") &&
        item !== "node_modules"
      ) {
        walk(fullPath);
      } else if (
        stat.isFile() &&
        extensions.some((ext) => item.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
  }

  walk(dirPath);

  let totalBugs = 0;
  for (const file of files) {
    const bugs = await scanFile(file);
    totalBugs += bugs.length;
  }

  console.log(
    `\n🎯 Scanned ${files.length} files, found ${totalBugs} potential issues`,
  );
  return totalBugs;
}

async function closeBAM() {
  if (db) {
    await db.close();
    db = null;
    graph = null;
    console.log("👋 BAM closed");
  }
}

export {
  initBAM,
  detectBugs,
  logBugToFalkorDB,
  analyzeBugPatterns,
  scanFile,
  scanDirectory,
  closeBAM,
};

import { FalkorDB } from "falkordb";

let db = null;
let graph = null;

export async function initTracker() {
  if (graph) return;

  try {
    db = await FalkorDB.connect({
      socket: {
        host: "localhost",
        port: 6380,
      },
    });
    graph = db.selectGraph("porffor_closure_project");
    console.log("✅ FalkorDB tracker initialized");
  } catch (err) {
    console.warn("⚠️  FalkorDB not available, tracking disabled:", err.message);
  }
}

export async function logTask(taskId, name, status, file) {
  if (!graph) return;

  try {
    await graph.query(
      `
      MERGE (task:Task {id: $taskId})
      SET task.name = $name,
          task.status = $status,
          task.file = $file,
          task.timestamp = timestamp()
    `,
      {
        params: { taskId, name, status, file },
      },
    );
    console.log(`📝 Task logged: ${name} [${status}]`);
  } catch (err) {
    console.warn("⚠️  Failed to log task:", err.message);
  }
}

export async function logCodeChange(taskId, file, lineStart, lineEnd, diff) {
  if (!graph) return;

  try {
    await graph.query(
      `
      MATCH (task:Task {id: $taskId})
      CREATE (change:CodeChange {
        file: $file,
        lineStart: $lineStart,
        lineEnd: $lineEnd,
        diff: $diff,
        timestamp: timestamp()
      })
      CREATE (task)-[:APPLIED]->(change)
    `,
      {
        params: { taskId, file, lineStart, lineEnd, diff },
      },
    );
    console.log(`🔧 Code change logged: ${file}:${lineStart}-${lineEnd}`);
  } catch (err) {
    console.warn("⚠️  Failed to log code change:", err.message);
  }
}

export async function logTest(taskId, testName, passed, error = null) {
  if (!graph) return;

  try {
    await graph.query(
      `
      MATCH (task:Task {id: $taskId})
      CREATE (test:TestRun {
        name: $testName,
        passed: $passed,
        error: $error,
        timestamp: timestamp()
      })
      CREATE (task)-[:TESTED_BY]->(test)
    `,
      {
        params: { taskId, testName, passed, error },
      },
    );
    const icon = passed ? "✅" : "❌";
    console.log(
      `${icon} Test logged: ${testName} - ${passed ? "PASSED" : "FAILED"}`,
    );
  } catch (err) {
    console.warn("⚠️  Failed to log test:", err.message);
  }
}

export async function getCurrentBlocker() {
  if (!graph) return null;

  try {
    const result = await graph.query(`
      MATCH (task:Task {status: 'in_progress'})-[:TESTED_BY]->(test:TestRun {passed: false})
      RETURN task.name as taskName, test.error as error
      ORDER BY test.timestamp DESC
      LIMIT 1
    `);

    if (result.length > 0) {
      const blocker = result[0];
      console.log(`🔴 Current blocker: ${blocker.taskName} - ${blocker.error}`);
      return blocker;
    }
    return null;
  } catch (err) {
    console.warn("⚠️  Failed to get blocker:", err.message);
    return null;
  }
}

export async function generatePRDescription() {
  if (!graph) return "FalkorDB tracking not available";

  try {
    const tasks = await graph.query(`
      MATCH (task:Task)
      OPTIONAL MATCH (task)-[:APPLIED]->(change:CodeChange)
      OPTIONAL MATCH (task)-[:TESTED_BY]->(test:TestRun)
      RETURN task.name as taskName,
             task.status as status,
             COUNT(DISTINCT change) as changesCount,
             SUM(CASE WHEN test.passed THEN 1 ELSE 0 END) as passedTests,
             COUNT(test) as totalTests
      ORDER BY task.timestamp
    `);

    let description = "# Closure Implementation for Porffor\n\n";
    description += "## Tasks Completed\n\n";

    for (const task of tasks) {
      const icon =
        task.status === "completed"
          ? "✅"
          : task.status === "in_progress"
            ? "🔄"
            : "⏳";
      description += `${icon} **${task.taskName}**\n`;
      description += `- Files changed: ${task.changesCount}\n`;
      description += `- Tests: ${task.passedTests}/${task.totalTests} passed\n\n`;
    }

    return description;
  } catch (err) {
    console.warn("⚠️  Failed to generate PR description:", err.message);
    return "Error generating PR description";
  }
}

export async function closeTracker() {
  if (db) {
    await db.close();
    db = null;
    graph = null;
    console.log("👋 FalkorDB tracker closed");
  }
}

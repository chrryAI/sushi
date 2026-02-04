import { initTracker, logTask, logTest, getCurrentBlocker, closeTracker } from './compiler/tracker.js';

async function main() {
  await initTracker();
  
  // Log initial task
  await logTask('task-1-review', 'Review Jules Session', 'in_progress', 'multiple');
  
  // Log test failure
  await logTest('task-1-review', 'test_closure_basic.js', false, 'ReferenceError: x is not defined');
  
  // Get current blocker
  await getCurrentBlocker();
  
  await closeTracker();
}

main().catch(console.error);

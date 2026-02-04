import { initTracker, logTask, logCodeChange, logTest, closeTracker } from './compiler/tracker.js';

async function main() {
  await initTracker();
  
  // Log semantic analysis completion
  await logTask('task-1-semantic', 'Add captured variable tracking to semantic.js', 'completed', 'compiler/semantic.js');
  
  await logCodeChange(
    'task-1-semantic',
    'compiler/semantic.js',
    137,
    189,
    'Added capture detection: tracks when inner functions use parent scope variables'
  );
  
  console.log('✅ Task 1 completed: Semantic analysis now detects captured variables');
  console.log('📊 Result: makeAdder._captured = Set { "x" }');
  
  // Start next task
  await logTask('task-2-codegen', 'Implement context struct allocation in codegen.js', 'in_progress', 'compiler/codegen.js');
  
  console.log('\n📋 Next: Implement context struct allocation in Wasm memory');
  console.log('💡 This will create a heap structure to store captured variables');
  
  await closeTracker();
}

main().catch(console.error);

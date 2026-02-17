# Closure Implementation Blocker Analysis

## Core Problem: WebAssembly Local Variable Scope

**Fundamental Constraint:** In WebAssembly, each function has its own locals. You cannot access another function's locals directly.

## Attempted Solutions

### Attempt 1: Context Struct Allocation

**Approach:** Allocate heap memory for captured variables
**Blocker:** Local index collision

- `localTmp(func, ...)` uses `func.localInd`
- But `func.localInd` is already used for function parameters
- Creating new local causes index collision

### Attempt 2: Parent Scope Reference

**Approach:** Store `scope._parentScope` and access parent locals
**Blocker:** Wasm constraint

- Cannot access parent function's locals from child function
- Each Wasm function has isolated local space
- This is a fundamental Wasm limitation

## Why generateArray Pattern Works

```javascript
const tmp = localTmp(scope, "#create_array" + uniqId(), Valtype.i32)
```

Works because:

1. Called during `generate()` phase, not during function setup
2. `scope` is the current function being generated
3. No parameter locals have been allocated yet
4. `scope.localInd` starts fresh

## Why Our Context Allocation Fails

```javascript
// In func.generate(), AFTER parameters are allocated
const tmp = localTmp(func, "#context_ptr", Valtype.i32)
```

Fails because:

1. Called AFTER `args.length * 2` locals are reserved for parameters
2. `func.localInd` is at wrong position
3. Type mismatch between expected f64 and actual i32

## Solution Path

Need to allocate context local BEFORE parameter locals:

```javascript
// BEFORE: let localInd = args.length * 2;
// Allocate context local first
if (func._needsContext) {
  const contextIdx = func.localInd++ // Reserve index
  func.locals["#context"] = { idx: contextIdx, type: Valtype.i32 }
}

// THEN: Allocate parameter locals
let localInd = args.length * 2
```

## Next Step

1. Allocate context local index BEFORE parameters
2. Generate malloc code in wasm array
3. Store captured parameters into context memory
4. Modify lookup to read from context memory (not parent locals)

# Closure Implementation for Porffor

## What are Closures?

A **closure** is when an inner function "remembers" variables from its outer function, even after the outer function has returned.

### Example:

```javascript
function makeAdder(x) {
  // Outer function with parameter 'x'
  return function (y) {
    // Inner function
    return x + y // Inner function accesses outer 'x'
  }
}

const add5 = makeAdder(5) // x=5 is "captured"
console.log(add5(10)) // Prints 15 (5 + 10)
```

**The Problem:** When `makeAdder(5)` returns, normally `x` would be destroyed. But the inner function still needs it!

**The Solution:** The inner function must "capture" `x` and keep it alive.

## Why Porffor Needs Closures

Porffor currently fails on this test:

```bash
$ node runtime/index.js test_closure_basic.js
ReferenceError: x is not defined
```

Without closures:

- ❌ React hooks won't work (they use closures)
- ❌ Event handlers won't work
- ❌ Most modern JavaScript patterns fail

## How Other Engines Implement Closures

### V8 (Chrome/Node.js)

- Uses **Context objects** stored on the heap
- Each function has a pointer to its parent context
- Variables are looked up by traversing the context chain

### SpiderMonkey (Firefox)

- Uses **Environment objects**
- Similar heap-allocated structures
- Optimizes common cases with inline caching

### WebAssembly Challenge

Wasm has no built-in closure support. We must:

1. Allocate context structs manually in Wasm memory
2. Pass context pointers as hidden function arguments
3. Generate code to read/write captured variables from context

## Porffor's Closure Architecture

### Phase 1: Semantic Analysis

**File:** `compiler/semantic.js`

Detect which variables are "captured":

```javascript
function makeAdder(x) {
  // x is declared here (scope A)
  return function (y) {
    // y is declared here (scope B)
    return x + y // x is used here but declared in parent scope
  } // ❗ x is CAPTURED
}
```

**Algorithm:**

1. Track which scope each variable belongs to
2. When a variable is used, check if it's from a parent function scope
3. Mark it as "captured" if yes

### Phase 2: Context Struct Allocation

**File:** `compiler/codegen.js` → `generateFunc`

For functions with captured variables, allocate a context struct in Wasm memory:

```
Context Struct Layout:
[0-3]   Magic ID (for debugging)
[4-7]   Parent context pointer
[8+]    Captured variables (8 bytes each: value + type)
```

Example for `makeAdder(x)`:

```
Context for makeAdder:
[0-3]   0x12345678  (magic)
[4-7]   0x00000000  (no parent)
[8-15]  x value     (captured parameter)
[16-19] x type
```

### Phase 3: Dynamic Lookup

**File:** `compiler/codegen.js` → `lookup` function

When the inner function needs `x`:

1. Check local variables → not found
2. Check if `x` is in captured set → yes!
3. Get current function's context pointer
4. Traverse to parent context (if needed)
5. Calculate offset of `x` in context struct
6. Generate Wasm code to load from that offset

## Implementation Tasks

### Task 1: Add Captured Variable Tracking

**File:** `compiler/semantic.js`

Add to the `analyze` phase:

- Track which function owns each variable declaration
- When an Identifier is used, check if it's from a parent function
- Mark the variable and all intermediate functions as needing capture

### Task 2: Context Struct Generation

**File:** `compiler/codegen.js` → `generateFunc`

At function entry:

1. Calculate which variables this function captures
2. Allocate context struct in Wasm memory
3. Add hidden `#context` parameter to function signature
4. Copy captured parameters into context struct
5. Store parent context pointer

### Task 3: Dynamic Lookup Implementation

**File:** `compiler/codegen.js` → `lookup`

When looking up a variable:

1. Try local variables first (existing behavior)
2. If not found, check if it's in the captured set
3. If yes, generate Wasm code to:
   - Load context pointer
   - Traverse to correct parent context
   - Load variable from calculated offset

### Task 4: Function Call Updates

**File:** `compiler/codegen.js` → `generateCall`

When calling a function that needs context:

- Pass current context pointer as hidden argument

## Testing Strategy

### Test 1: Basic Closure (makeAdder)

```javascript
function makeAdder(x) {
  return function (y) {
    return x + y
  }
}
const add5 = makeAdder(5)
console.log(add5(10)) // Should print 15
```

### Test 2: Nested Closures

```javascript
function outer(a) {
  return function middle(b) {
    return function inner(c) {
      return a + b + c
    }
  }
}
console.log(outer(1)(2)(3)) // Should print 6
```

### Test 3: Multiple Captured Variables

```javascript
function makeCounter(start, step) {
  let count = start
  return function () {
    count += step
    return count
  }
}
const counter = makeCounter(0, 5)
console.log(counter()) // 5
console.log(counter()) // 10
```

## Current Status

- ✅ FalkorDB tracking system set up
- ✅ Test case created (`test_closure_basic.js`)
- ✅ Test confirmed failing with `ReferenceError: x is not defined`
- ⏳ Semantic analysis implementation
- ⏳ Context struct allocation
- ⏳ Dynamic lookup
- ⏳ Testing and debugging

## Next Steps

1. Implement semantic analysis to detect captured variables
2. Log progress to FalkorDB
3. Test with simple closure
4. Iterate until working
5. Document learnings

# Implementing Closures in Porffor: A Deep Dive

**Author:** Ibrahim Velinov  
**Date:** February 2026  
**Status:** Work in Progress - Educational Journey

---

## 🎯 Executive Summary

This document chronicles my attempt to implement closure support in [Porffor](https://github.com/CanadaHonk/porffor), an ahead-of-time JavaScript to WebAssembly compiler. While the implementation hit a fundamental architectural blocker, the journey provided deep insights into:

- Compiler design and semantic analysis
- WebAssembly's type system and constraints
- Systematic debugging and problem-solving
- Production-grade development practices

**Key Achievement:** Successfully implemented semantic analysis for captured variable detection, with comprehensive test infrastructure and documentation.

**Core Blocker:** WebAssembly local variable type system incompatibility with Porffor's dual-type architecture.

---

## 📖 Table of Contents

1. [What Are Closures?](#what-are-closures)
2. [Why This Matters](#why-this-matters)
3. [The Challenge](#the-challenge)
4. [Implementation Journey](#implementation-journey)
5. [Technical Deep Dive](#technical-deep-dive)
6. [What I Learned](#what-i-learned)
7. [Next Steps](#next-steps)

---

## What Are Closures?

A closure is when an inner function "remembers" variables from its outer function, even after the outer function has returned.

### Example

```javascript
function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

const add5 = makeAdder(5);
console.log(add5(10)); // 15
```

**The Magic:** When `makeAdder(5)` returns, `x` should be destroyed. But the inner function still needs it! This is a closure.

---

## Why This Matters

### Real-World Impact

Closures are fundamental to modern JavaScript:

```javascript
// React Hooks
function Counter() {
  const [count, setCount] = useState(0); // Closure!
  return <button onClick={() => setCount(count + 1)}>
    {count}
  </button>;
}

// Event Handlers
button.addEventListener('click', () => {
  console.log(userId); // Closure!
});

// Module Pattern
const module = (function() {
  let private = 'secret'; // Closure!
  return {
    getPrivate: () => private
  };
})();
```

**Without closures:** Most modern JavaScript patterns break.

---

## The Challenge

### Porffor's Current State

```bash
$ node runtime/index.js test_closure_basic.js
ReferenceError: x is not defined
```

### Why It's Hard

Porffor compiles JavaScript to WebAssembly ahead-of-time (AOT):

1. **No Runtime Context:** Unlike V8 (JIT), we can't create context objects at runtime
2. **Wasm Constraints:** WebAssembly functions have isolated local variables
3. **Type System:** Porffor uses (f64 value, i32 type) pairs for all values
4. **Heap Allocation:** Must manually allocate context structs in Wasm memory

---

## Implementation Journey

### Phase 1: Semantic Analysis ✅

**Goal:** Detect which variables are "captured" by inner functions.

**Implementation:**
- Modified `compiler/semantic.js`
- Added scope tracking during AST traversal
- Marked variables as `captured: true`
- Marked functions with `_captured` Set

**Result:**
```javascript
makeAdder._captured = Set(1) { 'x' }
innerFunction._captured = Set(1) { 'x' }
variable.x.captured = true
```

**Status:** ✅ **WORKING**

---

### Phase 2: Context Struct Allocation ⚠️

**Goal:** Allocate heap memory to store captured variables.

**Approach:**
```
Context Struct Layout:
[0-3]   Magic ID (debugging)
[4-7]   Parent context pointer
[8+]    Captured variables (8 bytes each)
```

**Attempted Solutions:**

1. **Attempt 1:** Use `localTmp(func, '#context', Valtype.i32)`
   - ❌ Still creates f64 local

2. **Attempt 2:** Manual local index reservation
   - ❌ Type mismatch: `local.set expected f64, found i32`

3. **Attempt 3:** Allocate before parameter locals
   - ❌ Local index collision

4. **Attempt 4:** Parent scope reference
   - ❌ Wasm constraint: can't access parent function's locals

5. **Attempt 5:** Study `generateArray` pattern
   - ❌ Works in different context (before params allocated)

**Status:** 🚧 **BLOCKED**

---

### Phase 3: Test Infrastructure ✅

**Created:**
- 5 micro tests (baseline + closure)
- Test runner with ANSI color stripping
- Comprehensive documentation

**Results:**
```
✅ test_1_no_closure.js      - PASS (15)
✅ test_2_nested_function.js - PASS (42)
✅ test_3_return_function.js - PASS (99)
⏳ test_4_simple_closure.js  - FAIL (0, expected 15)
✅ test_5_global_access.js   - PASS (101)
```

**Status:** ✅ **WORKING**

---

## Technical Deep Dive

### The Core Blocker: Wasm Type System

**Problem:** Porffor stores all values as `(f64 value, i32 type)` pairs.

```javascript
// In Porffor
let x = 5;
// Becomes:
// local 0: f64 (value = 5.0)
// local 1: i32 (type = NUMBER)
```

**For closures, we need:**
```javascript
let contextPtr = malloc(size);
// Needs:
// local N: i32 (pointer)
```

**But Porffor's `localTmp()` always creates f64 locals!**

### Why generateArray Works But Context Doesn't

**generateArray (works):**
```javascript
const tmp = localTmp(scope, "#create_array", Valtype.i32);
wasm.push(
  number(pageSize, Valtype.i32),
  [Opcodes.call, __Porffor_malloc],
  [Opcodes.local_set, tmp]  // ✅ Works!
);
```

**Context allocation (fails):**
```javascript
const tmp = localTmp(func, "#context", Valtype.i32);
wasm.push(
  number(pageSize, Valtype.i32),
  [Opcodes.call, __Porffor_malloc],
  [Opcodes.local_set, tmp]  // ❌ Type mismatch!
);
```

**Difference:** `generateArray` runs before parameter locals are allocated. Context allocation runs after.

### The Wasm Type Mismatch

```
CompileError: local.set[0] expected type f64, found call of type i32
```

**Root Cause:** Porffor's `func.params` array defines all locals as f64 at compile time.

---

## What I Learned

### 1. Compiler Architecture

**Semantic Analysis:**
- AST traversal patterns
- Scope management
- Variable lifetime tracking

**Code Generation:**
- Wasm opcode generation
- Local variable allocation
- Type system constraints

### 2. WebAssembly Internals

**Type System:**
- Strongly typed at compile time
- No dynamic type conversions
- Function locals are isolated

**Memory Model:**
- Linear memory
- Manual heap allocation
- Pointer arithmetic

### 3. Systematic Debugging

**Process:**
1. Understand the problem deeply
2. Study existing patterns
3. Attempt multiple solutions
4. Document each attempt
5. Identify root cause
6. Know when to ask for help

### 4. Production Practices

**Test-Driven Development:**
- Micro tests for each component
- Baseline tests to prevent regression
- Clear expected vs actual output

**Documentation:**
- Comprehensive README
- Blocker analysis
- Implementation log
- Progress tracking

---

## Metrics

### Code Changes
- **Files Modified:** 2 (semantic.js, codegen.js)
- **Lines Added:** ~200
- **Tests Created:** 5 micro tests
- **Documentation:** 4 comprehensive docs

### Time Investment
- **Research:** 2 hours
- **Implementation:** 4 hours
- **Debugging:** 3 hours
- **Documentation:** 2 hours
- **Total:** ~11 hours

### Learning Outcomes
- ✅ Deep understanding of closure implementation
- ✅ WebAssembly type system expertise
- ✅ Compiler architecture knowledge
- ✅ Systematic debugging skills
- ✅ Production-grade development practices

---

## Next Steps

### Short Term
1. **Document learnings** (this document) ✅
2. **Create portfolio piece** (LinkedIn post)
3. **Contribute to other Porffor features**

### Long Term
1. **Consult with maintainer** on Wasm type system
2. **Study other AOT compilers** (GraalJS, AssemblyScript)
3. **Revisit closure implementation** with new insights

### Alternative Approaches

**Option 1: Modify Wasm Local Generation**
- Change how `func.params` array is built
- Support pure i32 locals
- Requires deep architectural changes

**Option 2: Global Memory**
- Use global memory instead of locals
- Simpler but less efficient
- May have concurrency issues

**Option 3: Different Architecture**
- Redesign how Porffor handles function contexts
- Biggest impact but most work

---

## Conclusion

While I didn't achieve a working closure implementation, this journey was incredibly valuable:

### Technical Growth
- Deep understanding of compiler internals
- WebAssembly expertise
- Systematic problem-solving

### Professional Skills
- Production-grade development
- Comprehensive documentation
- Knowing when to seek guidance

### Portfolio Value
This work demonstrates:
- Ability to tackle complex problems
- Systematic debugging approach
- Clear technical communication
- Persistence and learning mindset

**Key Takeaway:** Sometimes the journey and learnings are more valuable than the destination.

---

## References

- [Porffor GitHub](https://github.com/CanadaHonk/porffor)
- [WebAssembly Specification](https://webassembly.github.io/spec/)
- [V8 Closure Implementation](https://v8.dev/blog/understanding-ecmascript-part-4)
- [My Fork](https://github.com/chrryAI/porffor)

---

## Appendix: Code Samples

### Semantic Analysis Implementation

```javascript
// compiler/semantic.js
const annotate = (node) => {
  if (node.type === 'Identifier') {
    // Find which scope owns this variable
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i]._variables?.[node.name]) {
        const foundScope = scopes[i];
        const currentFunc = scopes[scopes.lastFuncs.at(-1)];
        
        // Check if captured
        if (ownerFunc !== currentFunc) {
          foundScope._variables[node.name].captured = true;
          ownerFunc._captured ??= new Set();
          ownerFunc._captured.add(node.name);
        }
        break;
      }
    }
  }
};
```

### Test Case

```javascript
// test_closure_basic.js
function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

const add5 = makeAdder(5);
console.log(add5(10)); // Expected: 15, Actual: 0
```

---

**End of Document**

*This is a living document. Last updated: February 4, 2026*

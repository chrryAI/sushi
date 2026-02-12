# 🐕 Porffor Dogfooding Vision

**Goal**: Use Porffor to compile itself and the BAM+STRIKE+Memory test infrastructure, then integrate into Chrry AI monorepo.

## The Vision

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: Current State (Node.js Runtime)              │
│  ├─ Porffor compiler (Node.js)                         │
│  ├─ BAM/STRIKE/Memory (Node.js + FalkorDB)             │
│  └─ Test suite (Node.js)                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 2: Dogfooding (Porffor compiles itself)         │
│  ├─ Porffor compiler → WASM (via Porffor!)             │
│  ├─ BAM/STRIKE/Memory → WASM (via Porffor!)            │
│  └─ Test suite → WASM (via Porffor!)                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 3: Monorepo Integration (Chrry AI)              │
│  ├─ @chrryai/porffor (WASM compiler)                   │
│  ├─ @chrryai/bam (WASM bug detection)                  │
│  ├─ @chrryai/strike (WASM mutation testing)            │
│  ├─ @chrryai/memory (WASM learning system)             │
│  └─ @chrryai/spatial-agents (WASM multi-agent)         │
└─────────────────────────────────────────────────────────┘
```

## Why This Matters

### 1. **Ultimate Validation**

- If Porffor can compile itself → proves compiler works
- If Porffor can compile complex Node.js code → proves production-ready
- Dogfooding = best way to find bugs

### 2. **Performance Gains**

- WASM is **faster** than Node.js for CPU-intensive tasks
- BAM scanning → WASM = blazing fast
- STRIKE mutation testing → WASM = parallel execution
- Memory learning → WASM = efficient graph processing

### 3. **Portability**

- WASM runs **everywhere**: browser, Node, Deno, Bun, edge
- Single binary for all platforms
- No Node.js dependency

### 4. **Monorepo Integration**

- Chrry AI monorepo gets enterprise testing tools
- All compiled to WASM
- Universal across all Chrry apps

## Current Porffor Capabilities

### ✅ What Works

- Basic JS/TS compilation
- Functions, loops, conditionals
- Arrays, objects (limited)
- Async/await (with bugs)
- Native binary output (via 2c)
- Test262: ~48% pass rate

### ❌ Current Blockers

1. **No variables between scopes** (except args/globals)
   - Closure implementation blocked (we know this!)
   - BAM/STRIKE/Memory use closures heavily
2. **Limited async support**
   - FalkorDB is async
   - Promise bugs exist
3. **No `eval()`/`Function()`**
   - Not needed for our use case
4. **Limited stdlib**
   - Need fs, path, etc. for BAM scanning

## Dogfooding Roadmap

### Phase 1: Fix Closure Support (CRITICAL)

**Blocker**: Porffor can't compile code with closures

**Current Status**:

- Semantic analysis ✅ (marks captured variables)
- Codegen blocked by WASM local type system

**Solution Path**:

1. Implement context struct allocation
2. Add hidden context pointer parameter
3. Fix lookup() to traverse context chain
4. Test with simple closure examples
5. Test with BAM/STRIKE/Memory

**Timeline**: 1-2 weeks (if we solve the WASM type issue)

### Phase 2: Async/Promise Fixes

**Blocker**: FalkorDB uses async/await

**Current Status**: Known bugs in Promise implementation

**Solution Path**:

1. Fix Promise bugs in Porffor
2. Test with FalkorDB client
3. Ensure async/await works reliably

**Timeline**: 1 week

### Phase 3: Stdlib Expansion

**Blocker**: Need fs, path for BAM scanning

**Solution Path**:

1. Add fs.readFileSync, fs.readdirSync
2. Add path.join, path.resolve
3. Test file system operations

**Timeline**: 3-5 days

### Phase 4: Self-Compilation Test

**Goal**: Compile Porffor with Porffor

**Steps**:

1. Start with simple compiler files
2. Gradually add more complex modules
3. Full compiler self-compilation
4. Benchmark performance

**Timeline**: 1 week

### Phase 5: BAM+STRIKE+Memory Compilation

**Goal**: Compile test infrastructure with Porffor

**Steps**:

1. Compile BAM (bug detection)
2. Compile STRIKE (mutation testing)
3. Compile MEMORY (learning system)
4. Compile Spatial Agents
5. Run full test suite in WASM

**Timeline**: 1 week

### Phase 6: Monorepo Integration

**Goal**: Package everything for Chrry AI monorepo

**Steps**:

1. Create @chrryai/porffor package
2. Create @chrryai/bam, @chrryai/strike, @chrryai/memory
3. Add to Chrry monorepo
4. Integrate with existing apps
5. Use in production

**Timeline**: 3-5 days

## Total Timeline: 6-8 Weeks

```
Week 1-2:  Fix closure support
Week 3:    Fix async/Promise
Week 4:    Expand stdlib (fs, path)
Week 5:    Self-compilation test
Week 6:    Compile BAM+STRIKE+Memory
Week 7-8:  Monorepo integration
```

## Benefits After Completion

### For Porffor

- ✅ Proves compiler maturity
- ✅ Dogfooding finds real bugs
- ✅ Portfolio showcase
- ✅ Attracts contributors

### For Chrry AI

- ✅ Enterprise testing tools (WASM)
- ✅ Blazing fast bug detection
- ✅ Portable across all platforms
- ✅ No Node.js dependency
- ✅ Runs in browser, edge, anywhere

### For Portfolio

- ✅ "Built a compiler that compiles itself"
- ✅ "Enterprise testing infrastructure in WASM"
- ✅ "Multi-agent systems compiled to WASM"
- ✅ "Production-grade dogfooding"

## Next Steps

### Immediate (This Week)

1. ✅ Complete PR review fixes
2. ✅ Merge BAM+STRIKE+Memory
3. 📝 Document closure blocker in detail
4. 🔍 Research WASM context allocation solutions

### Short-term (Next 2 Weeks)

1. 🔧 Fix closure support (critical path)
2. 🧪 Test with simple closures
3. 🧪 Test with BAM/STRIKE code

### Medium-term (Weeks 3-6)

1. 🔧 Fix async/Promise bugs
2. 📦 Expand stdlib (fs, path)
3. 🐕 Self-compilation test
4. 🧪 Compile test infrastructure

### Long-term (Weeks 7-8)

1. 📦 Package for monorepo
2. 🔗 Integrate with Chrry AI
3. 🚀 Production deployment

## Success Metrics

- [ ] Porffor compiles itself successfully
- [ ] BAM detects bugs in WASM
- [ ] STRIKE runs mutation tests in WASM
- [ ] Memory learns patterns in WASM
- [ ] Spatial agents coordinate in WASM
- [ ] 2x-10x performance improvement over Node.js
- [ ] Integrated into Chrry AI monorepo
- [ ] Used in production

## Risk Mitigation

### Risk 1: Closure Support Too Hard

**Mitigation**: Refactor BAM/STRIKE to avoid closures (use classes)

### Risk 2: Async/Promise Unfixable

**Mitigation**: Use sync FalkorDB operations or different DB

### Risk 3: Performance Not Better

**Mitigation**: Still valuable for portability and dogfooding

### Risk 4: Timeline Too Aggressive

**Mitigation**: Focus on Phase 1-3 first, defer monorepo integration

## Conclusion

This is a **game-changing vision** that:

1. Validates Porffor as production-ready
2. Creates blazing-fast enterprise testing tools
3. Enables universal deployment (WASM everywhere)
4. Showcases advanced compiler engineering

**The key blocker is closure support** - once we solve that, the rest is straightforward.

---

**Status**: Vision documented, awaiting closure fix to begin dogfooding journey.

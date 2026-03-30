# STRIKE Mutation Testing Examples

This directory contains examples demonstrating STRIKE mutation testing.

## Files

- `math-utils.js` - Simple math utilities with various operations
- `math-utils.test.js` - Test suite for the utilities

## Running Mutation Tests

```bash
# Navigate to the sushi package
cd packages/sushi

# Run mutation testing on the example
node cli/sushi.js strike examples/math-utils.js --test "node examples/math-utils.test.js"

# Show weak spots
node cli/sushi.js strike examples/math-utils.js --test "node examples/math-utils.test.js" --weak-spots
```

## Expected Results

STRIKE will generate mutations like:

- `+` → `-` (ADD_TO_SUB)
- `-` → `+` (SUB_TO_ADD)
- `*` → `/` (MUL_TO_DIV)
- `/` → `*` (DIV_TO_MUL)
- `>` → `<` (GT_TO_LT)
- `<` → `>` (LT_TO_GT)
- `===` → `!==` (EQ_TO_NEQ)

## Understanding the Score

- **80%+** - Excellent test coverage
- **50-80%** - Good, but can improve
- **<50%** - Needs more test cases

## Mutation Operators

STRIKE uses these mutation categories:

1. **Arithmetic** - `+`, `-`, `*`, `/`
2. **Comparison** - `===`, `!==`, `>`, `<`, `>=`, `<=`
3. **Logical** - `&&`, `||`, `!`
4. **Constant** - `true`/`false`, `0`/`1`
5. **Return** - Return value mutations

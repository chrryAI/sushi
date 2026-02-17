// Micro Test 2: Nested function without closure (no variable capture)
function outer() {
  function inner() {
    return 42
  }
  return inner()
}

console.log(outer())
// Expected: 42

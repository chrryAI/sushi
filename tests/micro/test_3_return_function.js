// Micro Test 3: Return a function (no variable capture yet)
function makeFunc() {
  function inner() {
    return 99
  }
  return inner
}

const fn = makeFunc()
console.log(fn())
// Expected: 99

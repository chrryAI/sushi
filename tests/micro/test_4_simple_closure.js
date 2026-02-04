// Micro Test 4: Simplest possible closure (single captured variable)
function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

const add5 = makeAdder(5);
console.log(add5(10));
// Expected: 15
// Current: 0 (x returns undefined)

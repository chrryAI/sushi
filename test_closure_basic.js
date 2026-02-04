// Basic closure test - makeAdder pattern
function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

const add5 = makeAdder(5);
const result = add5(10);

console.log(result); // Should print 15

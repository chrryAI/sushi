// Micro Test 5: Access global variable (should work - baseline)
const globalX = 100;

function useGlobal() {
  return globalX + 1;
}

console.log(useGlobal());
// Expected: 101

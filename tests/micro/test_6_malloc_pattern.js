// Micro Test 6: Test if we can use malloc pattern correctly
// This tests the underlying mechanism we'll use for context allocation

function testMalloc() {
  // This will internally use malloc for array allocation
  const arr = [1, 2, 3];
  return arr[0] + arr[1] + arr[2];
}

console.log(testMalloc());
// Expected: 6

const a = "alfa"
const b = "bravo"
const c = "charlie"
const d = "delta"
const e = "echo"

const t = performance.now()

for (let i = 0; i < 14000; i++) {
  const _ = a + b + c + d + e
  // console.log(Porffor.memorySize());
}

console.log(performance.now() - t)

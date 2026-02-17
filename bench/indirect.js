const run = (func) => {
  for (let i = 0; i < 10_000_000; i++) {
    // func(i);
    func(i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i)
  }
}

const zero = () => {}
const single = (a) => {}
const two = (a, b) => {}
const four = (a, b, c, d) => {}
const eight = (a, b, c, d, e, f, g, h) => {}
const sixteen = (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) => {}

console.log("argcount,direct,indirect")

const t17 = performance.now()
for (let i = 0; i < 10_000_000; i++) {
  // noop
}
const t18 = performance.now()
console.log(`-1,${(t18 - t17).toFixed(2)},0`)

const t21 = performance.now()
for (let i = 0; i < 10_000_000; i++) {
  zero()
}
const t22 = performance.now()

const t19 = performance.now()
run(zero)
const t20 = performance.now()
console.log(`0,${(t22 - t21).toFixed(2)},${(t20 - t19).toFixed(2)}`)

const t1 = performance.now()
for (let i = 0; i < 10_000_000; i++) {
  single(i)
}
const t2 = performance.now()

const t9 = performance.now()
run(single)
const t10 = performance.now()
console.log(`1,${(t2 - t1).toFixed(2)},${(t10 - t9).toFixed(2)}`)

const t3 = performance.now()
for (let i = 0; i < 10_000_000; i++) {
  two(i, i)
}
const t4 = performance.now()

const t11 = performance.now()
run(two)
const t12 = performance.now()
console.log(`2,${(t4 - t3).toFixed(2)},${(t12 - t11).toFixed(2)}`)

const t5 = performance.now()
for (let i = 0; i < 10_000_000; i++) {
  four(i, i, i, i)
}
const t6 = performance.now()

const t13 = performance.now()
run(four)
const t14 = performance.now()
console.log(`4,${(t6 - t5).toFixed(2)},${(t14 - t13).toFixed(2)}`)

const t7 = performance.now()
for (let i = 0; i < 10_000_000; i++) {
  eight(i, i, i, i, i, i, i, i)
}
const t8 = performance.now()

const t15 = performance.now()
run(eight)
const t16 = performance.now()
console.log(`8,${(t8 - t7).toFixed(2)},${(t16 - t15).toFixed(2)}`)

const t23 = performance.now()
for (let i = 0; i < 10_000_000; i++) {
  sixteen(i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i)
}
const t24 = performance.now()

const t25 = performance.now()
run(sixteen)
const t26 = performance.now()
console.log(`16,${(t24 - t23).toFixed(2)},${(t26 - t25).toFixed(2)}`)

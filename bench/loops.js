const data = new Array(5000).fill(0).map(() => Math.random())

const t1 = performance.now()
let _sum1 = 0
for (const x of data) {
  _sum1 += x
}
console.log("for..of", performance.now() - t1)

const t2 = performance.now()
let _sum2 = 0
for (let i = 0; i < data.length; i++) {
  _sum2 += data[i]
}
console.log("for (let i = 0; i < data.length; i++)", performance.now() - t2)

const t3 = performance.now()
let _sum3 = 0
const len = data.length
for (let i = 0; i < len; i++) {
  _sum3 += data[i]
}
console.log("for (let i = 0; i < len; i++)", performance.now() - t3)

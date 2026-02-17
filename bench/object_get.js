const obj = {}
obj.wow = 1337

const start = Date.now()
let _total = 0
for (let i = 0; i < 100_000_000; i++) {
  _total += obj.wow
}

console.log(Date.now() - start)

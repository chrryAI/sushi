const start = Date.now()
const _total = 0
for (let i = 0; i < 10_000_000; i++) {
  try {
    throw i
  } catch (_e) {}
}

console.log(Date.now() - start)

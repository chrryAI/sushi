import { register } from "node:module"
import { pathToFileURL } from "node:url"

// Register tsx loader
register("tsx/esm", pathToFileURL("./"))

// Add path alias resolution
const originalResolve = import.meta.resolve
import.meta.resolve = (specifier, parent) => {
  if (specifier.startsWith("chrry/")) {
    const subpath = specifier.slice(6) // Remove 'chrry/'
    return pathToFileURL(`../ui/${subpath}`).href
  }
  return originalResolve(specifier, parent)
}

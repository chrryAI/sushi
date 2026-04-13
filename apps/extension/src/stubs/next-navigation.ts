/**
 * Stub for next/navigation - extension doesn't use Next.js
 * These exports should never be called in the extension
 */

export const useRouter = () => {
  throw new Error(
    "next/navigation is not available in extension - use platform navigation",
  )
}

export const usePathname = () => {
  throw new Error(
    "next/navigation is not available in extension - use platform navigation",
  )
}

export const useSearchParams = () => {
  throw new Error(
    "next/navigation is not available in extension - use platform navigation",
  )
}

export const useParams = () => {
  throw new Error(
    "next/navigation is not available in extension - use platform navigation",
  )
}

export const useSelectedLayoutSegment = () => {
  throw new Error(
    "next/navigation is not available in extension - use platform navigation",
  )
}

export const useSelectedLayoutSegments = () => {
  throw new Error(
    "next/navigation is not available in extension - use platform navigation",
  )
}

export const redirect = () => {
  throw new Error(
    "next/navigation is not available in extension - use platform navigation",
  )
}

export const permanentRedirect = () => {
  throw new Error(
    "next/navigation is not available in extension - use platform navigation",
  )
}

export const notFound = () => {
  throw new Error(
    "next/navigation is not available in extension - use platform navigation",
  )
}

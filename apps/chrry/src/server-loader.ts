import {
  getApp,
  getSession,
  getTranslations,
  getTribePost,
  getTribePosts,
  getTribes,
  getUser,
} from "@chrryai/donut/lib"
import { type locale, locales } from "@chrryai/donut/locales"
import type {
  paginatedMessages,
  paginatedTribePosts,
  paginatedTribes,
  session,
  sushi,
  thread,
  tribe,
  tribePostWithDetails,
} from "@chrryai/donut/types"
import { API_INTERNAL_URL, getPostId, isE2E } from "@chrryai/donut/utils"
import { getSiteConfig } from "@chrryai/donut/utils/siteConfig"
import { excludedSlugRoutes } from "@chrryai/donut/utils/url"
import type { themeType } from "chrry/context/ThemeContext"
import { v4 as uuidv4, validate } from "uuid"
import {
  type BlogPost,
  type BlogPostWithContent,
  getBlogPost,
  getBlogPosts,
} from "./blog-loader"
import { captureException } from "./captureException"
import { generateServerMetadata } from "./server-metadata"

export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: "Strict" | "Lax" | "None"
  maxAge?: number
  path?: string
  domain?: string
}

export interface ServerRequest {
  url: string
  hostname: string
  pathname: string
  headers: Record<string, string | undefined>
  cookies: Record<string, string | undefined>
  ip?: string
  /** Framework-specific cookie setter injected by the caller (e.g. Hono handler) */
  setCookie?: (name: string, value: string, options: CookieOptions) => void
}

export interface ServerData {
  session?: session
  thread?: { thread: thread; messages: paginatedMessages }
  threads?: {
    threads: thread[]
    totalCount: number
  }
  isBot?: boolean
  testConfig: { [key: string]: string[] }
  apiKey?: string
  canShowAllTribe?: boolean
  accountApp?: sushi
  showTribe: boolean
  translations?: Record<string, any>
  app?: sushi
  siteConfig: ReturnType<typeof getSiteConfig>
  locale: locale
  deviceId: string
  viewPortWidth: string
  viewPortHeight: string
  chrryUrl: string
  isDev: boolean
  apiError?: Error
  theme: "light" | "dark"
  pathname: string
  metadata?: {
    title?: string
    description?: string
    keywords?: string[]
    openGraph?: any
    twitter?: any
    robots?: any
    alternates?: any
  }
  blogPosts?: BlogPost[]
  blogPost?: BlogPostWithContent
  isBlogRoute?: boolean
  tribes?: paginatedTribes
  tribePosts?: paginatedTribePosts
  tribePost?: tribePostWithDetails
  tribe?: tribe
  searchParams?: Record<string, string> & {
    get: (key: string) => string | null
    has: (key: string) => boolean
    toString: () => string
  }
}

export async function loadServerData(
  request: ServerRequest,
): Promise<ServerData> {
  const { hostname, headers, cookies, url } = request

  const isDev = process.env.NODE_ENV !== "production"

  const API_URL = API_INTERNAL_URL

  console.log("🔍 Host check:", {
    host: hostname,
    API_INTERNAL_URL: API_INTERNAL_URL,
    isE2E,
  })

  let TEST_FINGERPRINTS: string[] = []

  const pathname = (
    (request.pathname?.startsWith?.("/")
      ? request.pathname
      : `/${request.pathname}`) || "/"
  ).split("?")?.[0]

  const BOT_UA_PATTERN =
    /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|semrushbot|ahrefsbot|petalbot|mj12bot|dotbot|serpstatbot|rogerbot|exabot|sistrix|sogou|archive\.org_bot|ia_archiver|xbot|grok|gptbot|chatgpt-user|perplexitybot|claudebot/i
  const userAgent = headers["user-agent"] || ""
  const isBot = BOT_UA_PATTERN.test(userAgent)

  const isBlogList = pathname === "/blog"
  const isBlogPost = pathname.startsWith("/blog/") && pathname !== "/blog"

  const blogDataPromise = isBlogList
    ? getBlogPosts()
    : isBlogPost
      ? getBlogPost(pathname.replace("/blog/", ""))
      : Promise.resolve(null)

  const isLocalePathname =
    pathname && locales.includes(pathname.split("/")?.[1] as locale)

  const language = isLocalePathname
    ? (pathname.split("/")?.[1] as locale)
    : (cookies.locale as locale)

  const showTribe = cookies.showTribe === "true"
  const themeCookie = cookies.theme as themeType

  const acceptLanguage = headers["accept-language"]
  let browserLocale: locale = "en"

  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(",")
      .map((lang) => {
        const [code] = lang.trim().split(";")
        return code.split("-")[0].toLowerCase()
      })
      .filter((code) => locales.includes(code as locale))

    if (languages.length > 0) {
      browserLocale = languages[0] as locale
    }
  }

  const locale = (
    isLocalePathname
      ? pathname.split("/")?.[1] || browserLocale
      : language || browserLocale
  ) as locale

  const urlObj = new URL(url, `http://${hostname}`)

  let fpFromQuery: string | undefined
  if (url.includes("?")) {
    fpFromQuery = urlObj.searchParams.get("fp") || undefined
  }

  const deviceId = cookies.deviceId || headers["x-device-id"] || uuidv4()

  let testConfig: { [key: string]: string[] } = {}
  if (isE2E && process.env.NODE_ENV === "production") {
    try {
      const testConfigUrl = `${API_URL}/test-config?fp=${fpFromQuery}`
      const testConfigResponse = await fetch(testConfigUrl)
      if (testConfigResponse.ok) {
        testConfig = await testConfigResponse.json()
        TEST_FINGERPRINTS =
          (testConfig.TEST_FINGERPRINTS as unknown as string[]) || []
      }
    } catch (error) {
      console.error("Failed to fetch test config:", error)
    }
  }

  const isTestFP = TEST_FINGERPRINTS.includes(fpFromQuery || "")

  // OAuth token exchange moved to client-side (entry-client.tsx)
  // to avoid SSR cache/network issues
  const authCode = urlObj.searchParams.get("auth_token")

  const authToken: string | null = null
  const apiKey =
    (isTestFP && fpFromQuery ? fpFromQuery : "") || cookies.token || uuidv4()

  // Always persist fingerprint + token cookies for every flow:
  // - Guest mode: fingerprint IS the auth token, needs to survive page reloads
  // - Authenticated: token cookie locks in the session
  // // (auth code exchange already set these above for that specific flow, skip duplicate)
  // if (!authCode) {
  //   const cookieDomain = hostname.includes(".")
  //     ? hostname.split(".").slice(-2).join(".")
  //     : undefined
  //   const cookieOpts: CookieOptions = {
  //     httpOnly: false,
  //     secure: !isDev,
  //     sameSite: "None",
  //     maxAge: 60 * 60 * 24 * 365, // 1 year
  //     path: "/",
  //     domain: cookieDomain,
  //   }
  //   request.setCookie?.("fingerprint", apiKey, cookieOpts)
  //   request.setCookie?.("token", apiKey, cookieOpts)
  // }

  const gift = urlObj.searchParams.get("gift")
  const agentName = cookies.agentName
  const routeType = headers["x-route-type"]
  const viewPortWidth = cookies.viewPortWidth || ""
  const viewPortHeight = cookies.viewPortHeight || ""

  const clientIp =
    request.ip ||
    headers["x-forwarded-for"] ||
    headers["x-real-ip"] ||
    "0.0.0.0"

  let threads:
    | {
        threads: thread[]
        totalCount: number
      }
    | undefined

  const chrryUrl = getSiteConfig(hostname).url
  const tribeSlug = pathname?.startsWith("/t/")
    ? pathname.replace("/t/", "").split("?")[0]
    : undefined

  const siteConfig = getSiteConfig(hostname)

  let session: session | undefined
  let translations: Record<string, any> | undefined
  let app: sushi | undefined
  let apiError: Error | undefined

  let appId: string | undefined
  let isBlogRoute = false

  let blogPosts: BlogPost[] | undefined
  let blogPost: BlogPostWithContent | undefined

  let tribes: paginatedTribes | undefined
  let tribePosts: paginatedTribePosts | undefined
  let tribePost: tribePostWithDetails | undefined
  let tribe: tribe | undefined

  const searchParamsRecord: Record<string, string> = {}
  urlObj.searchParams.forEach((value, key) => {
    searchParamsRecord[key] = value
  })
  const searchParams = {
    ...searchParamsRecord,
    get: (key: string) => searchParamsRecord[key] ?? null,
    has: (key: string) => key in searchParamsRecord,
    toString: () => new URLSearchParams(searchParamsRecord).toString(),
  } as Record<string, string> & {
    get: (key: string) => string | null
    has: (key: string) => boolean
    toString: () => string
  }

  const pathnameWithoutLocale = isLocalePathname
    ? `/${pathname.split("/").slice(2).join("/")}`
    : pathname

  const canShowAllTribe =
    pathnameWithoutLocale === "/tribe" ||
    (siteConfig.isTribe &&
      (pathnameWithoutLocale === "/" || pathnameWithoutLocale === ""))

  try {
    const sessionResult = isBot
      ? await getSession({
          deviceId,
          token: apiKey,
          agentName,
          pathname,
          routeType,
          locale,
          chrryUrl,
          isBot,
          screenWidth: Number(viewPortWidth),
          screenHeight: Number(viewPortHeight),
          gift: gift || undefined,
          source: "layout",
          API_URL,
          ip: clientIp,
        })
      : undefined

    if (pathname === "/blog" || pathname.startsWith("/blog/")) {
      isBlogRoute = true

      try {
        const blogData = await blogDataPromise

        if (isBlogList) {
          blogPosts = blogData as BlogPost[] | undefined
        } else if (isBlogPost) {
          blogPost = (blogData as BlogPostWithContent | null) || undefined
        }
      } catch (error) {
        console.error("❌ Blog data fetch failed:", error)
      }
    }

    const postId = getPostId(pathname)

    let tribePostResult: tribePostWithDetails | undefined
    if (postId && isBot) {
      try {
        tribePostResult = await getTribePost({
          id: postId,
          token: apiKey,
          API_URL,
          language,
        })
      } catch (error) {
        console.error("❌ Tribe post fetch failed:", error)
        tribePostResult = undefined
      }
    }

    appId = tribePostResult?.appId || headers["x-app-id"]

    const appResult = isBot
      ? await getApp({
          chrryUrl,
          appId,
          token: apiKey,
          pathname,
          API_URL,
          postId,
        })
      : ({ id: appId } as sushi)

    const sortBy =
      (searchParams.get("sort") as "date" | "hot" | "liked") || "hot"

    const tags = searchParams.get("tags")
      ? searchParams.get("tags")!.split(",").filter(Boolean)
      : []

    const _slugParts = pathname.replace(/^\//, "").split("/")
    const _normalizedSlug =
      _slugParts.length > 1 && locales.includes(_slugParts[0] as locale)
        ? _slugParts[1]
        : _slugParts[0]

    const canShowTribeProfile =
      !tribeSlug &&
      !excludedSlugRoutes?.includes(_normalizedSlug) &&
      !canShowAllTribe

    const [translationsResult, tribesResult, tribePostsResult] =
      await Promise.all([
        getTranslations({
          token: apiKey,
          locale,
          API_URL,
        }),

        isBot && !isBlogRoute
          ? getTribes({
              pageSize: 15,
              page: 1,
              token: apiKey,
              // appId: canShowTribeProfile ? appResult.id : undefined,
              API_URL,
            })
          : Promise.resolve(undefined),
        isBot && !isBlogRoute
          ? getTribePosts({
              pageSize: 10,
              page: 1,
              token: apiKey,
              appId: canShowTribeProfile ? appResult.id : undefined,
              API_URL,
              sortBy,
              tags,
              language,
            })
          : Promise.resolve(undefined),
      ])

    translations = translationsResult

    session = sessionResult

    tribes = tribesResult
    tribePost = tribePostResult
    tribePosts = tribePostsResult

    tribe = tribes?.tribes.find((t) => t.slug === tribeSlug)
  } catch (error) {
    captureException(error)
    console.error("❌ API Error:", error)
    apiError = error as Error
  }

  const theme =
    themeCookie || (app?.backgroundColor === "#ffffff" ? "light" : "dark")

  const result = {
    session,
    translations,
    app,
    siteConfig,
    locale,
    deviceId,
    viewPortWidth,
    viewPortHeight,
    chrryUrl,
    isDev,
    apiError,
    theme: theme as themeType,
    blogPosts,
    blogPost,
    isBlogRoute,
    tribes,
    tribePosts,
    tribePost,
    testConfig,
    showTribe,
    tribe,
    // apiKey,
    canShowAllTribe,
    pathname,
    isBot,
  }
  let metadata
  try {
    metadata = await generateServerMetadata(pathname, hostname, locale, result)
  } catch (error) {
    console.error("Error generating metadata in server-loader:", error)
  }

  return {
    ...result,
    metadata,
    searchParams,
  }
}

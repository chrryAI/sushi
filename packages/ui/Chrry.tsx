"use client"
import "./styles.scss"

// Only import styles on web platforms (not React Native)
// React Native will skip these imports during bundling
if (typeof window !== "undefined") {
  try {
    require("./styles.scss")
    // require("./globals.css")
    require("./styles/view-transitions.css")
  } catch (_e) {
    // React Native will throw here, which is fine
  }
}

import type React from "react"
import AppProviders from "./context/providers"
import type { locale } from "./locales"
import type {
  paginatedMessages,
  paginatedTribePosts,
  paginatedTribes,
  session,
  sushi,
  thread,
  tribePostWithDetails,
} from "./types"
import type { getSiteConfig } from "./utils/siteConfig"

export default function Chrry({
  children,
  session,
  thread,
  viewPortWidth,
  viewPortHeight,
  onSetLanguage,
  apiKey,
  locale,
  translations,
  useExtensionIcon,
  threads,
  app,
  pathname,
  siteConfig,
  searchParams,
  accountApp,
  tribes,
  tribePosts,
  testConfig,
  deviceId,
  tribePost,
  isBot,
  theme,
  donut,
}: {
  translations?: Record<string, any>
  useExtensionIcon?: (slug?: string) => void
  locale?: locale
  thread?: { thread: thread; messages: paginatedMessages }
  apiKey?: string
  children?: React.ReactNode
  session?: session
  app?: sushi
  viewPortWidth?: string
  viewPortHeight?: string
  accountApp?: sushi
  siteConfig?: ReturnType<typeof getSiteConfig>
  searchParams?: Record<string, string> & {
    get: (key: string) => string | null
    has: (key: string) => boolean
    toString: () => string
  } // URL search params with URLSearchParams-compatible API
  pathname?: string // SSR pathname for thread ID extraction
  threads?: {
    threads: thread[]
    totalCount: number
  }
  deviceId?: string
  donut?: boolean
  isBot?: boolean
  theme?: "light" | "dark"
  testConfig?: { [key: string]: string[] }
  tribes?: paginatedTribes
  tribePosts?: paginatedTribePosts
  tribePost?: tribePostWithDetails
  onSetLanguage?: (pathWithoutLocale: string, language: locale) => void
}) {
  return (
    <AppProviders
      useExtensionIcon={useExtensionIcon}
      locale={locale}
      donut={donut}
      accountApp={accountApp}
      siteConfig={siteConfig}
      session={session}
      app={app}
      viewPortWidth={donut ? "500px" : viewPortWidth}
      viewPortHeight={donut ? "700px" : viewPortHeight}
      pathname={pathname}
      onSetLanguage={onSetLanguage}
      apiKey={apiKey}
      deviceId={deviceId}
      thread={thread}
      testConfig={testConfig}
      translations={translations}
      threads={threads}
      searchParams={searchParams}
      tribes={tribes}
      tribePosts={tribePosts}
      tribePost={tribePost}
      theme={theme}
      isBot={isBot}
    >
      {children}
    </AppProviders>
  )
}

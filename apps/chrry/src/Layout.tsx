import type { locale } from "@chrryai/donut/locales"
import { getSiteConfig } from "@chrryai/donut/utils/siteConfig"
import type { ReactNode } from "react"

interface LayoutProps {
  children: ReactNode
  locale?: locale
  theme?: "light" | "dark"
  appName?: string
  isDev?: boolean
  pathname?: string
}

export default function Layout({
  children,
  locale = "en",
  theme = "dark",
  appName = "Chrry",
  isDev = true,
  pathname = "/",
}: LayoutProps) {
  const siteConfig = getSiteConfig()
  const classnames = [theme].filter(Boolean).join(" ")

  return (
    <>
      {/*
        Metadata is already server-rendered in index.html by server.js
        No need for client-side Helmet or API calls
      */}

      {/* Main content */}
      <div className={classnames} data-chrry-url={siteConfig.url}>
        ssssss
        {children}
      </div>
    </>
  )
}

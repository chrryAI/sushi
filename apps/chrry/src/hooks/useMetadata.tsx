import type { locale } from "@chrryai/donut/locales"
import { useEffect, useState } from "react"
import { Helmet } from "react-helmet-async"

interface MetadataResponse {
  title?: string
  description?: string
  keywords?: string[]
  openGraph?: {
    title?: string
    description?: string
    url?: string
    siteName?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
    }>
    locale?: string
    type?: string
  }
  twitter?: {
    title?: string
    description?: string
    card?: string
    site?: string
    creator?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
    }>
  }
  robots?: {
    index?: boolean
    follow?: boolean
  }
  alternates?: {
    canonical?: string
    languages?: Record<string, string>
  }
}

interface UseMetadataOptions {
  pathname: string
  locale?: locale
  hostname?: string
  apiUrl?: string
}

export function useMetadata({
  pathname,
  locale = "en",
  hostname,
  apiUrl = import.meta.env.VITE_API_URL || "/api",
}: UseMetadataOptions) {
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          pathname,
          locale,
          ...(hostname && { hostname }),
        })

        const response = await fetch(`${apiUrl}/metadata?${params}`)
        if (!response.ok) {
          throw new Error("Failed to fetch metadata")
        }

        const data = await response.json()
        setMetadata(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
        // Set default metadata on error
        setMetadata({
          title: "Chrry - Your personal AI assistant",
          description:
            "Chat with AI, analyze files, and boost productivity in any language",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [pathname, locale, hostname, apiUrl])

  return { metadata, loading, error }
}

interface MetadataProps {
  pathname: string
  locale?: locale
  hostname?: string
  apiUrl?: string
}

export function Metadata({
  pathname,
  locale = "en",
  hostname,
  apiUrl,
}: MetadataProps) {
  const { metadata } = useMetadata({ pathname, locale, hostname, apiUrl })

  if (!metadata) return null

  return (
    <Helmet>
      {/* Basic metadata */}
      {metadata.title && <title>{metadata.title}</title>}
      {metadata.description && (
        <meta name="description" content={metadata.description} />
      )}
      {metadata.keywords && metadata.keywords.length > 0 && (
        <meta name="keywords" content={metadata.keywords.join(", ")} />
      )}

      {/* Open Graph */}
      {metadata.openGraph?.title && (
        <meta property="og:title" content={metadata.openGraph.title} />
      )}
      {metadata.openGraph?.description && (
        <meta
          property="og:description"
          content={metadata.openGraph.description}
        />
      )}
      {metadata.openGraph?.url && (
        <meta property="og:url" content={metadata.openGraph.url} />
      )}
      {metadata.openGraph?.siteName && (
        <meta property="og:site_name" content={metadata.openGraph.siteName} />
      )}
      {metadata.openGraph?.type && (
        <meta property="og:type" content={metadata.openGraph.type} />
      )}
      {metadata.openGraph?.locale && (
        <meta property="og:locale" content={metadata.openGraph.locale} />
      )}
      {metadata.openGraph?.images?.map((image, index) => (
        <meta key={index} property="og:image" content={image.url} />
      ))}

      {/* Twitter */}
      {metadata.twitter?.card && (
        <meta name="twitter:card" content={metadata.twitter.card} />
      )}
      {metadata.twitter?.title && (
        <meta name="twitter:title" content={metadata.twitter.title} />
      )}
      {metadata.twitter?.description && (
        <meta
          name="twitter:description"
          content={metadata.twitter.description}
        />
      )}
      {metadata.twitter?.site && (
        <meta name="twitter:site" content={metadata.twitter.site} />
      )}
      {metadata.twitter?.creator && (
        <meta name="twitter:creator" content={metadata.twitter.creator} />
      )}
      {metadata.twitter?.images?.map((image, index) => (
        <meta key={index} name="twitter:image" content={image.url} />
      ))}

      {/* Robots */}
      {metadata.robots && (
        <meta
          name="robots"
          content={`${metadata.robots.index ? "index" : "noindex"}, ${metadata.robots.follow ? "follow" : "nofollow"}`}
        />
      )}

      {/* Canonical */}
      {metadata.alternates?.canonical && (
        <link rel="canonical" href={metadata.alternates.canonical} />
      )}

      {/* Alternate languages */}
      {metadata.alternates?.languages &&
        Object.entries(metadata.alternates.languages).map(([lang, url]) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={url} />
        ))}
    </Helmet>
  )
}

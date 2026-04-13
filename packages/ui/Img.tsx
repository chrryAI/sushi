"use client"

import type React from "react"
import { memo, useEffect, useState } from "react"
import { useImgStyles } from "./Img.styles"
import { ImageIcon } from "./icons"
import Loading from "./Loading"
import {
  MotiView,
  Image as PlatformImage,
  Span,
  useLocalStorage,
  useTheme,
} from "./platform"
import { useInView } from "./platform/useInView" // Auto-resolves to .web or .native
import { apiFetch, FRONTEND_URL } from "./utils"

// 🔐 Get token from localStorage for hippo file access

// Simple in-memory cache
const imageCache = new Map<string, string>()

interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  width: number | string
  height?: number | string
  src: string
  alt?: string
  className?: string
  onLoad?: () => void
  containerClass?: string
  "data-testid"?: string
  style?: React.CSSProperties
  showLoading?: boolean
  priority?: boolean // Skip lazy loading for above-fold images
  handleDimensionsChange?: (dimensions: {
    width: number
    height: number
  }) => void
}

// ⚡ Bolt: Wrapped in React.memo() to prevent unnecessary re-renders
// Impact: Reduces React render cycle overhead when parent components (like message lists or app grids) update, but image props (src, width, height) remain the same.
const Img = memo(function Img({
  src,
  alt,
  width,
  height,
  containerClass,
  className,
  style,
  "data-testid": dataTestId,
  handleDimensionsChange,
  showLoading = true,
  onLoad,
  priority,
  ...props
}: ImgProps) {
  const imgStyles = useImgStyles()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
    threshold: 0,
    skip: priority,
  })
  const [token] = useLocalStorage("token", null)

  // useEffect(() => {
  //   error && onLoad?.()
  // }, [error])

  const loadImage = async (url: string) => {
    // Check if we're on web
    const isWeb = typeof window !== "undefined"

    // Check cache first
    const cachedUrl = imageCache.get(url)
    if (cachedUrl) {
      setImageSrc(cachedUrl)
      setIsLoading(false)

      // Still get dimensions if needed (web only)
      if (handleDimensionsChange && isWeb) {
        const img = new Image()
        img.src = cachedUrl
        try {
          await img.decode()
          handleDimensionsChange({ width: img.width, height: img.height })
        } catch (_e) {}
      }
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // On native, just use the URL directly without blob conversion
      if (!isWeb) {
        setImageSrc(url)
        setIsLoading(false)
        return
      }

      // 🔐 Handle hippo URLs: fetch with auth to get presigned S3 URL
      let finalUrl = url
      if (url.includes("/api/files/hippo/")) {
        try {
          const response = await apiFetch(url, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          const result = await response.json()

          // If we get a redirect (302), extract the presigned URL from Location header
          if (result.url) {
            // For manual redirect, we need to get the Location header from the response
            // But fetch with manual redirect doesn't expose headers to JS due to security
            // So we'll make another request that follows the redirect

            // The final URL after redirect is the presigned S3 URL
            finalUrl = result.url
          }
        } catch (_e) {
          // If fetch fails, fall back to original URL
          finalUrl = url
        }
      }

      // Web: Use Image object to pre-load and get dimensions
      // This uses browser cache and is much faster than fetch+blob
      const img = new Image()
      img.src = finalUrl

      try {
        await img.decode()
        const width = img.width
        const height = img.height
        handleDimensionsChange?.({ width, height })

        // Cache the URL (use original URL as key for hippo URLs)
        imageCache.set(url, finalUrl)
        setImageSrc(finalUrl)
      } catch (_e) {
        // Silently fail if decode/load fails (e.g. 404)
      }
    } catch (_e) {
      // Don't show error for network/CORS issues - just fail silently
      setError(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if ((priority || inView) && !imageSrc && !error) {
      loadImage(src)
    }
  }, [inView, priority, imageSrc, error, src, token])

  const { reduceMotion } = useTheme()
  const [minSplashTimeElapsed, setMinSplashTimeElapsed] = useState(false)

  const [isImageLoaded, setIsImageLoaded] = useState(false)

  useEffect(() => {
    if (!inView || !isLoading) return

    const timer = setTimeout(() => {
      setMinSplashTimeElapsed(true)
      !imageSrc && setError("oops")
    }, 10000)
    return () => clearTimeout(timer)
  }, [isImageLoaded, imageSrc, inView, isLoading])

  // Moti animation with reduced motion support

  if (imageSrc) {
    return (
      <Span
        ref={ref}
        className={containerClass}
        style={{ ...imgStyles.container.style, width, height }}
      >
        <MotiView
          from={{
            opacity: priority ? 1 : 0,
            translateY: priority || reduceMotion ? 0 : 10,
          }}
          animate={{
            opacity: isLoaded || priority ? 1 : 0,
            translateY: 0,
          }}
          transition={{
            type: reduceMotion ? "timing" : "spring",
            duration: priority || reduceMotion ? 0 : 150,
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <PlatformImage
            src={imageSrc}
            alt={alt}
            className={className}
            data-testid={dataTestId}
            style={{
              ...imgStyles.img.style,
              width,
              height,
              ...style,
            }}
            onLoad={() => {
              setIsImageLoaded(true)
              setIsLoaded(true)
              onLoad?.()
            }}
          />
        </MotiView>
      </Span>
    )
  }

  if (error || !isLoading)
    return (
      <>
        <PlatformImage
          src={`${FRONTEND_URL}/images/apps/coder.png`}
          alt={alt}
          className={className}
          data-testid={dataTestId}
          style={{
            ...imgStyles.img.style,
            width: typeof width === "number" ? width / 2 : width,
            height: typeof height === "number" ? height / 2 : height,
            ...style,
          }}
          onLoad={() => {
            // setIsImageLoaded(true)
            // setIsLoaded(true)
            // onLoad?.()
          }}
        />
      </>
    )
  return (
    <Span
      ref={ref}
      className={containerClass}
      style={{ ...imgStyles.container.style, width, height }}
    >
      {isLoading && showLoading && (
        <Span style={{ ...imgStyles.loadingPlaceholder.style, width, height }}>
          <Loading />
        </Span>
      )}
    </Span>
  )
})

export default Img

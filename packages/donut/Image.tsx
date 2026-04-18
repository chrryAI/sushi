"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { CircleFlag } from "react-circle-flags"

import { COLORS } from "./context/AppContext"
import { useApp, useAuth } from "./context/providers"
import { useWannathis } from "./hooks/useWannathis"
import Img from "./Img"
import {
  Claude,
  DeepSeek,
  Flux,
  Gemini,
  Grok,
  OpenAI,
  Perplexity,
} from "./icons"
import { getImageSrc } from "./lib"
import { Span, Text, usePlatform } from "./platform"
import type { store, sushi } from "./types"
import { dojo } from "./utils/siteConfig"

type ImageProps = {
  slug?: "atlas" | "peach" | "vault" | "bloom" | string
  emoji?: string
  className?: string
  size?: number
  title?: string
  showLoading?: boolean
  "data-testid"?: string
  src?: string
  logo?:
    | "lifeOS"
    | "isMagenta"
    | "isVivid"
    | "vex"
    | "chrry"
    | "blossom"
    | "focus"
    | "architect"
    | "sushi"
    | "coder"
    | "grape"
    | "pear"
    | "watermelon"
    | "avocado"
    | "donut"
    | string

  icon?:
    | "spaceInvader"
    | "pacman"
    | "heart"
    | "plus"
    | "hamster"
    | "frog"
    | "calendar"
    | "deepSeek"
    | "perplexity"
    | "claude"
    | "chatGPT"
    | "gemini"
    | "grok"
    | "flux"
    | "chrry"
    | "raspberry"
    | "strawberry"
    | "sushi"
    | "zarathustra"
    | "molt"
    | "grape"
    | string

  app?: sushi
  width?: number | string
  height?: number | string
  style?: React.CSSProperties
  alt?: string
  containerClass?: string
  onLoad?: (src?: string) => void
  store?: store
  PROD_FRONTEND_URL?: string
  FRONTEND_URL?: string
  BASE_URL?: string
  canEditApp?: boolean
  image?: string
  priority?: boolean
}

export default function ImageComponent(props: ImageProps) {
  const {
    className,
    showLoading,
    logo,
    title,
    alt,
    slug,
    app,
    style,
    containerClass,
    "data-testid": dataTestId,
    onLoad,
    icon,
    priority,
  } = props

  const { appFormWatcher, canEditApp } = useApp()

  const { API_URL, FRONTEND_URL, isDevelopment, PROD_FRONTEND_URL, isP } =
    useAuth()

  const os = usePlatform()

  const BASE_URL = FRONTEND_URL

  let { src, width, height, size } = getImageSrc({
    ...props,
    canEditApp,
    image: appFormWatcher?.image,
    BASE_URL: "https://chrry.ai",
    // PROD_FRONTEND_URL,
    slug,
  })
  const appSlug = app?.slug || slug
  const dojoSlug = app?.slug || slug || logo
  const dojoApp = Object.values(dojo)
    .flatMap((group) => group.apps)
    .find((a) => a.slug === dojoSlug)
  const [evenChance] = useState(Math.random() >= 0.5)

  // --- BAYRAK KONTROLÜ (CircleFlag için özel durum) ---
  const countries: Record<string, string> = {
    amsterdam: "nl",
    tokyo: "jp",
    istanbul: "tr",
    newYork: "us",
    paris: "fr",
  }

  // Emoji ve Agent durumlarını hesapla (hook'lardan önce, early return'den önce)
  const agents = [
    "deepSeek",
    "chatGPT",
    "claude",
    "gemini",
    "flux",
    "perplexity",
    "grok",
  ]
  const isAgent =
    (slug && agents.includes(slug)) ||
    (app?.onlyAgent &&
      app?.defaultModel &&
      app?.slug !== "search" &&
      agents.includes(app?.defaultModel))

  const isNumericString = (val: string) => /^\d+$/.test(val)
  const intSize =
    typeof size === "number"
      ? size
      : typeof size === "string" && isNumericString(size)
        ? Number.parseInt(size, 10)
        : 24 // Default size for emojis when size is CSS unit

  const ex =
    dojoSlug &&
    [
      "hippo",
      "coder",
      "pear",
      "zarathustra",
      "vex",
      "grape",
      "popcorn",
      "chrry",
    ].includes(dojoSlug)
  const isEmoji =
    props.emoji ||
    ((isP
      ? !ex && dojoSlug && dojoApp?.emoji
        ? true
        : slug === "tribe"
      : app?.slug &&
        (app?.store?.slug === "movies" ||
          app?.store?.slug === "popcorn" ||
          app?.store?.slug === "books")) &&
      !ex)

  const { src: fallbackSrc } = useWannathis()

  // Tüm hook'lar early return'den ÖNCE olmalı!
  useEffect(() => {
    if (isEmoji || isAgent) {
      onLoad?.()
    }
  }, [isEmoji, isAgent])

  const emojiSize = intSize * 1.25 > 50 ? 50 : intSize * 1.25
  if (isEmoji) size = emojiSize
  const color =
    app?.themeColor && Object.keys(COLORS).includes(app?.themeColor as any)
      ? COLORS[app?.themeColor as "blue"]
      : "var(--accent-6)"

  if (appSlug && countries[appSlug]) {
    return (
      <CircleFlag
        height={intSize}
        width={intSize}
        countryCode={countries[appSlug]}
      />
    )
  }

  if (appSlug) {
    const result =
      slug === "deepSeek" ? (
        <Span style={{ ...style, display: "inline-flex" }}>
          <DeepSeek color={color} size={intSize} />
        </Span>
      ) : slug === "chatGPT" ? (
        <Span style={{ ...style, display: "inline-flex" }}>
          <OpenAI color={color} size={intSize} />
        </Span>
      ) : ["claude", "researcher", "review", "writer"].includes(appSlug) ? (
        <Span style={{ ...style, display: "inline-flex" }}>
          <Claude color={color} size={intSize} />
        </Span>
      ) : slug === "gemini" ? (
        <Span style={{ ...style, display: "inline-flex" }}>
          <Gemini color={color} size={intSize} />
        </Span>
      ) : slug === "flux" ? (
        <Span style={{ ...style, display: "inline-flex" }}>
          <Flux color={color} size={intSize} />
        </Span>
      ) : ["academic", "perplexity", "news"].includes(appSlug) ? (
        <Span style={{ ...style, display: "inline-flex" }}>
          <Perplexity color={color} size={intSize} />
        </Span>
      ) : ["grok", "benjamin", "lucas", "harper"].includes(appSlug) ? (
        <Span style={{ ...style, display: "inline-flex" }}>
          <Grok color={color} size={intSize} />
        </Span>
      ) : null

    if (result) return result
  }

  const resize = ({
    url,
    width,
    height,
  }: {
    url: string
    width?: number | string
    height?: number | string
  }) => {
    if (props.src?.startsWith("http")) {
      return url
    }
    if (typeof width === "string") {
      return url
    }
    if (typeof height === "string") {
      return url
    }

    // Skip resize for blob URLs, data URLs, and external URLs
    const isBlob = true
    // url.startsWith("blob:")
    const isDataUrl = url.startsWith("data:")
    const isExternal =
      url.startsWith("http") &&
      !url.startsWith(FRONTEND_URL) &&
      !url.startsWith(PROD_FRONTEND_URL) &&
      !url.includes("minio.chrry.dev") // Allow MinIO URLs

    if (isBlob || isDataUrl || isExternal) {
      return url
    }

    // Request 3x size for Super Retina displays to match "original" crispness
    // e.g. If rendering at 48px, request 144px image
    // Force PNG format to avoid any WebP compression artifacts
    const density = 3
    const targetWidth = typeof width === "number" ? width * density : width
    const targetHeight = typeof height === "number" ? height * density : height

    // Resize all images, not just FRONTEND_URL ones
    // MinIO images need resizing too!
    return `${API_URL}/resize?url=${encodeURIComponent(url)}&w=${targetWidth}&h=${targetHeight}&fit=contain&q=100&fmt=png`
  }

  // Convert size to number, fallback to 24 if it's a CSS string like "100%"

  if (icon === "molt") {
    return (
      <Text style={{ ...style, fontSize: emojiSize, display: "inline-flex" }}>
        🦞
      </Text>
    )
  }

  // --- DOJO FIND ---

  if (isEmoji) {
    const intSize = typeof size === "number" ? size : 24
    const emojiSize = intSize * 0.8

    // Uygulamanın kendi tema rengini alıyoruz
    const themeColor = app?.themeColor || "var(--accent-6)"

    return (
      <Text
        style={{
          ...style,
          fontSize: emojiSize,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: emojiSize,
          height: emojiSize,
          textAlign: "center",
          position: "relative",
          // KRİTİK NOKTA: Rengi buraya veriyoruz
          color: themeColor,
          // KRİTİK NOKTA: Bu fontlar emojiyi 'boyanabilir sembol' haline getirir
          fontFamily:
            os.os === "ios"
              ? undefined
              : '"Noto Color Emoji", "Apple Symbols", "Segoe UI Symbol", "Symbola", sans-serif',
          fontWeight: "normal",
        }}
      >
        {slug === "tribe"
          ? "🌵"
          : icon === "calendar"
            ? "📅"
            : props.emoji || dojoApp?.emoji || app?.icon}
      </Text>
    )
  }

  const coder = fallbackSrc

  return (
    <>
      <Img
        key={src}
        onLoad={onLoad}
        data-testid={dataTestId}
        containerClass={containerClass}
        style={style}
        className={className}
        showLoading={showLoading}
        width={width}
        height={height}
        title={title}
        priority={priority}
        src={resize({
          url: slug && !src ? coder : src || coder,
          width,
          height,
        })}
        alt={alt || (app?.name ? app?.name : slug || logo || icon)}
      />
    </>
  )
}

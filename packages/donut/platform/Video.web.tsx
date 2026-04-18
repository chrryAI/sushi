"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import useLocalStorage from "../hooks/useLocalStorage"
import { apiFetch } from "../utils"

// 🔐 Get token from localStorage for hippo file access

export interface VideoProps {
  src: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
  controls?: boolean
  style?: React.CSSProperties
  className?: string
  width?: number | string
  height?: number | string
  playing?: boolean
}

const Video: React.FC<VideoProps> = ({
  src,
  autoPlay,
  loop,
  muted,
  playsInline,
  controls,
  style,
  className,
  width,
  height,
  playing,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoSrc, setVideoSrc] = useState<string>(src)
  const [token] = useLocalStorage("token", null)

  // 🔐 Handle hippo URLs: fetch with auth to get presigned S3 URL
  useEffect(() => {
    if (src.includes("/api/files/hippo/")) {
      const fetchPresignedUrl = async () => {
        try {
          const response = await apiFetch(src, {
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
            setVideoSrc(result.url)
          }
        } catch (_e) {
          // If fetch fails, use original URL
          setVideoSrc(src)
        }
      }

      fetchPresignedUrl()
    } else {
      setVideoSrc(src)
    }
  }, [src, token])

  useEffect(() => {
    if (!videoRef.current || playing === undefined) return

    if (playing) {
      videoRef.current.play().catch((err) => {
        // Autoplay policy might block this even if muted in some browsers/cases
        console.warn("Video play failed:", err)
      })
    } else {
      videoRef.current.pause()
    }
  }, [playing])

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      controls={controls}
      style={style}
      className={className}
      width={width}
      height={height}
    />
  )
}

export default Video

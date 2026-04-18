"use client"

// Web implementation using HTML audio element
import { forwardRef, useEffect, useState } from "react"
import useLocalStorage from "../hooks/useLocalStorage"
import { apiFetch } from "../utils"

export interface AudioProps {
  src?: string
  onEnded?: () => void
  loop?: boolean
  autoPlay?: boolean
}

export const Audio = forwardRef<HTMLAudioElement, AudioProps>(
  ({ src, onEnded, loop, autoPlay }, ref) => {
    const [audioSrc, setAudioSrc] = useState<string | undefined>(src)
    const [token] = useLocalStorage("token", null)

    // 🔐 Handle hippo URLs: fetch with auth to get presigned S3 URL
    useEffect(() => {
      if (src?.includes("/api/files/hippo/")) {
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
              setAudioSrc(result.url)
            }

            // The final URL after redirect is the presigned S3 URL
          } catch (_e) {
            // If fetch fails, use original URL
            setAudioSrc(src)
          }
        }

        fetchPresignedUrl()
      } else {
        setAudioSrc(src)
      }
    }, [src, token])

    return (
      <audio
        ref={ref}
        src={audioSrc}
        onEnded={onEnded}
        loop={loop}
        autoPlay={autoPlay}
      />
    )
  },
)

Audio.displayName = "Audio"

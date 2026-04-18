"use client"
import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useAuth } from "./context/providers"
import { useStyles } from "./context/StylesContext"
import { useHasHydrated } from "./hooks"
import { CircleX } from "./icons"
import { useModalStyles } from "./Modal.styles"
import {
  Button,
  Div,
  H4,
  toRem,
  usePlatform,
  useTheme,
  Video,
} from "./platform"
import { FRONTEND_URL } from "./utils"

export default function Modal({
  title,
  hasCloseButton,
  children,
  footer,
  onToggle,
  event,
  params,
  icon,
  scrollable = true,
  id,
  borderHeader = true,
  "data-testid": dti,
  dataTestId,
  hideOnClickOutside = true,
  style,
  innerStyle,
  footerStyle,
  attachTo,
  headerStyle,
  fullScreen = false,
  ...props
}: {
  hideOnClickOutside?: boolean
  params?: string
  id?: string
  innerStyle?: React.CSSProperties
  footerStyle?: React.CSSProperties
  headerStyle?: React.CSSProperties
  attachTo?: string
  isModalOpen?: boolean
  hasCloseButton?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  dataTestId?: string
  title: React.ReactNode
  fullScreen?: boolean
  onToggle?: (open: boolean) => void
  event?: {
    name: string
    props?: Record<string, any>
  }
  scrollable?: boolean
  borderHeader?: boolean
  icon?: React.ReactNode | "blob"
  "data-testid"?: string
  style?: React.CSSProperties
}) {
  const { viewPortHeight, viewPortWidth } = usePlatform()
  const styles = useModalStyles()
  const { utilities } = useStyles()
  // Split contexts
  const { plausible } = useAuth()

  const { isDrawerOpen } = useTheme()
  const innerRef = React.useRef<HTMLDivElement>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(
    props.isModalOpen ?? false,
  )

  const hasHydrated = useHasHydrated()

  useEffect(() => {
    setIsModalOpen(props.isModalOpen ?? false)
  }, [props.isModalOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        innerRef.current &&
        !innerRef.current.contains(event.target as Node)
      ) {
        if (isModalOpen && hideOnClickOutside) {
          onToggle ? onToggle?.(false) : setIsModalOpen(false)
        }
      }
    }

    if (typeof window !== "undefined" && document.addEventListener) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isModalOpen, hideOnClickOutside])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isModalOpen) {
      if (params) {
        const urlParams = new URLSearchParams(params.split("?")[1] || "")
        const paramKey = Array.from(urlParams.entries())[0]?.[0]
        const paramValue = Array.from(urlParams.entries())[0]?.[1]

        if (paramKey) {
          const url = new URL(window.location.href)
          url.searchParams.set(paramKey, paramValue || "true")
          window.history.replaceState(null, "", url.toString())
        }
      }
      event && plausible({ ...event, name: `${event.name}_open` })
    } else {
      if (params) {
        const urlParams = new URLSearchParams(params.split("?")[1] || "")
        const paramToRemove = Array.from(urlParams.entries())[0]?.[0]

        if (paramToRemove) {
          const url = new URL(window.location.href)
          url.searchParams.delete(paramToRemove)
          window.history.replaceState(null, "", url.toString())
        }
      }
    }
  }, [isModalOpen])

  useEffect(() => {
    if (isModalOpen) {
      if (typeof window !== "undefined" && document.body) {
        // Store the current scroll position
        const scrollY = window.scrollY

        // Lock the body scroll
        document.body.style.position = "fixed"
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = "100%"
        document.body.style.overflow = "hidden"

        return () => {
          // Restore the body scroll
          document.body.style.position = ""
          document.body.style.top = ""
          document.body.style.width = ""
          document.body.style.overflow = ""

          // Restore the scroll position
          window.scrollTo(0, scrollY)
        }
      }
    }
  }, [isModalOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onToggle ? onToggle?.(false) : setIsModalOpen(false)
      }
    }

    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("keydown", handleKeyDown)
      return () => {
        window.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [isModalOpen])

  useEffect(() => {
    if (isModalOpen && innerRef.current) {
      innerRef.current.focus()
    }
  }, [isModalOpen])

  return (
    hasHydrated &&
    isModalOpen &&
    createPortal(
      <Div
        style={{
          height: "100dvh",
          width: "100dvw",
          display: "flex",
          top: 0,
          left: 0,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          position: "fixed",
          backgroundColor: "var(--overlay)",
          fontSize: 16,
        }}
        role="dialog"
        aria-modal="true"
      >
        <Div
          style={{
            ...{
              margin: "0 auto",
              padding: "0 10px",
              zIndex: 3,
              position: "relative",
              flex: 1,
              flexDirection: "column",
              display: "flex",
              justifyContent: "center",
              width: "100%",
            },
            ...(isDrawerOpen
              ? {
                  left: 125,
                }
              : {}),
            maxWidth: fullScreen
              ? 960
              : viewPortWidth < 501
                ? "100%"
                : toRem(450),
            minWidth: fullScreen
              ? "fit-content"
              : viewPortWidth > 501
                ? toRem(450)
                : undefined,
            // width: fullScreen
            //   ? "100dvw"
            //   : viewPortWidth < 431
            //     ? "inherit"
            //     : viewPortWidth < 501
            //       ? "100%"
            //       : "auto",

            ...style,
          }}
        >
          <Div
            className="slideUp"
            data-testid={dti || dataTestId}
            ref={innerRef}
            id={id}
            tabIndex={-1}
            style={{
              ...{
                backgroundColor: "var(--background)",
                padding: 13,
                borderRadius: fullScreen ? 0 : "var(--radius)",
                border: fullScreen
                  ? "1px dashed var(--shade-3)"
                  : "1px solid var(--shade-2-transparent)",
                position: "relative",
                maxHeight: fullScreen ? "100dvh" : "calc(100dvh - 20px)",
                maxWidth: 960,
                display: "flex",
                flexDirection: "column",
                gap: 5,
                justifyContent: "flex-start",
                width: "100%",
              },
              outline: "none",
              ...innerStyle,
            }}
          >
            <H4
              style={{
                ...styles.header.style,
                ...(borderHeader
                  ? { borderBottom: "1px dashed var(--shade-2)" }
                  : {}),
                ...headerStyle,
              }}
            >
              {icon === "blob" ? (
                <Video
                  style={styles.video.style}
                  src={`${FRONTEND_URL}/video/blob.mp4`}
                  autoPlay
                  loop
                  muted
                  playsInline
                ></Video>
              ) : (
                icon
              )}
              <Div style={styles.title.style}>{title}</Div>

              {(hasCloseButton || fullScreen) && (
                <Button
                  className="link"
                  data-testid={
                    dataTestId
                      ? `${dataTestId}-close-button`
                      : "modal-close-button"
                  }
                  style={{ ...styles.close.style, ...utilities.link.style }}
                  aria-label="Close modal"
                  onClick={() => {
                    onToggle ? onToggle?.(false) : setIsModalOpen(false)
                  }}
                >
                  <CircleX size={24} />
                </Button>
              )}
            </H4>
            <Div
              style={{
                ...styles.content.style,
                ...(scrollable ? styles.scrollable.style : {}),
              }}
            >
              {children}
            </Div>
            {footer ? (
              <Div
                style={{
                  borderTop: "1px dashed var(--shade-3)",
                  ...footerStyle,
                }}
              >
                {footer}
              </Div>
            ) : null}
          </Div>
        </Div>
      </Div>,
      document.getElementById(attachTo || "skeleton") || document.body,
    )
  )
}

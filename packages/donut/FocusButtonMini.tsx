"use client"

import { type CSSProperties, memo, useEffect, useState } from "react"
import A from "./a/A"
import { useAuth } from "./context/providers"
import { useStyles } from "./context/StylesContext"
import { useTimerContext } from "./context/TimerContext"
import { useHasHydrated } from "./hooks"
import Img from "./Image"
import { Span, usePlatform } from "./platform"

function FocusButton({
  style,
  width,
  children,
}: {
  width?: number
  style?: CSSProperties
  children?: React.ReactNode
}) {
  const { time, presetMin1 } = useTimerContext()

  const { appStyles } = useStyles()
  const { isExtension, isFirefox, isWeb: _isWeb } = usePlatform()
  const { focus, getAppSlug, setShowFocus, app, rtl } = useAuth()

  const hasHydrated = useHasHydrated()

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (time === 0) {
      const interval = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [time])

  const formatTime = () => {
    if (time > 0) {
      return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`
    } else if (app?.id === focus?.id) {
      return `${presetMin1}"`
    } else {
      const hours = currentTime.getHours()
      const minutes = currentTime.getMinutes()
      return `${hours}:${String(minutes).padStart(2, "0")}`
    }
  }

  if (!focus || !hasHydrated) {
    return null
  }

  return (
    <A
      onClick={() => setShowFocus(true)}
      href={`${getAppSlug(focus)}?focus=true`}
      openInNewTab={isExtension && isFirefox}
      style={{
        ...{
          position: "relative",
          marginRight: 5,
          display: "inline-flex",
          gap: (width || 22) / 3.5,
          alignItems: "center",
        },
        ...style,
      }}
    >
      {hasHydrated && (
        <Span
          style={{
            position: "absolute",
            top: -5,
            left: -10,
            padding: "2px 6px",
            backgroundColor: "var(--accent-1)",
            color: "#fff",
            borderRadius: 10,
            fontSize: 9,
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            whiteSpace: "nowrap",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            zIndex: 1,
          }}
        >
          {formatTime()}
        </Span>
      )}
      <Img
        style={appStyles.focus.style}
        logo="focus"
        width={width || 22}
        height={width || 22}
      />
      {children}
    </A>
  )
}

export default memo(FocusButton)

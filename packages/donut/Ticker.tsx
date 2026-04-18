import React, { useEffect, useState } from "react"
import { useAppContext } from "./context/AppContext"
import { useApp, useAuth } from "./context/providers"
import { useChat } from "./context/providers/ChatProvider"
import { COLORS, useTheme } from "./context/ThemeContext"
import TextType from "./TextType"
import type { sushi } from "./types"
import { decodeHtmlEntities, getInstructionConfig } from "./utils"
import { ANALYTICS_EVENTS } from "./utils/analyticsEvents"

function Ticker({
  style,
  showControls = false,
  maxWidth,
  vertical = false,
  i,
  ...rest
}: {
  style?: React.CSSProperties
  paused?: boolean
  showControls?: boolean
  maxWidth?: number
  vertical?: boolean
  app?: sushi
  i?: number
}) {
  const { reduceMotion } = useTheme()
  const { app: chatApp, setApp, ...auth } = useAuth()

  const app = rest?.app ?? chatApp

  const instructions =
    chatApp?.id === app?.id && auth?.instructions?.length
      ? auth.instructions
      : app?.instructions?.length
        ? app?.instructions
        : app?.highlights || []

  const {
    setSelectedInstruction,
    user,
    guest,
    weather,
    tickerPaused: paused,
    setTickerPaused,
    plausible,
  } = useAuth()
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const { t } = useAppContext()
  const city = user?.city || guest?.city
  const country = user?.country || guest?.country
  const [instructionConfig, setInstructionConfig] = useState(
    getInstructionConfig({
      city,
      country,
      weather,
    }),
  )

  useEffect(() => {
    setInstructionConfig(
      getInstructionConfig({
        city,
        country,
        weather,
      }),
    )
  }, [city, country, weather])

  useEffect(() => {
    reduceMotion && setTickerPaused(reduceMotion)
  }, [reduceMotion])
  // Map instructions to their titles for the typing effect
  const instructionTitles = React.useMemo(() => {
    return (instructions || []).map(
      (instruction) =>
        `${instruction.emoji} ${decodeHtmlEntities(t(instruction.title, instructionConfig))}`,
    )
  }, [instructions, instructionConfig, t])

  if (!instructionTitles.length) return null

  return (
    <TextType
      showControls={showControls}
      className="ticker-clickable"
      style={{
        ...style,

        fontSize: ".85rem",
        cursor: "pointer",
        color: COLORS.blue,
        fontWeight: 500,
        fontFamily: "var(--font-mono)",
      }}
      onToggle={(value) => {
        plausible({
          name: value
            ? ANALYTICS_EVENTS.TICKER_PAUSE
            : ANALYTICS_EVENTS.TICKER_RESUME,
          props: {
            app: app?.name,
            store: app?.store?.name,
          },
        })
        setTickerPaused(value)
      }}
      maxWidth={maxWidth}
      vertical={vertical}
      text={instructionTitles}
      typingSpeed={40}
      pauseDuration={800}
      showCursor
      cursorCharacter="_"
      deletingSpeed={20}
      onIndexChange={setCurrentIndex}
      paused={paused}
      onClick={() => {
        if (instructions?.[currentIndex]) {
          if (chatApp?.id !== app?.id) {
            setApp(app)
          }
          setSelectedInstruction(instructions[currentIndex])
          plausible({
            name: ANALYTICS_EVENTS.TICKER_CLICK,
            props: {
              app: app?.name,
              store: app?.store?.name,
              instruction: instructions?.[currentIndex]?.title,
            },
          })
        }
      }}
    />
  )
}

export default Ticker

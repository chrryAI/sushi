"use client"

import { gsap } from "gsap"
import {
  type CSSProperties,
  createElement,
  type ElementType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { COLORS, useAppContext } from "./context/AppContext"
import { useStyles } from "./context/StylesContext"
import { CirclePause, CirclePlay } from "./icons"
import { Button, Div, Span, usePlatform } from "./platform"
import { secureRandom } from "./utils"

export interface TextTypeProps {
  text: string | string[]
  as?: ElementType
  typingSpeed?: number
  initialDelay?: number
  pauseDuration?: number
  deletingSpeed?: number
  loop?: boolean
  className?: string
  showCursor?: boolean
  maxWidth?: number
  hideCursorWhileTyping?: boolean
  cursorCharacter?: string
  cursorClassName?: string
  cursorBlinkDuration?: number
  vertical?: boolean
  textColors?: string[]
  showControls?: boolean
  variableSpeed?: { min: number; max: number }
  onSentenceComplete?: (text: string, index: number) => void
  onIndexChange?: (index: number) => void
  startOnVisible?: boolean
  reverseMode?: boolean
  style?: CSSProperties
  paused?: boolean
  [key: string]: any
  onToggle?: (value: boolean) => void
}

const TextType = ({
  text,
  as: Component = "div",
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = "",
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = "|",
  cursorClassName = "",
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  vertical = false,
  onIndexChange,
  startOnVisible = false,
  reverseMode = false,
  showControls = false,
  maxWidth,
  onToggle,
  style,
  paused: pausedProp,
  ...props
}: TextTypeProps) => {
  const [displayedText, setDisplayedText] = useState("")
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(!startOnVisible)
  const cursorRef = useRef(null)
  const containerRef = useRef(null)

  const { viewPortWidth } = usePlatform()
  const { t } = useAppContext()
  const { utilities } = useStyles()
  const [paused, setPaused] = useState(pausedProp || false)

  useEffect(() => {
    pausedProp !== undefined && setPaused(pausedProp)
  }, [pausedProp])

  useEffect(() => {
    onToggle?.(paused)
  }, [paused])

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text])

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed
    const { min, max } = variableSpeed
    return secureRandom() * (max - min) + min
  }, [variableSpeed, typingSpeed])

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return "inherit"
    return textColors[currentTextIndex % textColors.length]
  }

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 },
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [startOnVisible])

  useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 })
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      })
    }
  }, [showCursor, cursorBlinkDuration])

  useEffect(() => {
    if (!isVisible || paused) return

    let timeout: any
    const currentText = textArray[currentTextIndex] || ""
    const processedText = reverseMode
      ? currentText.split("").reverse().join("")
      : currentText

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === "") {
          setIsDeleting(false)
          if (currentTextIndex === textArray.length - 1 && !loop) {
            return
          }

          if (onSentenceComplete) {
            onSentenceComplete(currentText, currentTextIndex)
          }

          setCurrentTextIndex((prev) => (prev + 1) % textArray.length)
          setCurrentCharIndex(0)
          timeout = setTimeout(() => {}, pauseDuration)
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1))
          }, deletingSpeed)
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText((prev) => prev + processedText[currentCharIndex])
              setCurrentCharIndex((prev) => prev + 1)
            },
            variableSpeed ? getRandomSpeed() : typingSpeed,
          )
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return
          timeout = setTimeout(() => {
            setIsDeleting(true)
          }, pauseDuration)
        }
      }
    }

    if (currentCharIndex === 0 && !isDeleting && displayedText === "") {
      timeout = setTimeout(executeTypingAnimation, initialDelay)
    } else {
      executeTypingAnimation()
    }

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete,
    paused,
  ])

  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(currentTextIndex)
    }
  }, [currentTextIndex, onIndexChange])

  const shouldHideCursor =
    hideCursorWhileTyping &&
    (currentCharIndex < (textArray[currentTextIndex]?.length || 0) ||
      isDeleting)

  return (
    <Div
      ref={containerRef}
      style={{
        alignItems: "center",
        gap: ".35rem",
        // 🎯 MAX ONE LINE + FIT WIDTH
        display: "inline-flex", // İçeriğe göre genişlik (inline-block gibi ama flex)
        whiteSpace: "nowrap", // Tek satır zorla
        verticalAlign: "bottom", // Hizalama için
        ...style,
        flexDirection: vertical ? "column" : "row",
        justifyContent: "flex-start", // Dikeyde en üstten başlasın
        maxWidth: maxWidth ? `${maxWidth}px` : "100%",
        // 🎯 Dikeyde taşma olursa aşağı uzasın diye overflow'u kontrollü bıraktım
        overflow: vertical ? "visible" : "hidden",
        ...style,
      }}
    >
      {showControls && (
        <Button
          title={paused ? t("Play") : t("Pause")}
          className="link"
          onClick={() => {
            setPaused(!paused)
          }}
          style={{
            ...utilities.link.style,
            flexShrink: 0, // Buton küçülmesin
          }}
        >
          {paused ? (
            <CirclePlay color={COLORS.green} size={20} />
          ) : (
            <CirclePause color={COLORS.orange} size={20} />
          )}
        </Button>
      )}
      {createElement(
        Component,
        {
          className: `text-type ${className}`,
          style: {
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            alignItems: "center",
            // 🎯 Dikey modda kelimeler arası boşluğu koru
            gap: vertical ? "12px" : "4px",
            minWidth: 0,
          },
          ...props,
        },
        <>
          {createElement(
            Component,
            {
              className: `text-type ${className}`,
              style: {
                display: "flex", // Flex container
                alignItems: "center",
                minWidth: 0, // 🎯 Flex'te truncate için şart!
                overflow: "hidden", // Taşmayı engelle
              },
              ...props,
            },
            <>
              {vertical ? (
                // DİKEY MOD: Kelimeleri böl ve çevir
                displayedText.split(" ").map((word, index) => (
                  <Span
                    key={index}
                    style={{
                      display: "inline-block",
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      whiteSpace: "nowrap",
                      color: getCurrentTextColor(),
                      flexShrink: 0,
                    }}
                  >
                    {word}
                  </Span>
                ))
              ) : (
                // NORMAL MOD: Düz metin (Kelimeleri bölme, boşlukları koru)
                <Span
                  className="text-type__content"
                  style={{
                    color: getCurrentTextColor() || "inherit",
                    // 🎯 TEXT TRUNCATION
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0, // Flex item shrink için gerekli
                  }}
                >
                  {displayedText}
                </Span>
              )}
            </>,
            showCursor && (
              <Span
                ref={cursorRef}
                className={`text-type__cursor ${cursorClassName} ${shouldHideCursor ? "text-type__cursor--hidden" : ""}`}
                style={{
                  flexShrink: 0, // Cursor küçülmesin
                }}
              >
                {cursorCharacter}
              </Span>
            ),
          )}
        </>,
      )}
    </Div>
  )
}

export default TextType

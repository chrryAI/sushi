"use client"

import {
  type CSSProperties,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react"
import { FaAndroid, FaApple, FaChrome } from "react-icons/fa"
import { SiMacos } from "react-icons/si"
import A from "./a/A"
import { useAppContext } from "./context/AppContext"
import {
  useApp,
  useAuth,
  useChat,
  useError,
  useNavigationContext,
} from "./context/providers"
import { useStyles } from "./context/StylesContext"
import { useHasHydrated } from "./hooks"
import { useResponsiveCount } from "./hooks/useResponsiveCount"
import { useInstructionsStyles } from "./Instructions.styles"
import {
  Button,
  Div,
  Span,
  toRem,
  usePlatform,
  useTheme as usePlatformTheme,
} from "./platform"
import type { thread } from "./types"
import { getMaxFiles } from "./utils"

const Agent = lazy(() => import("./agent"))

export default function Tools({
  className,
  thread,
  onSave,
  showInstructions = false,
  showDownloads = true,
  dataTestId = "instruction",
  showInstallers = true,
  opacity = 1,
  isAgentBuilder = false,
  onClose,
  style,
  size,
  key,
  as = "icon",
  ...rest
}: {
  className?: string
  icon?: boolean
  key?: string
  thread?: thread
  showInstructions?: boolean
  opacity?: number
  dataTestId?: string
  placeholder?: string
  isArtifactsOpen?: boolean
  showDownloads?: boolean
  showInstallers?: boolean
  onClose?: () => void
  isAgentBuilder?: boolean
  as?: "button" | "icon"
  size?: number

  onSave?: ({
    content,
    artifacts,
  }: {
    content: string
    artifacts: File[]
  }) => void
  style?: CSSProperties
}) {
  const { t, console } = useAppContext()

  const showButton = as === "button"
  const icon = as === "icon"

  const styles = useInstructionsStyles()

  const { utilities } = useStyles()

  const { defaultInstructions, isAppInstructions, isAgentModalOpen } = useApp()

  const {
    token,
    language,
    user,
    guest,
    app,
    storeApp,
    burnApp,
    downloadUrl,
    chromeWebStoreUrl,
    isRetro,
    dailyQuestionData,
    API_URL,
    weather,
    PROMPT_LIMITS,
    isDevelopment,
    ...auth
  } = useAuth()

  const burn = (burnApp && burnApp?.id === app?.id) || auth.burn

  const [showGrapeInternal, setShowGrape] = useState(false)

  const canGrape = !burn

  const showGrape = canGrape && showGrapeInternal

  // Replace instructions with Zarathustra philosophy when burn is active

  const {
    selectedAgent,
    setSelectedAgent,
    deepSeekAgent,
    claudeAgent,
    favouriteAgent,
    refetchThread,
  } = useChat()

  const {
    router,
    collaborationStep,
    setCollaborationStep,
    isMemoryConsentManageVisible,
    setShowAddToHomeScreen,
  } = useNavigationContext()

  const {
    isManagingApp,
    appFormWatcher,
    instructions,
    setInstructions,
    appStatus,
    appForm,
  } = useApp()

  const { captureException } = useError()

  const { os, isStandalone, isTauri, isCapacitor, isExtension } = usePlatform()

  const offset = isStandalone || isExtension || isCapacitor ? -80 : 0

  const count = useResponsiveCount(
    [
      { height: 550, count: 0 }, // Small phones: show none (was 1)
      { height: 700, count: 1 }, // Medium phones: show 1 (was 2)
      { height: 750, count: 2 }, // Larger phones: show 2 (was 3)
      { height: 800, count: 3 }, // Small tablets/large phones: show 3 (was 4)
      { height: 850, count: 5 }, // Tablets: show 4 (was 5)
      { height: 900, count: 6 }, // Tablets: show 4 (was 5)
      { height: 950, count: 7 }, // Large tablets: show 5 (was 6)
      { height: Infinity, count: 7 }, // Desktop: show 6 (was 7)
    ],
    offset, // -250 for PWA (standalone mode)
  )

  // Theme context
  const { addHapticFeedback, isDark, isMobileDevice, reduceMotion } =
    usePlatformTheme()

  const city = user?.city || guest?.city
  const country = user?.country || guest?.country

  const productionExtensions = ["chrome"]
  const MAX_FILES = getMaxFiles({ user, guest })

  const grapeButtonRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        grapeButtonRef.current &&
        !grapeButtonRef.current.contains(event.target as Node)
      ) {
        setShowGrape(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const hasHydrated = useHasHydrated()

  return (
    <Div style={style} key={key || dataTestId} data-testid={`${dataTestId}`}>
      <Div
        data-testid={`${dataTestId}-about`}
        style={{
          ...styles.bottom.style,
          marginBottom: showDownloads ? 0 : 30,
          marginTop: showInstallers ? 10 : style?.marginTop,
          zIndex: 10,
        }}
      >
        {appStatus?.part ? (
          <Suspense>
            <Agent />
          </Suspense>
        ) : (
          <Div
            style={{
              display: "flex",
              gap: toRem(5),
            }}
          >
            {!isCapacitor && (
              <Button
                className="transparent"
                style={{
                  ...utilities.small.style,
                  ...styles.installAppButton.style,
                }}
                onClick={() => {
                  addHapticFeedback()
                  setShowAddToHomeScreen(true)
                }}
              >
                {os === "ios" || os === "macos" ? (
                  <FaApple
                    style={{
                      position: "relative",
                      bottom: 1,
                    }}
                    size={18}
                  />
                ) : (
                  <FaAndroid size={18} />
                )}
                {/* {t("Install")} */}
              </Button>
            )}

            {os !== "android" && os !== "ios" && !isTauri && downloadUrl ? (
              <Button
                className="inverted"
                style={{
                  ...utilities.small.style,

                  ...styles.installAppButton.style,
                  paddingTop: "0",
                  paddingBottom: "0",
                }}
                onClick={() => {
                  const a = document.createElement("a")
                  a.href = downloadUrl
                  a.download = ""
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                }}
              >
                <SiMacos
                  style={{
                    position: "relative",
                    bottom: 1,
                  }}
                  size={32}
                />
                {/* {t("Install")} */}
              </Button>
            ) : null}
            {productionExtensions.includes("chrome")
              ? !showGrape && (
                  <A
                    openInNewTab
                    href={chromeWebStoreUrl}
                    className="button"
                    style={{
                      ...utilities.button.style,
                      ...utilities.small.style,
                      ...styles.installButton.style,
                    }}
                  >
                    <FaChrome size={18} />
                    {/* {t("Extension")} */}
                  </A>
                )
              : null}
            {canGrape && (
              <A
                ref={grapeButtonRef}
                href="mailto:iliyan@chrry.ai"
                className="link"
                style={{
                  ...utilities.link.style,
                  marginLeft: showGrape ? 0 : 5,
                  fontSize: "0.9rem",
                  fontWeight: "normal",
                  padding: "6.25px 0",
                }}
                onClick={(e) => {
                  setShowGrape(!showGrape)
                  if (!showGrape) {
                    e.preventDefault()
                    // Open email client for advertising inquiries
                  }
                }}
              >
                {showGrape ? t("Get your brand here") : ""}{" "}
                <Span
                  style={{
                    marginLeft: 3,
                    lineHeight: 0.7,
                  }}
                >
                  🍇
                </Span>
              </A>
            )}
          </Div>
        )}
      </Div>
    </Div>
  )
}

"use client"

import clsx from "clsx"
import { lazy, Suspense } from "react"
import { useAppContext } from "./context/AppContext"
import Img from "./Image"
import { CircleCheck, CircleEllipsis } from "./icons"
import LanguageSwitcher from "./LanguageSwitcher"
import Menu from "./Menu"
import { ANALYTICS_EVENTS } from "./utils/analyticsEvents"

// Lazy load heavy components to reduce initial bundle
const Subscribe = lazy(() => import("./Subscribe"))
const SignIn = lazy(() => import("./SignIn"))
const CharacterProfiles = lazy(() => import("./CharacterProfiles"))

import A from "./a/A"
import {
  useApp,
  useAuth,
  useChat,
  useNavigationContext,
} from "./context/providers"
import { useStyles } from "./context/StylesContext"
import { useTimerContext } from "./context/TimerContext"
import { Button, Div, H1, Main, Span, usePlatform, useTheme } from "./platform"
import Version from "./Version"

export function WatermelonButton({
  size = 22,
  style,
}: {
  size?: number
  style?: React.CSSProperties
}) {
  const { viewPortWidth } = usePlatform()
  const { t } = useAppContext()
  const { user, guest, siteConfig, setShowWatermelon, hasHydrated, ...auth } =
    useAuth()

  const { utilities } = useStyles()

  if (!hasHydrated) return null
  return (
    <A
      onClick={() => {
        setShowWatermelon(true)
      }}
      openInNewTab
      className="link"
      event={ANALYTICS_EVENTS.WM_BYOK_CLICK}
      href={siteConfig.isWatermelon ? "/" : "/watermelon"}
      style={{
        ...utilities.link.style,
        fontSize: "0.8rem",

        position: "relative",
        display: "flex",
        alignItems: "center",
        ...style,
      }}
    >
      <Img slug="watermelon" size={size} /> BYOK ({t("Free")})
      {user?.apiKeys?.openrouter || guest?.apiKeys?.openrouter ? (
        <CircleCheck color="var(--accent-4)" size={14} />
      ) : null}
    </A>
  )
}
export default function Skeleton({
  className,
  children,
  showThreads = true,
}: {
  className?: string
  children?: React.ReactNode
  showThreads?: boolean
}): React.ReactElement {
  const { isCapacitor, os, viewPortWidth } = usePlatform()
  const { time, isCountingDown } = useTimerContext()
  const { t } = useAppContext()

  // Split contexts for better organization

  // Auth context

  // Chat context
  const { isEmpty } = useChat()

  // Navigation context
  const { pathname, setIsNewChat, hasNotification, push } =
    useNavigationContext()

  const { isDrawerOpen, setIsDrawerOpen, isSmallDevice, isMobileDevice } =
    useTheme()

  // Platform context
  const { isStandalone, isTauri } = usePlatform()

  // Data context

  const {
    threadIdRef,
    isIDE,
    getAppSlug,
    getTribeUrl,
    FRONTEND_URL,
    rtl,
    hasHydrated,
    ...auth
  } = useAuth()

  const showTribeProfile = auth.showTribeProfile && !auth.postId && isEmpty

  const threadId = threadIdRef.current

  // App context
  const { app, isAgentModalOpen } = useApp()

  // Theme context
  const { addHapticFeedback } = useTheme()

  const toggleMenu = () => {
    addHapticFeedback()
    setIsDrawerOpen(!isDrawerOpen)
  }

  // Call ALL hooks sssbefore any conditional returns
  const { skeletonStyles, utilities } = useStyles()

  return (
    <Div
      id="skeleton"
      className={clsx(className)}
      style={{
        ...skeletonStyles.page.style,
        paddingLeft: !isSmallDevice && isDrawerOpen && !rtl ? 255 : undefined,
        paddingRight: !isSmallDevice && isDrawerOpen && rtl ? 255 : undefined,
        background: "transparent",
        // paddingTop: isCapacitor && os === "ios" ? 40 : undefined,
      }}
    >
      <Div
        style={{
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          display: "flex",
        }}
      >
        <Version />
        <Menu showThreads={showThreads} />
        <Main
          style={{
            ...{
              padding: 10,
              paddingTop: 50,
              display: "flex",
              flexDirection: "column",
              flex: 1,
              height: "100dvh",
            },
            ...{
              display: "flex",
            },
          }}
        >
          <Div
            className="blur"
            data-tauri-drag-region
            onDoubleClick={async () => {
              if (!isTauri) return
              try {
                const { getCurrentWindow } = await import(
                  "@tauri-apps/api/window"
                )
                const appWindow = getCurrentWindow()
                const isMaximized = await appWindow.isMaximized()
                if (isMaximized) {
                  await appWindow.unmaximize()
                } else {
                  await appWindow.maximize()
                }
              } catch (_e) {
                // Tauri API not available
              }
            }}
            style={{
              ...skeletonStyles.header.style,
              ...(hasHydrated &&
                isStandalone &&
                skeletonStyles.headerStandalone.style),
              ...(hasHydrated &&
              isCapacitor &&
              os === "ios" &&
              (!threadId || isEmpty)
                ? { paddingTop: 55 }
                : {}),
              ...(hasHydrated &&
              isCapacitor &&
              os === "ios" &&
              (threadId || !isEmpty)
                ? {
                    position: "fixed",
                    top: 0,
                    paddingTop: 50,
                    backgroundColor: "var(--background)",
                  }
                : {}),
              ...{
                backgroundColor: "none",
              },
            }}
          >
            {isIDE ? (
              <></>
            ) : (
              <>
                <Div style={{ ...skeletonStyles.hamburgerMenu.style }}>
                  <Div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      paddingTop:
                        hasHydrated && !isDrawerOpen && isTauri && !rtl
                          ? "1.4rem"
                          : "0",
                    }}
                  >
                    {!isDrawerOpen && (
                      <Button
                        className="link"
                        style={{
                          ...skeletonStyles.hamburgerButton.style,
                          ...utilities.link,
                        }}
                        onClick={toggleMenu}
                      >
                        {hasNotification && (
                          <Span
                            style={{ ...skeletonStyles.notification.style }}
                          />
                        )}
                        <CircleEllipsis
                          strokeWidth={1.5}
                          color="var(--accent-1)"
                          size={24}
                        />
                      </Button>
                    )}
                    {!isDrawerOpen ? (
                      <Div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <A
                          className="link"
                          href={
                            showTribeProfile
                              ? getTribeUrl()
                              : app
                                ? getAppSlug(app)
                                : "/"
                          }
                          style={{
                            ...utilities.link.style,
                            ...skeletonStyles.hamburgerButton.style,
                            marginRight: 15,
                          }}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey) {
                              return
                            }
                            e.preventDefault()
                            if (showTribeProfile) {
                              setIsNewChat({
                                value: true,
                                to: getTribeUrl(app),
                                tribe: true,
                              })
                              return
                            }

                            setIsNewChat({
                              value: true,
                            })
                          }}
                        >
                          <Img
                            key={app?.id || "vex"}
                            app={showTribeProfile ? undefined : app}
                            size={28}
                            slug={showTribeProfile ? "tribe" : undefined}
                            priority
                          />
                          <H1
                            key={`title-${app?.id || "vex"}`}
                            style={{ ...skeletonStyles.brand.style }}
                          >
                            {t(showTribeProfile ? "Tribe" : app?.name || "Vex")}
                          </H1>
                        </A>
                      </Div>
                    ) : null}

                    {isDrawerOpen && !isMobileDevice && (
                      <WatermelonButton
                        style={{
                          ...(viewPortWidth < 400 || isDrawerOpen
                            ? {
                                marginLeft: 0,
                                marginRight: rtl ? (isDrawerOpen ? 0 : -5) : 0,
                                marginTop: -7.5,
                                gap: 5,
                                left: rtl ? 0 : 250,
                                right: rtl ? 250 : 0,
                              }
                            : {}),
                        }}
                      />
                    )}
                  </Div>
                </Div>
                <Suspense fallback={null}>
                  <Div
                    style={{
                      ...skeletonStyles.right.style,
                      display: "flex",
                      paddingTop: isTauri && rtl ? "1.3rem" : "0",
                    }}
                  >
                    <CharacterProfiles />

                    <Suspense fallback={null}>
                      <Subscribe />
                    </Suspense>

                    <SignIn
                      style={{
                        display: isMobileDevice ? "none" : undefined,
                      }}
                      showSignIn={false}
                    />

                    <LanguageSwitcher />
                  </Div>
                </Suspense>
              </>
            )}
          </Div>
          <Div
            style={{
              ...skeletonStyles.contentContainer.style,
              position: "relative",
              paddingTop: isTauri && rtl ? "1.2rem" : "0.2rem",
            }}
          >
            <>{children}</>
          </Div>
        </Main>
      </Div>
    </Div>
  )
}

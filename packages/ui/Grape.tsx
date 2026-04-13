import { lazy, useEffect, useState } from "react"
import { Trans } from "react-i18next"
import { SiBuymeacoffee, SiMacos } from "react-icons/si"
import AppLink from "./AppLink"
import A from "./a/A"
import ColorScheme from "./ColorScheme"
import { useAppContext } from "./context/AppContext"
import { useAuth, useNavigationContext } from "./context/providers"
import { COLORS } from "./context/providers/AppProvider"
import { useStyles } from "./context/StylesContext"
import { useTheme } from "./context/ThemeContext"

const Hippo = lazy(() => import("./Hippo"))

import Img from "./Image"
import { CirclePause, CirclePlay } from "./icons"
import LanguageSwitcher from "./LanguageSwitcher"
import Loading from "./Loading"
import LocalSetupScreen from "./LocalSetupScreen"
import { Button, Div, H1, Span, toast, usePlatform } from "./platform"

const SignIn = lazy(() => import("./SignIn"))
const Subscribe = lazy(() => import("./Subscribe"))

import ThemeSwitcher from "./ThemeSwitcher"
import Ticker from "./Ticker"
import { VERSION } from "./utils"
import { ANALYTICS_EVENTS } from "./utils/analyticsEvents"
import Weather from "./Weather"

// Tauri injects this global — safe to check at runtime

// Separate component so hooks aren't violated
function LocalSetupModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 46,
          right: 16,
          zIndex: 1000,
          background: "#27272a",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "6px 12px",
          cursor: "pointer",
          fontSize: "0.8rem",
        }}
      >
        ✕ Close
      </button>
      <LocalSetupScreen onReady={onClose} />
    </div>
  )
}

export default function Watermelon() {
  const [showLocalSetup, setShowLocalSetup] = useState(false)

  const {
    setSignInPart,
    app,
    siteConfig,
    downloadUrl,
    user,
    guest,
    setGuest,
    setUser,
    actions,
    storeApps,
    chrry,
    plausible,
    tickerPaused: paused,
    setTickerPaused: setPaused,
    isAdmin,
    modelId,
    setModelId,
  } = useAuth()

  const [isSavingReplicateApiKey, setIsSavingReplicateApiKey] = useState(false)

  const { t, captureException } = useAppContext()

  const openRouterApiKeyInitialValue =
    user?.apiKeys?.openrouter || guest?.apiKeys?.openrouter || modelId

  const replicateApiKeyInternal =
    user?.apiKeys?.replicate || guest?.apiKeys?.replicate || ""

  const [replicateApiKey, setReplicateApiKey] = useState(
    replicateApiKeyInternal,
  )

  const s3ApiKeyInternal = user?.apiKeys?.s3 || guest?.apiKeys?.s3 || ""

  const [s3ApiKey, setS3ApiKey] = useState(s3ApiKeyInternal)

  const [isSavingS3ApiKey, setIsSavingS3ApiKey] = useState(false)

  const [isDeletingS3ApiKey, setIsDeletingS3ApiKey] = useState(false)

  useEffect(() => {
    setS3ApiKey(s3ApiKeyInternal)
  }, [s3ApiKeyInternal])

  useEffect(() => {
    setReplicateApiKey(replicateApiKeyInternal)
  }, [replicateApiKeyInternal])

  const [openRouterApiKey, setOpenRouterApiKey] = useState(
    openRouterApiKeyInitialValue,
  )

  const handleDeleteS3 = async () => {
    try {
      setIsDeletingS3ApiKey(true)
      if (user) {
        await actions.updateUser({
          deletedApiKeys: ["s3"],
        })

        setUser({
          ...user,
          apiKeys: {
            ...user.apiKeys,
            s3: undefined,
          },
        })

        toast.success("MinIO/S3 API key deleted successfully")
      }

      if (guest) {
        await actions.updateGuest({
          deletedApiKeys: ["s3"],
        })

        toast.success("MinIO/S3 API key deleted successfully")

        setGuest({
          ...guest,
          apiKeys: {
            ...guest.apiKeys,
            s3: undefined,
          },
        })
      }

      setS3ApiKey("")
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
    } finally {
      setIsDeletingS3ApiKey(false)
    }
  }

  // useEffect(() => {
  //   if (!user && !guest) return
  //   plausible({ name: ANALYTICS_EVENTS.WATERMELON })
  // }, [user, guest])

  const { utilities } = useStyles()

  const { isTauri, viewPortWidth, viewPortHeight } = usePlatform()

  const [compact, setCompact] = useState(viewPortHeight < 920)

  useEffect(() => {
    setCompact(viewPortHeight < 920)
  }, [viewPortHeight])

  const { isMobileDevice, colorScheme } = useTheme()

  const { addParams } = useNavigationContext()
  return (
    <>
      <Div
        style={{
          minHeight: "100dvh",
          display: "flex",
          color: "var(--shade-8)",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "0 1rem",
        }}
      >
        <Div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "absolute",
            top: 15,
            right: 15,
            fontSize: "0.9rem",
          }}
        >
          <SignIn showSignIn={false} />
          {/* <Subscribe /> */}
          <LanguageSwitcher />
        </Div>

        {chrry && (
          <Div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              position: "absolute",
              top: 15,
              left: 15,
              fontSize: "0.9rem",
              marginTop: isTauri ? 20 : 0,
            }}
          >
            <AppLink
              app={chrry}
              event={ANALYTICS_EVENTS.WM_APP_LINK_CLICK}
              icon={<Img app={chrry} alt={chrry.name} width={16} height={16} />}
              loading={<Loading size={13} />}
              className="button inverted medium"
              style={{
                padding: "0.3rem 0.6rem",
                fontFamily: "var(--font-sans)",
              }}
            >
              {chrry.name}
            </AppLink>{" "}
          </Div>
        )}

        {isTauri && showLocalSetup ? (
          <LocalSetupModal onClose={() => setShowLocalSetup(false)} />
        ) : (
          <>
            <Div
              style={{
                display: "flex",

                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobileDevice ? 7.5 : 8.5,
              }}
            >
              <Div
                style={{
                  display: "flex",
                  gap: 7.5,
                  alignItems: "center",
                  marginTop: isMobileDevice ? 60 : 20,
                  marginBottom: isMobileDevice ? 15 : 20,
                }}
              >
                <Weather showLocation />
                <A href="/about">
                  <Img icon="heart" size={22} />
                </A>
              </Div>
              <H1
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: 0,
                  fontSize: "1.6rem",
                  gap: 15,
                }}
              >
                <Img width={50} height={50} slug="grape" />
                {t("Grape")}&#169;
                <Button
                  className="link"
                  onClick={() => {
                    setPaused(!paused)
                    plausible({
                      name: ANALYTICS_EVENTS.TICKER_MOTTO_CLICK,
                      props: {
                        app: app?.name,
                        store: app?.store?.name,
                        paused: !paused,
                      },
                    })
                  }}
                  title={paused ? t("Play") : t("Pause")}
                  style={{
                    ...utilities.link.style,
                  }}
                >
                  {paused ? (
                    <CirclePlay color={COLORS.green} size={22} />
                  ) : (
                    <CirclePause color={COLORS.orange} size={22} />
                  )}
                </Button>
              </H1>

              <Div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              ></Div>
            </Div>
            <Div
              style={{
                marginTop: "auto",
                display: "flex",
                gap: ".5rem",
                flexWrap: "wrap",
                flexDirection: "row",
                position: "relative",
                bottom: ".5rem",
                marginBottom: 20,
              }}
            >
              <Div
                style={{
                  display: "flex",
                  gap: ".7rem",
                  flexWrap: "wrap",
                  fontSize: ".85rem",
                }}
              >
                🍀
                <Hippo dataTestId="hippo-wm" />
                <A href="/about">
                  {app?.store?.app?.icon || "🍒"} /{t("about")}
                </A>
                <A href="/privacy">🤫 /{t("privacy")}</A>
                <A
                  event={ANALYTICS_EVENTS.BUY_ME_A_COFFEE_CLICK}
                  href="https://buymeacoffee.com/iliyan"
                  openInNewTab
                  title="Buy me a coffee"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: ".9rem",
                    color: COLORS.orange,
                  }}
                >
                  <SiBuymeacoffee color={COLORS.orange} size={16} />
                  {t("BAM")} 💥
                </A>
              </Div>
            </Div>

            <Div
              style={{
                marginTop: "auto",
                textAlign: "center",
                maxWidth: 500,
                gap: 10,
                display: "flex",
                flexDirection: "column",
                marginBottom: 20,
                fontSize: ".9rem",
              }}
            >
              <Div
                style={{
                  alignSelf: "flex-start",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                {app && (
                  <AppLink
                    app={app}
                    icon={
                      <Img app={app} alt={app.name} width={22} height={22} />
                    }
                    loading={<Loading size={13} />}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "0.25rem 0.5rem",
                    }}
                  >
                    <Span>🌀</Span>
                  </AppLink>
                )}{" "}
                <Ticker
                  style={{
                    color: "var(--shade-6)",
                  }}
                  maxWidth={viewPortWidth - 150}
                  paused={paused}
                />
              </Div>
              {!user && (
                <>
                  <A
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey) {
                        return
                      }

                      e.preventDefault()
                      setSignInPart("login")
                    }}
                    href="/?signIn=login"
                  >
                    <Img alt="Coder" size={22} slug="coder" /> {t("Login")} (
                    {t("Optional")})*
                  </A>
                  <Div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      justifyContent: "center",
                      marginTop: 5,
                    }}
                  >
                    <Img alt="Sushi" size={18} slug="sushi" />
                    {t("Sushi will auto-migrate you when you choose to login")}
                  </Div>
                </>
              )}
              {!isTauri && viewPortHeight >= 800 && (
                <Div>
                  <Div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      justifyContent: "flex-end",
                      marginBottom: 5,
                      fontSize: ".8rem",
                      color: "var(--shade-6)",
                    }}
                  >
                    <A
                      href={
                        siteConfig.storeSlug !== "sushiStore"
                          ? "https://sushi.chrry.ai/jules"
                          : "/jules"
                      }
                      openInNewTab={siteConfig.slug !== "chrry"}
                    >
                      <Img alt="🐙 Jules" size={22} slug="jules" />
                    </A>
                    {t("Sneak peek")}
                    <Button
                      className="inverted"
                      style={{
                        ...utilities.small.style,

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
                  </Div>

                  <Div style={{ fontSize: "0.85rem", color: "var(--shade-7)" }}>
                    💻{" "}
                    <Trans
                      i18nKey="watermelon_macos_info"
                      defaults="Coming soon: A <0>macOS Desktop App</0> with local DB support (MIT Licensed) for fully private configuration."
                      components={[
                        <A
                          event={ANALYTICS_EVENTS.GH_REPO_CLICK}
                          key="macos"
                          openInNewTab
                          href="https://github.com/chrryai/chrry"
                        />,
                      ]}
                    />
                  </Div>
                </Div>
              )}
            </Div>
            <Div
              style={{
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                display: "flex",
                marginBottom: 20,
                marginTop: "auto",
              }}
            >
              <ThemeSwitcher style={{ marginTop: 5 }} />
              <ColorScheme size={22} />
            </Div>
            <Div
              style={{
                fontSize: "0.8rem",
                color: "var(--shade-7)",
                display: "flex",
                gap: 5,
                marginBottom: isMobileDevice ? 25 : 25,
              }}
            >
              <Img icon={"whale"} size={24} />{" "}
              <Span>v{app?.version || VERSION}</Span>
            </Div>
          </>
        )}
      </Div>
    </>
  )
}

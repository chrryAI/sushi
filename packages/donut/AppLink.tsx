import React, { type CSSProperties, useEffect } from "react"
import A from "./a/A"
import { useAuth, useChat, useNavigationContext } from "./context/providers"
import { Button, Span } from "./platform"
import type { sushi } from "./types"
import { ANALYTICS_EVENTS } from "./utils/analyticsEvents"

export default function AppLink({
  style,
  app,
  children,
  onLoading,
  loading,
  className,
  title,
  as = "a",
  loadingStyle,
  isPear = false,
  href,
  icon,
  event = ANALYTICS_EVENTS.APP_LINK_CLICK,
  openInNewTab = false,
  dataTestId,
  ...props
}: {
  title?: string
  appId?: string
  style?: CSSProperties
  app: sushi
  children?: React.ReactNode
  as?: "a" | "button"
  onLoading?: () => void
  loading?: React.ReactNode
  event?: string
  className?: string
  loadingStyle?: CSSProperties
  isTribe?: boolean
  isPear?: boolean
  icon?: React.ReactNode
  openInNewTab?: boolean
  dataTestId?: string
  href?: string
  setIsNewAppChat?: (item: sushi) => void
  onClick?: (e: React.MouseEvent) => void
}) {
  const { setIsNewChat } = useChat()

  const isTribe = !href && props.isTribe
  const {
    loadingApp,
    getAppSlug,
    setLoadingApp,
    storeApps,
    mergeApps,
    plausible,
  } = useAuth()

  const [isLoadingInternal, setIsLoadingInternal] = React.useState(
    loadingApp && loadingApp?.id === app?.id,
  )

  const isLoading = isLoadingInternal || loadingApp?.id === app?.id

  const setIsLoading = (value: boolean) => {
    setIsLoadingInternal(value)
  }

  const { push } = useNavigationContext()

  const currentApp = storeApps.find(
    (a) => app.id && a.id === app?.id && a.store?.apps?.length,
  )

  React.useEffect(() => {
    if (!isLoading || loadingApp) return
    if (currentApp?.id !== app.id) return

    setIsLoading(false)

    if (props.setIsNewAppChat) {
      props.setIsNewAppChat(app)
      return
    }

    if (href) {
      push(href)
      return
    }

    setIsNewChat({
      value: true,
      to: href ?? getAppSlug(app),
      tribe: isTribe,
      pear: isPear,
    })
  }, [currentApp, loadingApp, isTribe, isPear, href])

  useEffect(() => {
    const sa = storeApps.find((a) => a.id === app.id)
    if (sa) return

    mergeApps([app])
  }, [app, mergeApps, storeApps])

  if (as === "a") {
    return (
      <A
        dataTestId={dataTestId}
        openInNewTab={openInNewTab}
        title={title}
        aria-label={title}
        href={href || getAppSlug(app)}
        style={{
          ...style,
          ...(isLoading ? loadingStyle : {}),
        }}
        onClick={(e: React.MouseEvent) => {
          if (e.metaKey || e.ctrlKey) {
            return
          }

          props.onClick?.(e)

          setIsLoading(true)
          e.preventDefault()

          if (!currentApp) {
            setLoadingApp(app)
            onLoading?.()

            setIsLoading(true)
            return
          }

          if (props.setIsNewAppChat) {
            setIsLoading(false)
            props.setIsNewAppChat(app)
            return
          }

          if (href) {
            setIsLoading(false)
            push(href)
            return
          }

          setIsLoading(false)
          setIsNewChat({
            value: true,
            to: href ?? getAppSlug(app),
            tribe: isTribe,
            pear: isPear,
          })
        }}
        className={`${className}`}
      >
        {isLoading ? <>{loading}</> : icon && <>{icon}</>}
        <>{children}</>
      </A>
    )
  }

  return (
    <Button
      data-testid={dataTestId}
      aria-label={title}
      style={{
        ...style,
        ...(isLoading ? loadingStyle : {}),
      }}
      onClick={() => {
        if (event) {
          plausible({ name: event, props: { app: app.name } })
        }

        if (!currentApp) {
          setLoadingApp(app)
          onLoading?.()
          return
        }

        if (props.setIsNewAppChat) {
          props.setIsNewAppChat(app)
          return
        }

        setIsNewChat({
          value: true,
          to: getAppSlug(app),
          tribe: isTribe,
          pear: isPear,
        })
      }}
      className={`${className}`}
    >
      {isLoading && loading ? (
        <Span>{loading}</Span>
      ) : (
        icon && <Span>{icon}</Span>
      )}
      <>{children}</>
    </Button>
  )
}

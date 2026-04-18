"use client"

/// <reference types="chrome" />

import { useCallback, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import A from "./a/A"
import { useAppContext } from "./context/AppContext"
import {
  useApp,
  useAuth,
  useChat,
  useNavigationContext,
} from "./context/providers"
import { useStyles } from "./context/StylesContext"
import { useEnableNotificationsStyles } from "./EnableNotifications.styles"
import Img from "./Image"
import { BellRing } from "./icons"
import { addPushSubscription } from "./lib"
import { Button, Div, Span, usePlatform } from "./platform"
import type { customPushSubscription } from "./types"
import { apiFetch, getEnv } from "./utils"
import registerServiceWorker, {
  subscribeToPushNotifications,
} from "./utils/registerServiceWorker"
import Weather from "./Weather"

export default function EnableNotifications({
  text = "Notifications",
  onLocationClick,
}: {
  text?: string
  onLocationClick?: (location: string) => void
}) {
  const [isMounted, setIsMounted] = useState(false)

  const styles = useEnableNotificationsStyles()

  // Split contexts for better organization
  const { t } = useAppContext()

  const { isManagingApp, setAppStatus } = useApp()

  const { isExtension } = usePlatform()

  // Auth context
  const {
    user,
    token,
    guest,
    API_URL,
    accountApp,
    getAppSlug,
    app,
    setSignInPart,
    swRegistration,
    isSubscribed,
    setIsSubscribed,
    pushSubscription,
    setPushSubscription,
  } = useAuth()

  const last = user?.lastMessage || guest?.lastMessage

  // Platform context
  const { os, isStandalone, device } = usePlatform()

  const { setIsNewAppChat } = useChat()

  const { setShowAddToHomeScreen, pathname } = useNavigationContext()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const storeApp = accountApp

  const { utilities } = useStyles()

  const StoreApp = useCallback(
    ({ icon }: { icon?: boolean }) =>
      storeApp && (
        <A
          data-testid={`app-${storeApp.slug}`}
          className={`${icon ? "link" : "button transparent"}`}
          style={{
            ...(icon
              ? utilities.link.style
              : { ...utilities.button.style, ...utilities.transparent.style }),
            ...utilities.small.style,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
          href={getAppSlug(storeApp)}
          onClick={(e) => {
            e.preventDefault()

            setIsNewAppChat({ item: storeApp })
            setAppStatus(undefined)
            if (e.metaKey || e.ctrlKey) {
              return
            }
          }}
        >
          <Img app={storeApp} showLoading={false} size={24} />
          <Span>{storeApp?.name}</Span>
        </A>
      ),
    [storeApp],
  )

  const handleSubscribe = async () => {
    if (!user) {
      setSignInPart("login")
      return
    }
    // Handle extension notifications - just request permission, no database storage
    if (!isStandalone && (os === "ios" || os === "android")) {
      setShowAddToHomeScreen(true)
      return
    }
    if (swRegistration && !pushSubscription) {
      const publicVapidKey = getEnv().VITE_VAPID_PUBLIC_KEY

      if (!publicVapidKey) {
        toast.error("VAPID key missing - notifications cannot be enabled")
        return
      }

      try {
        const subscription = await subscribeToPushNotifications(
          swRegistration,
          publicVapidKey,
        )
        if (subscription) {
          setIsSubscribed(true)

          const p256dh = subscription.getKey("p256dh")
          const auth = subscription.getKey("auth")

          if (user && token && p256dh && auth) {
            addPushSubscription({ subscription, p256dh, auth, token, API_URL })
          }
          toast.success("Notifications enabled!")
        }
      } catch (subscribeError) {
        const errorMsg =
          subscribeError instanceof Error
            ? subscribeError.message
            : "Unknown error"
        if (errorMsg.includes("timeout")) {
          toast.error("Push service timeout - try again later")
        } else {
          toast.error("Failed to enable notifications")
        }
      }
    }
  }

  if (!last) return null
  if (!isMounted || isManagingApp) return null

  // Show notification button for extensions if permission not granted, for web if service worker ready
  const shouldShow = !isExtension && !isSubscribed && !!swRegistration
  return (
    <Div style={styles.enableNotificationsContainer.style}>
      <Weather onLocationClick={onLocationClick} showLocation={!shouldShow} />
      {isMounted && shouldShow && (
        <Div style={styles.enableNotifications.style}>
          <Button
            data-testid="enableNotificationsButton"
            onClick={handleSubscribe}
            className={"small"}
            style={styles.enableNotificationsButton.style}
            disabled={!swRegistration}
          >
            <BellRing size={16} /> {t(text)}
          </Button>
        </Div>
      )}
    </Div>
  )
}

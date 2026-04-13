"use client"

import { t } from "i18next"
import pLimit from "p-limit"
import React, {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import toast from "react-hot-toast"

import useSWR from "swr"
import { v4 as uuidv4, validate } from "uuid"
import {
  initializeGoogleAuth,
  appleSignIn as nativeAppleSignIn,
  googleSignIn as nativeGoogleSignIn,
} from "../../auth/capacitorAuth"
import { useHasHydrated, useLocalStorage } from "../../hooks"
import useCache from "../../hooks/useCache"
import i18n from "../../i18n"
import {
  type apiActions,
  getActions,
  getApp,
  getGuest,
  getSession,
  getUser,
  updateUser,
} from "../../lib"
import { defaultLocale, type locale, locales } from "../../locales"
import {
  isBrowserExtension,
  storage,
  useCookie,
  useNavigation,
  usePlatform,
} from "../../platform"

import type {
  affiliateStats,
  aiAgent,
  characterProfile,
  envType,
  instruction,
  instructionBase,
  mood,
  moodType,
  Paginated,
  paginatedMessages,
  paginatedTribePosts,
  paginatedTribes,
  scheduledJob,
  session,
  sessionGuest,
  sessionUser,
  spatialNavigationEntry,
  storeWithApps,
  sushi,
  swarm,
  thread,
  timer,
  tribe,
  tribePostWithDetails,
  user,
  weather,
} from "../../types"
import * as utils from "../../utils"
import {
  ANALYTICS_EVENTS,
  MEANINGFUL_EVENTS,
} from "../../utils/analyticsEvents"
import { hasStoreApps, merge } from "../../utils/appUtils"
import clearLocale, { cleanSlug } from "../../utils/clearLocale"
import { dailyQuestions as dailyQuestionsUtil } from "../../utils/dailyQuestions"
import getAppSlugUtil from "../../utils/getAppSlug"
import { getHourlyLimit } from "../../utils/getHourlyLimit"
import { getWeatherCacheTime } from "../../utils/getWeatherCacheTime"
import console from "../../utils/log"
import {
  getSiteConfig,
  type SiteConfig,
  tribe as tribeSiteConfig,
  whiteLabels,
} from "../../utils/siteConfig"
import ago from "../../utils/timeAgo"
import { excludedSlugRoutes } from "../../utils/url"
import type { Task } from "../TimerContext"
import type { AppStatus } from "./AppProvider"
import { useError } from "./ErrorProvider"

// Constants (shared with DataProvider)

export type { session }

// Create a dedicated low-priority queue for analytics so it doesn't block SWR data fetching
const analyticsLimit = pLimit(1)

const VERSION = "2.3.73"

const AuthContext = createContext<
  | {
      CREDITS_PRICE: number
      versions?: {
        webVersion: string
        firefoxVersion: string
        chromeVersion: string
        macosVersion: string
      }
      isAdmin: boolean
      isDonutOpen: boolean
      setIsDonutOpen: (value: boolean) => void
      push: (href: string) => void
      tickerPaused: boolean
      setTickerPaused: (value: boolean) => void
      isE2E: boolean
      setTribes: (tribes?: paginatedTribes) => void
      setTribePosts: (tribePosts?: paginatedTribePosts) => void
      setTribePost: (tribePost?: tribePostWithDetails) => void
      hourlyLimit: number
      hourlyUsageLeft: number
      about: string | undefined
      canShowTribe: boolean
      earnBadge: boolean
      setEarnBadge: (value: boolean) => void
      showWatermelonInitial: boolean
      hasHydrated: boolean
      modelId: string | undefined
      swarm?: swarm
      setSwarm: (value: swarm | undefined) => void
      setModelId: (value: string | undefined) => void
      actions: apiActions
      donut?: boolean
      setAbout: (value: string | undefined) => void
      ask: string | undefined
      setAsk: (value: string | undefined) => void
      displayedApps: sushi[]
      setDisplayedApps: Dispatch<SetStateAction<sushi[]>>
      lastAnchorApp: {
        appId: string
        appName: string
        timestamp: number
        duration?: number
      } | null
      commentAppId?: string
      setCommentAppId: (value: string | undefined) => void
      showWatermelon: boolean
      setShowWatermelon: (value: boolean) => void
      showGrape: boolean
      setShowGrape: (value: boolean) => void
      refetchAffiliateData: () => Promise<void>
      isDevelopment: boolean
      wasPear: boolean
      setWasPear: (value: boolean) => void
      canShowAllTribe: boolean
      languageModal: string | undefined
      from: string
      setFrom: (value: string) => void
      setLanguageModal: (value: string | undefined) => void
      fetchTimer: () => Promise<void>
      timer?: timer | null
      tribeSlug?: string
      currentTribe?: tribe
      selectedInstruction: instructionBase | null
      setSelectedInstruction: (instruction: instructionBase | null) => void
      getTribeUrl: (app?: sushi) => string
      rtl: boolean
      mergeApps: (apps: sushi[]) => void
      postId?: string
      tribes?: paginatedTribes
      setShowTribe: (show: boolean) => void
      showTribe: boolean | undefined
      setSkipAppCacheTemp: (show: boolean) => void
      skipAppCacheTemp: boolean | undefined
      tribePosts?: paginatedTribePosts
      tribePost?: tribePostWithDetails
      postToTribe: boolean
      setPostToTribe: (value: boolean) => void
      postToMoltbook: boolean
      setPostToMoltbook: (value: boolean) => void
      moltPlaceHolder: string[]
      setMoltPlaceHolder: (value: string[]) => void
      setTimer: Dispatch<SetStateAction<timer | undefined | null>>
      chromeWebStoreUrl: string
      affiliateStats: affiliateStats | null | undefined
      affiliateCode: string | null
      loadingAffiliateStats: boolean
      downloadUrl: string
      isRetro: boolean
      setNeedsUpdateModalOpen: (value: boolean) => void
      needsUpdateModalOpen: boolean
      needsUpdate: boolean
      grape: sushi | undefined
      setIsRetro: (value: boolean) => void
      accountApps: sushi[]
      isIDE: boolean
      toggleIDE: () => void
      instructions?: instruction[]
      setInstructions: (value?: instruction[]) => void
      burning: boolean
      burnApp?: sushi
      setDeviceId: (value: string) => void
      pear: sushi | undefined
      refetchWeather: () => void
      weather?: weather
      isPear: boolean
      setPear: (value: sushi | undefined, navigate?: boolean) => void
      grapes: sushi[]
      setIsProgramme: (value: boolean) => void
      showTribeProfile: boolean
      patchCharacterProfile: (value: {
        newProfile: boolean
        onError?: () => void
        onSuccess?: () => void
      }) => Promise<void>
      isUpdatingCharacterProfile: boolean
      setIsUpdatingCharacterProfile: (value: boolean) => void
      MAX_FILE_LIMITS: {
        artifacts: number
        chat: number
      }
      OWNER_CREDITS: number
      // Daily Questions State
      dailyQuestionData: {
        currentQuestion: string
        sectionTitle: string
        appTitle: string
        isLastQuestionOfSection: boolean
        questions: string[]
      } | null
      advanceDailySection: () => void
      setDailyQuestionIndex: (index: number) => void
      dailyQuestionIndex: number
      burn: boolean
      setBurn: (value: boolean) => void
      canBurn: boolean
      isProgramme: boolean
      siteConfig: SiteConfig
      isManagingApp: boolean
      minimize: boolean
      setMinimize: (value: boolean) => void
      setIsManagingApp: (value: boolean) => void
      isRemovingApp: boolean
      setIsRemovingApp: (value: boolean) => void
      accountApp: sushi | undefined
      loadingAppId: string | undefined
      setLoadingAppId: (value: string | undefined) => void
      hasStoreApps: (item: sushi | undefined) => boolean
      threads?: {
        threads?: thread[]
        totalCount: number
      }
      isHippoOpen: string | undefined
      setIsHippoOpen: (value: string | undefined) => void
      appStatus: AppStatus | undefined
      setAppStatus: (appStatus: AppStatus | undefined, path?: string) => void
      lastApp: sushi | undefined
      setAccountApp: (value: sushi | undefined) => void
      setThreadId: (value: string | undefined) => void
      threadIdRef: React.RefObject<string | undefined>
      setHasNotification: (value: boolean) => void
      lasProcessedSession: React.RefObject<string | undefined>
      setThreads: (value: { threads: thread[]; totalCount: number }) => void
      migratedFromGuestRef: React.RefObject<boolean>
      fetchApps: () => Promise<void>
      isLoadingApps: boolean
      showGrapeInitial: boolean
      isSplash: boolean
      setIsSplash: (value: boolean) => void
      findAppByPathname: (path: string, apps: sushi[]) => sushi | undefined
      setShowFocus: (showFocus: boolean) => void
      showFocus: boolean | undefined | null
      isLoadingTasks: boolean
      setIsLoadingPosts: (value: boolean) => void
      isLoadingPosts: boolean
      setIsP: (value: boolean) => void
      isP: boolean
      fetchTasks: () => Promise<void>
      tasks?: {
        tasks: Task[]
        totalCount: number
        hasNextPage: boolean
        nextPage: number | null
      }
      setTasks: React.Dispatch<
        React.SetStateAction<
          | {
              tasks: Task[]
              totalCount: number
              hasNextPage: boolean
              nextPage: number | null
            }
          | undefined
        >
      >
      tribeStripeSession: { sessionId: string; totalPrice: number } | undefined
      setTribeStripeSession: (props?: {
        sessionId: string
        totalPrice: number
      }) => void
      selectedAgent?: aiAgent | null
      setSelectedAgent: (value: aiAgent | undefined | null) => void
      userSelectedAgent?: aiAgent | null
      setUserSelectedAgent: (value: aiAgent | undefined | null) => void
      threadId?: string
      taskId?: string
      updateMood: ({ type }: { type: moodType }) => Promise<void>
      focus: sushi | undefined
      sushi: sushi | undefined
      appAgent?: aiAgent
      favouriteAgent?: aiAgent
      sushiAgent: aiAgent | undefined
      peachAgent: aiAgent | undefined
      freeAgent: aiAgent | undefined
      claudeAgent: aiAgent | undefined
      deepSeekAgent: aiAgent | undefined
      perplexityAgent: aiAgent | undefined
      thread?: thread
      setThread: (thread?: thread) => void
      fetchMood: () => Promise<void>
      bloom: sushi | undefined
      isLoadingMoods: boolean
      mood: mood | null
      back: sushi | undefined
      setMood: (mood: mood | null) => void
      moods: {
        moods: mood[]
        totalCount: number
        hasNextPage: boolean
        nextPage: number | null
      }

      isLoadingMood: boolean
      timeAgo: typeof ago
      fetchMoods: () => Promise<void>
      enableNotifications?: boolean
      setEnableNotifications: (enableNotifications?: boolean) => void
      defaultInstructions: instructionBase[]
      isSavingApp: boolean
      setIsSavingApp: (isSavingApp: boolean) => void
      setNewApp: (newApp: sushi | undefined) => void
      newApp?: sushi
      scheduledJobs?: scheduledJob[]
      setScheduledJobs: (scheduledJobs: scheduledJob[]) => void
      fetchScheduledJobs: () => Promise<void>
      isLoadingScheduledJobs: boolean
      vex: sushi | undefined
      lastAppId?: string
      zarathustra: sushi | undefined
      atlas: sushi | undefined
      popcorn: sushi | undefined
      TEST_MEMBER_EMAILS?: string[]
      TEST_MEMBER_FINGERPRINTS: string[]
      setPostId: (postId: string | undefined) => void
      creditsLeft?: number
      setCreditsLeft: (value?: number) => void
      TEST_GUEST_FINGERPRINTS: string[]
      storeApp: sushi | undefined
      chrry: sushi | undefined
      store: storeWithApps | undefined
      stores: Paginated<storeWithApps> | undefined
      setStore: (store: storeWithApps | undefined) => void
      setStores: (stores: Paginated<storeWithApps> | undefined) => void
      chrryUrl: string
      aiAgents: aiAgent[]
      loadingApp: sushi | undefined
      setLoadingApp: (loadingApp: sushi | undefined) => void
      app: sushi | undefined
      setApp: (app: sushi | undefined) => void
      apps: sushi[]
      storeApps: sushi[] // All apps from all stores
      storeAppsSwr?: sushi
      setSlug: (slug: string | undefined) => void
      setApps: (apps: sushi[]) => void
      getAppSlug: (app: sushi, defaultSlug?: string) => string
      characterProfilesEnabled?: boolean
      isExtensionRedirect: boolean
      showGrapes: boolean
      setShowGrapes: (value: boolean) => void
      signInContext?: (
        provider: "google" | "apple" | "github" | "credentials",
        options: {
          email?: string
          password?: string
          redirect?: boolean
          callbackUrl: string
          errorUrl: string
        },
      ) => Promise<any>
      signOutContext?: (options: {
        callbackUrl: string
        errorUrl?: string
      }) => Promise<any>
      language: locale
      isCI: boolean
      appId?: string
      baseApp: sushi | undefined
      setLanguage: (language: locale) => void
      memoriesEnabled?: boolean
      setMemoriesEnabled?: (memoriesEnabled: boolean) => void
      characterProfiles?: characterProfile[]
      setCharacterProfiles?: (characterProfiles: characterProfile[]) => void
      showCharacterProfiles?: boolean
      setShowCharacterProfiles: (showCharacterProfiles: boolean) => void
      isLiveTest?: boolean
      signOut: () => Promise<void>
      onSetLanguage?: (pathWithoutLocale: string, language: locale) => void
      hasNotification: boolean
      isLoading?: boolean
      updatedApp?: sushi
      setUpdatedApp: (updatedApp: sushi | undefined) => void
      setIsLoading: (isLoading: boolean) => void
      fetchSession: () => Promise<void>
      setUser: (user?: sessionUser) => void
      setGuest: (guest?: sessionGuest) => void
      slug?: string
      PRO_PRICE: number
      PLUS_PRICE: number
      FREE_DAYS: number
      ADDITIONAL_CREDITS: number
      plausible: (e: {
        name: string
        url?: string
        domain?: string
        props?: Record<string, any>
      }) => void
      profile?: sessionUser | undefined
      setProfile: (profile: sessionUser | undefined) => void
      shouldFetchSession: boolean
      setShouldFetchSession: (shouldFetchSession: boolean) => void
      refetchSession: (app?: sushi) => Promise<void>
      refetchAccountApps: () => Promise<void>
      setFingerprint: (fingerprint?: string) => void
      deviceId?: string
      fingerprint?: string
      gift?: string
      wasGifted?: boolean
      setWasGifted?: (wasGifted: boolean) => void
      isGuestTest?: boolean
      isMemberTest?: boolean
      token?: string
      user?: sessionUser
      session?: session
      guest?: sessionGuest
      threadData?: { thread: thread; messages: paginatedMessages }
      signInPart: "login" | "register" | "credentials" | undefined
      setToken: (token?: string) => void
      setSignInPart: (
        part: "login" | "register" | "credentials" | undefined,
      ) => void
      env: envType
      setEnv: (env: envType) => void
      API_URL: string
      WS_URL: string
      FRONTEND_URL: string
      PROD_FRONTEND_URL: string
      GUEST_TASKS_COUNT: number
      PLUS_TASKS_COUNT: number
      MAX_FILE_SIZES: typeof utils.MAX_FILE_SIZES
      PROMPT_LIMITS: typeof utils.PROMPT_LIMITS
    }
  | undefined
>(undefined)

export function AuthProvider({
  children,
  onSetLanguage,
  error,
  locale,
  translations,
  tribes: initialTribes,
  tribePosts: initialTribePosts,
  tribePost: initialTribePost,
  testConfig,
  isBot,
  donut,
  ...props
}: {
  translations?: Record<string, any>
  locale?: locale
  apiKey?: string
  pathname?: string // SSR pathname for thread ID extraction
  onSetLanguage?: (pathWithoutLocale: string, language: locale) => void
  children: ReactNode
  fingerprint?: string
  gift?: string
  donut?: boolean
  error?: string
  session?: session
  isBot?: boolean
  app?: sushi
  tribes?: paginatedTribes
  tribePosts?: paginatedTribePosts
  tribePost?: tribePostWithDetails
  showTribe?: boolean
  deviceId?: string
  accountApp?: sushi
  testConfig?: { [key: string]: string[] }
  searchParams?: Record<string, string> & {
    get: (key: string) => string | null
    has: (key: string) => boolean
    toString: () => string
  } // URL search params with URLSearchParams-compatible API
  siteConfig?: ReturnType<typeof getSiteConfig>
  threads?: {
    threads: thread[]
    totalCount: number
  }
  thread?: { thread: thread; messages: paginatedMessages }
}) {
  const [wasGifted, setWasGifted] = useState<boolean>(false)
  const [session, setSession] = useState<session | undefined>(props.session)

  const {
    searchParams: sp,
    removeParams,
    pathname: pn,
    addParams,
    ...router
  } = useNavigation()
  const {
    isExtension,
    isStandalone,
    isFirefox,
    device,
    os,
    browser,
    isCapacitor,
    isStorageReady,
    isTauri,
    // IDE state from platform
    isIDE,
    toggleIDE,
  } = usePlatform()

  const [API_URL, setAPI_URL] = useState(utils.API_URL)
  const [MAX_FILE_LIMITS, setMAX_FILE_LIMITS] = useState(utils.MAX_FILE_LIMITS)
  const [OWNER_CREDITS, setOWNER_CREDITS] = useState(utils.OWNER_CREDITS)

  const [MAX_FILE_SIZES, setMAX_FILE_SIZES] = useState(utils.MAX_FILE_SIZES)
  const [PRO_PRICE, setPRO_PRICE] = useState(utils.PRO_PRICE)
  const [PLUS_PRICE, setPLUS_PRICE] = useState(utils.PLUS_PRICE)
  const [FREE_DAYS, setFREE_DAYS] = useState(utils.FREE_DAYS)
  const [ADDITIONAL_CREDITS, setADDITIONAL_CREDITS] = useState(
    utils.ADDITIONAL_CREDITS,
  )

  const [CHRRY_URL, setCHRRY_URL] = useState(utils.CHRRY_URL)

  const siteConfig = props.siteConfig
    ? props.siteConfig
    : getSiteConfig(CHRRY_URL)

  const [CREDITS_PRICE, setCREDITS_PRICE] = useState(utils.CREDITS_PRICE)
  const [FRONTEND_URL, setFRONTEND_URL] = useState(utils.FRONTEND_URL)
  const [isCI, setIsCI] = useState(utils.isCI)
  const [isDevelopment, setIsDevelopment] = useState(utils.isDevelopment)
  const [isE2E, setIsE2E] = useState(utils.isE2E)
  const [PROD_FRONTEND_URL, setPROD_FRONTEND_URL] = useState(
    siteConfig.url || utils.PROD_FRONTEND_URL,
  )
  const [GUEST_TASKS_COUNT, setGUEST_TASKS_COUNT] = useState(
    utils.GUEST_TASKS_COUNT,
  )
  const [MEMBER_TASKS_COUNT, setMEMBER_TASKS_COUNT] = useState(
    utils.MEMBER_TASKS_COUNT,
  )
  const [MEMBER_FREE_TRIBE_CREDITS, setMEMBER_FREE_TRIBE_CREDITS] = useState(
    utils.MEMBER_FREE_TRIBE_CREDITS,
  )
  const [PLUS_TASKS_COUNT, setPLUS_TASKS_COUNT] = useState(
    utils.PLUS_TASKS_COUNT,
  )
  const [WS_URL, setWS_URL] = useState(utils.WS_URL)

  const apiFetch = utils.apiFetch
  const capitalizeFirstLetter = utils.capitalizeFirstLetter
  const getExampleInstructions = utils.getExampleInstructions
  const getPostId = utils.getPostId
  const getThreadId = utils.getThreadId
  const isOwner = utils.isOwner

  const pathname = (typeof window === "undefined" ? props.pathname : pn) || "/"
  const postIdInitial = getPostId(pathname)
  const [postId, setPostId] = useState(postIdInitial)
  // Ensure searchParams always has .get() method for compatibility
  const searchParams = (typeof window === "undefined"
    ? props.searchParams
    : sp) || {
    get: (_key: string) => null,
    has: (_key: string) => false,
    toString: () => "",
  }

  const _signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const response = await fetch(`${API_URL}/auth/signup/password`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, name }),
        })

        if (response.ok) {
          const data = await response.json()
          setState({ user: data.user, loading: false })
          return { success: true, user: data.user }
        } else {
          const error = await response.json()
          return { success: false, error: error.error || "Sign up failed" }
        }
      } catch (error) {
        console.error("Sign up error:", error)
        return { success: false, error: "Sign up failed" }
      }
    },
    [],
  )

  interface AuthState {
    user: user | undefined
    loading: boolean
  }

  /**
   * Sign in with email/password
   */
  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch(`${API_URL}/auth/signin/password`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        if (response.ok) {
          const data = await response.json()
          setState({ user: data.user, loading: false })
          return {
            success: true,
            user: data.user,
            token: data.token,
            authCode: data.authCode,
          }
        } else {
          const error = await response.json()
          return { success: false, error: error.error || "Sign in failed" }
        }
      } catch (error) {
        console.error("Sign in error:", error)
        return { success: false, error: "Sign in failed" }
      }
    },
    [],
  )

  // Initialize native auth for Capacitor
  useEffect(() => {
    if (isCapacitor) {
      initializeGoogleAuth().catch(console.error)
    }
    if (isTauri) {
      const handleTauriAuth = async () => {
        const { listen } = await import("@tauri-apps/api/event")
        const unlisten = await listen("oauth-callback", (event: any) => {
          const token = event.payload
          if (token) {
            console.log("✅ OAuth callback received token in frontend")
            setToken(token)
            setSignInPart(undefined)
            refetchSession()
          }
        })
        return unlisten
      }

      const unlistenPromise = handleTauriAuth()
      return () => {
        unlistenPromise.then((unlisten) => {
          if (typeof unlisten === "function") {
            unlisten()
          }
        })
      }
    }
  }, [isCapacitor, isTauri])

  /**
   * Sign in with Google OAuth
   * Redirects to Google OAuth page
   */

  const signInWithGoogle = useCallback(
    async (options?: { callbackUrl?: string; errorUrl?: string }) => {
      try {
        if (isCapacitor) {
          const result = await nativeGoogleSignIn()

          // Verify on backend
          const response = await fetch(`${API_URL}/auth/native/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: result.idToken }),
          })

          if (response.ok) {
            const data = await response.json()
            setState({ user: data.user, loading: false })
            setToken(data.jwt) // Use the raw JWT for API calls
            return { success: true, user: data.user }
          } else {
            const error = await response.json()
            console.error("Backend google verification failed:", error)
            return {
              success: false,
              error: error.error || "Google verification failed",
            }
          }
        }

        // Build OAuth URL with callback parameters
        const url = new URL(`${API_URL}/auth/signin/google`)
        if (options?.callbackUrl) {
          url.searchParams.set("callbackUrl", options.callbackUrl)
        }
        if (options?.errorUrl) {
          url.searchParams.set("errorUrl", options.errorUrl)
        }

        // Force account selection screen (prevents passkey prompt)
        url.searchParams.set("prompt", "select_account")

        // Redirect to Google OAuth
        window.location.href = url.toString()
        return { success: true }
      } catch (error) {
        console.error("Google sign in error:", error)
        return { success: false, error: "Google sign in failed" }
      }
    },
    [],
  )

  // Spatial Navigation History

  const [navigationHistory, setNavigationHistory] = useState<
    spatialNavigationEntry[]
  >([])

  const lastNavigationTime = useRef<number>(0)
  const NAVIGATION_THROTTLE_MS = 100 // 100ms minimum between transitions

  /**
   * Sign in with Apple OAuth
   * Redirects to Apple OAuth page
   */
  const signInWithApple = useCallback(
    async (options?: { callbackUrl?: string; errorUrl?: string }) => {
      try {
        if (isCapacitor) {
          const result = await nativeAppleSignIn()

          console.log(
            "🍎 Native Apple Sign In Success! Token:",
            `${result.idToken.substring(0, 10)}...`,
          )

          // Verify on backend
          console.log("🚀 Sending token to:", `${API_URL}/auth/native/apple`)
          try {
            const response = await fetch(`${API_URL}/auth/native/apple`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                idToken: result.idToken,
                name: result.user?.displayName
                  ? {
                      givenName: result.user.displayName.split(" ")[0],
                      familyName: result.user.displayName
                        .split(" ")
                        .slice(1)
                        .join(" "),
                    }
                  : undefined,
              }),
            })

            console.log("📡 Backend Status:", response.status)

            if (response.ok) {
              const data = await response.json()
              console.log("✅ Auth Success, User:", data.user.email)
              setState({ user: data.user, loading: false })
              setToken(data.jwt)
              return { success: true, user: data.user }
            } else {
              const errorText = await response.text()
              console.error("❌ Backend Error:", response.status, errorText)
              let error
              try {
                error = JSON.parse(errorText)
              } catch {
                error = { error: errorText }
              }
              return {
                success: false,
                error: error.error || "Apple verification failed",
              }
            }
          } catch (netError) {
            console.error("❌ Network Error / Fetch Failed:", netError)
            throw netError
          }
        }

        // Build OAuth URL with callback parameters
        const url = new URL(`${API_URL}/auth/signin/apple`)
        if (options?.callbackUrl) {
          url.searchParams.set("callbackUrl", options.callbackUrl)
        }
        if (options?.errorUrl) {
          url.searchParams.set("errorUrl", options.errorUrl)
        }

        // Force account selection screen (prevents passkey prompt)
        url.searchParams.set("prompt", "select_account")

        // Redirect to Apple OAuth
        window.location.href = url.toString()
        return { success: true }
      } catch (error) {
        console.error("Apple sign in error:", error)
        return { success: false, error: "Apple sign in failed" }
      }
    },
    [],
  )

  /**
   * Sign in with GitHub OAuth
   * Redirects to GitHub OAuth page
   */
  const signInWithGitHub = useCallback(
    async (options?: { callbackUrl?: string; errorUrl?: string }) => {
      try {
        // Build OAuth URL with callback parameters
        const url = new URL(`${API_URL}/auth/signin/github`)
        if (options?.callbackUrl) {
          url.searchParams.set("callbackUrl", options.callbackUrl)
        }
        if (options?.errorUrl) {
          url.searchParams.set("errorUrl", options.errorUrl)
        }

        // Redirect to GitHub OAuth
        window.location.href = url.toString()
        return { success: true }
      } catch (error) {
        console.error("GitHub sign in error:", error)
        return { success: false, error: "GitHub sign in failed" }
      }
    },
    [],
  )

  const [user, setUserInternal] = useState<sessionUser | undefined>(
    session?.user,
  )

  const setUser = (user: sessionUser | undefined) => {
    setUserInternal(user)
    setProfile(user)
  }
  const [_state, setState] = useState<AuthState>({
    user,
    loading: true,
  })

  const [isRetroInternal, setIsRetroInternal] = useState<boolean | undefined>()

  const isRetro = !!isRetroInternal
  const isRetroRef = useRef(isRetro)

  const dailyQuestions =
    user?.role === "admin"
      ? {
          ...dailyQuestionsUtil,
          default: {
            title: "Sato MODE",
            sections: [
              {
                title: "Sato Vibes",
                questions: [
                  "Sato mudur hocam?",
                  "Hocam mermi gibi mi 🚅?",
                  "Ne yapalim hocam? Çaki yapalim mi 🔪 sistemi",
                ],
              },
            ],
          },
        }
      : dailyQuestionsUtil

  const [dailyQuestionSectionIndex, setDailyQuestionSectionIndex] = useState(0)
  const [dailyQuestionIndex, setDailyQuestionIndex] = useState(0)

  // Reset daily questions when entering Retro mode

  // Derive current daily question data

  /**
   * Sign out
   */
  const signOutInternal = useCallback(
    async ({ callbackUrl }: { callbackUrl?: string }) => {
      try {
        await fetch(`${API_URL}/auth/signout`, {
          method: "POST",
          credentials: "include",
        })

        setState({ user: undefined, loading: false })

        if (callbackUrl) {
          window.location.href = `${callbackUrl}`
        }
        return { success: true }
      } catch (error) {
        console.error("Sign out error:", error)
        return { success: false, error: "Sign out failed" }
      }
    },
    [],
  )

  const [isAdmin, setIsAdmin] = useState(!!user?.roles?.includes("admin"))

  useEffect(() => {
    if (error) {
      console.error("🔥 Global Auth Error Triggered:", error)
      toast.error(error)
    }
  }, [error])

  const [env, setEnv] = useState<envType>(
    isDevelopment ? "development" : "production",
  )

  const [threads, setThreads] = useState<
    | {
        threads: thread[]
        totalCount: number
      }
    | undefined
  >(props.threads)

  const fingerprintParam = searchParams.get("fp") || ""

  const [guest, setGuest] = useState<sessionGuest | undefined>(session?.guest)
  // Calculate hourly limits for analytics and UI
  const hourlyLimit =
    isDevelopment && !isE2E
      ? 50000
      : getHourlyLimit({
          member: user,
          guest,
        })

  const hourlyUsageLeft = user
    ? hourlyLimit - (user?.messagesLastHour || 0)
    : hourlyLimit - (guest?.messagesLastHour || 0)

  const [isDonutOpen, setIsDonutOpen] = useState(false)

  const [showGrapes, setShowGrapes] = useState(false)

  const [deviceIdExtension, setDeviceIdExtension] = useLocalStorage(
    "deviceId",
    undefined as string | undefined,
  )

  const deviceId = deviceIdExtension

  // Wrap to ensure type compatibility
  const setDeviceId = useCallback(
    (value: string) => {
      setDeviceIdExtension(value)
    },
    [setDeviceIdExtension],
  )

  const [enableNotifications, setEnableNotifications] = useLocalStorage<
    boolean | undefined
  >("enableNotifications", true)

  const [minimize, setMinimize] = useLocalStorage<boolean>("minimize", true)

  const [shouldFetchSession, setShouldFetchSession] = useState(!props.session)

  const [fingerprint, setFingerprintExtension] = useLocalStorage(
    "fingerprint",
    undefined as string | undefined,
  )

  // Wrap to accept undefined for type compatibility
  const setFingerprint = useCallback(
    (value?: string) => {
      setFingerprintExtension(value)
    },
    [setFingerprintExtension],
  )

  const tokenInitial = ""

  const [tokenExtension, setTokenExtension] = useLocalStorage<
    string | undefined
  >("token", tokenInitial)

  const tokenCandidate = tokenExtension || ""

  const token = user?.token || guest?.fingerprint

  // Wrap setToken to handle undefined (for type compatibility with context)
  const setToken = setTokenExtension

  // useEffect(() => {
  //   if (apiKey) {
  //     setToken(apiKey)
  //   }
  // }, [apiKey])

  // plausible if cookies/storage are ready (important for extensions)
  const [isCookieReady, setIsCookieReady] = useState(false)

  useEffect(() => {
    // For extensions, check if cookies have been loaded from chrome.cookies API
    // The getCookie function sets "_cookiesReady" flag after first token check
    // For web, cookies are immediately available
    if (isExtension || isCapacitor) {
      const checkCookiesReady = async () => {
        const ready = await storage.getItem("_cookiesReady")
        if (ready === "true") {
          setIsCookieReady(true)
        } else {
          // Poll every 50ms until cookies are ready (max 2 seconds)
          let attempts = 0
          const interval = setInterval(async () => {
            attempts++
            const ready = await storage.getItem("_cookiesReady")
            if (ready === "true" || attempts > 40) {
              setIsCookieReady(true)
              clearInterval(interval)
            }
          }, 50)
          return () => clearInterval(interval)
        }
      }
      checkCookiesReady()
    } else {
      setIsCookieReady(true)
    }
  }, [isExtension, isCapacitor])

  const step = searchParams.get("step") as
    | "add"
    | "success"
    | "warning"
    | "cancel"
    | "update"
    | "restore"
    | undefined

  const part = searchParams.get("part") as
    | "name"
    | "description"
    | "highlights"
    | "settings"
    | "image"
    | "title"
    | undefined

  const [appStatus, setAppStatus] = useState<
    | {
        step?: "add" | "success" | "warning" | "cancel" | "update" | "restore"
        part?:
          | "name"
          | "description"
          | "highlights"
          | "settings"
          | "image"
          | "title"
        text?: Record<string, string>
      }
    | undefined
  >({
    step: step,
    part: part,
  })

  const setAccountApp = (app: sushi | undefined) => {
    setAccountAppInternal(app)
  }

  function processSession(sessionData?: session) {
    if (sessionData) {
      setSession(sessionData)
      // plausible guest migration
      if (sessionData.migratedFromGuest) {
        migratedFromGuestRef.current = sessionData.migratedFromGuest
      }
      // Update user/guest state
      if (sessionData.user) {
        setUser(sessionData.user)
        setIsAdmin(
          sessionData.user?.roles?.includes("admin") ||
            session?.user?.role === "admin",
        )
        setToken(sessionData.user.token)
        setFingerprint(sessionData.user.fingerprint || undefined)
        setGuest(undefined)
      } else if (sessionData.guest) {
        setGuest(sessionData.guest)
        setFingerprint(sessionData.guest.fingerprint)
        setToken(sessionData.guest.fingerprint)
        setUser(undefined)
      }

      sessionData.accountApp && setAccountApp(sessionData.accountApp)

      setHasNotification(!!session?.hasNotification)

      // Update versions and apps
      setVersions(sessionData.versions)
      // setApps(sessionData.app?.store.apps || [])
      sessionData.aiAgents && setAiAgents(sessionData.aiAgents)
      if (sessionData.app) {
        setApp(sessionData.app)
        setStore(sessionData?.app?.store || undefined)
      }
    }
  }

  // Generate fingerprint if missing (for guests)
  useEffect(() => {
    if (!isStorageReady) {
      return
    }
    if (!fingerprint) {
      setFingerprint(uuidv4())
    }
    if (!deviceId) {
      setDeviceId(uuidv4())
    }
  }, [fingerprint, isStorageReady, deviceId])

  // useEffect(() => {
  //   if (!isStorageReady) {
  //     return
  //   }
  //   if (!token && fingerprint) {
  //     setToken(fingerprint)
  //   }
  // }, [token, fingerprint, isTauri, isStorageReady])
  const [versions, setVersions] = useLocalStorage<
    | {
        webVersion: string
        firefoxVersion: string
        chromeVersion: string
        macosVersion: string
      }
    | undefined
  >("versions", session?.versions)

  const VEX_LIVE_FINGERPRINTS = testConfig?.VEX_LIVE_FINGERPRINTS || []

  const TEST_MEMBER_FINGERPRINTS =
    testConfig?.TEST_MEMBER_FINGERPRINTS?.concat(VEX_LIVE_FINGERPRINTS).filter(
      (fp) => !testConfig?.TEST_GUEST_FINGERPRINTS?.includes(fp),
    ) || []

  const TEST_GUEST_FINGERPRINTS =
    testConfig?.TEST_GUEST_FINGERPRINTS?.concat(VEX_LIVE_FINGERPRINTS).filter(
      (fp) => !testConfig?.TEST_MEMBER_FINGERPRINTS?.includes(fp),
    ) || []

  const TEST_MEMBER_EMAILS = testConfig?.TEST_MEMBER_EMAILS || []

  // Create actions instance

  const [taskId, setTaskId] = useState<string | undefined>(
    searchParams.get("taskId") || undefined,
  )

  useEffect(() => {
    setTaskId(searchParams.get("taskId") || undefined)
  }, [searchParams])

  const isGuestTestInternal = fingerprintParam
    ? TEST_GUEST_FINGERPRINTS?.includes(fingerprintParam)
    : false

  const [isGuestTest, setIsLiveGuestTest] = useLocalStorage<boolean>(
    "isGuestTest",
    isGuestTestInternal,
  )

  const isMemberTestInternal = user?.email
    ? TEST_MEMBER_EMAILS.includes(user.email)
    : fingerprintParam
      ? TEST_MEMBER_FINGERPRINTS?.includes(fingerprintParam)
      : false

  const [isMemberTest, setIsLiveMemberTest] = useLocalStorage<boolean>(
    "isMemberTest",
    isMemberTestInternal,
  )

  useEffect(() => {
    isMemberTestInternal && setIsLiveMemberTest(true)
    isGuestTestInternal && setIsLiveGuestTest(true)
  }, [isMemberTestInternal, isGuestTestInternal])

  const isLiveTest = isGuestTest || isMemberTest

  const [signInPart, setSignInPartInternal] = React.useState<
    "login" | "register" | "credentials" | undefined
  >(undefined)

  const [isRemovingApp, setIsRemovingApp] = useState(false)

  const fromInternal = (searchParams.get("from") || "web") as "web"
  const [from, setFrom] = useState<
    "extension" | "web" | "mobile" | "desktop" | string
  >(fromInternal)

  useEffect(() => {
    fromInternal && setFrom(fromInternal)
  }, [fromInternal])

  const setSignInPart = (
    part: "login" | "register" | "credentials" | undefined,
  ) => {
    if (user) {
      removeParams("signIn")
      addParams({
        account: "true",
      })
      return
    }
    const newPart = part && isE2E ? "credentials" : user ? undefined : part

    setSignInPartInternal(newPart)

    // Sync URL with state
    if (newPart) {
      addParams({ signIn: newPart, callbackUrl: pathname })
    } else {
      removeParams("signIn")
    }
  }

  const [newApp, setNewApp] = useState<sushi | undefined>(undefined)
  const [updatedApp, setUpdatedApp] = useState<sushi | undefined>(undefined)
  const [loadingAppId, setLoadingAppId] = useState<string | undefined>(
    undefined,
  )

  const [tribes, setTribes] = useState<paginatedTribes | undefined>(
    initialTribes,
  )
  const [tribePosts, setTribePosts] = useState<paginatedTribePosts | undefined>(
    initialTribePosts,
  )
  const [tribePost, setTribePost] = useState<tribePostWithDetails | undefined>(
    initialTribePost,
  )

  const [accountApp, setAccountAppInternal] = useState<sushi | undefined>(
    props.accountApp ||
      props?.session?.userBaseApp ||
      props?.session?.guestBaseApp,
  )
  // Memoize allApps to prevent expensive array operations on every render
  const allApps = useMemo(
    () =>
      merge(
        merge(
          (tribePosts?.posts.map((p) => p.app) as sushi[]) || [],
          session?.app?.store?.apps || props.app?.store?.apps || [],
        ),

        merge(
          (tribePost?.comments.map((p) => p.app) as sushi[]) || [],
          accountApp ? [accountApp] : [],
        ),
      ),
    [
      tribePosts?.posts,
      session?.app?.store?.apps,
      props.app?.store?.apps,
      tribePost?.comments,
      accountApp,
    ],
  )
  const [storeApps, setAllApps] = useState<sushi[]>(allApps)

  const [landing, setLanding] = useState<string | undefined>()

  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(
    !initialTribePosts,
  )

  const [tickerPaused, setTickerPaused] = useLocalStorage<boolean>(
    "tickerPaused",
    false,
  )

  const [postToTribe, setPostToTribe] = useState(false)
  const [postToMoltbook, setPostToMoltbook] = useState(false)

  const isHippoOpenRef = useRef<string | undefined>(undefined)
  const [isHippoOpenInternal, setIsHippoOpenInternal] = useState<
    string | undefined
  >(undefined)

  const isHippoOpen = isHippoOpenInternal

  const setIsHippoOpen = (value: string | undefined) => {
    isHippoOpenRef.current = value
    if (!value) {
      setSelectedInstruction(null)
    }
    setIsHippoOpenInternal(value)
  }

  const baseAppInternal = storeApps.find((item) => {
    if (!item) return false

    if (siteConfig.isTribe && item.slug === "zarathustra") {
      return true
    }

    if (
      siteConfig.slug === item.slug &&
      item.store?.slug === siteConfig.storeSlug
    ) {
      return true
    }
  })

  const [baseApp, setBaseApp] = useState<sushi | undefined>(baseAppInternal)

  const getAppSlug = useCallback(
    (targetApp: sushi, defaultSlug: string = "/", addBase = true): string => {
      const result = getAppSlugUtil({
        targetApp,
        defaultSlug,
        pathname,
        baseApp,
      })

      if (targetApp && baseApp?.id === targetApp?.id && addBase) {
        return `/${targetApp?.slug}`
      }

      return result
    },
    [pathname, baseApp],
  )

  const [app, setAppInternal] = useState<
    (sushi & { image?: string }) | undefined
  >(props.app || session?.app || baseApp)

  const advanceDailySection = useCallback(() => {
    // Determine context based on current app
    const contextKey = (
      app && dailyQuestions[app.slug as keyof typeof dailyQuestions]
        ? app.slug
        : "default"
    ) as keyof typeof dailyQuestions
    const context = dailyQuestions[contextKey]

    // Calculate next section index
    const nextSectionIndex =
      (dailyQuestionSectionIndex + 1) % context.sections.length

    // Update state - dailyQuestionData will update automatically
    // and Chat.tsx will handle setting the input
    setDailyQuestionSectionIndex(nextSectionIndex)
    setDailyQuestionIndex(0)
  }, [dailyQuestionSectionIndex, app, dailyQuestions])

  const dailyQuestionData = useMemo(() => {
    if (!isRetro) return null

    const contextKey = (
      app && dailyQuestions[app.slug as keyof typeof dailyQuestions]
        ? app.slug
        : "default"
    ) as keyof typeof dailyQuestions
    const context = dailyQuestions[contextKey]

    if (!context) return null

    const currentSection = context.sections[dailyQuestionSectionIndex]

    // If somehow index is out of bounds (shouldn't happen with correct logic), fallback
    if (!currentSection) return null

    const questions = currentSection.questions
    const currentQuestion = questions[dailyQuestionIndex] || questions[0] || ""

    // Title Logic:
    // If sectionIndex == 0 -> Show Main Title (e.g. "Daily Questions for Grape")
    // If sectionIndex > 0 -> Show Section Title (e.g. "Analytics & Discovery")
    const displayTitle =
      dailyQuestionSectionIndex === 0 ? context.title : currentSection.title

    return {
      currentQuestion,
      sectionTitle: currentSection.title,
      appTitle: displayTitle,
      isLastQuestionOfSection: dailyQuestionIndex === questions.length - 1,
      questions,
    }
  }, [isRetro, app, dailyQuestionSectionIndex, dailyQuestionIndex])

  const c = whiteLabels.find((label) => label.slug === "chrry")

  const siteConfigApp = useMemo(
    () =>
      whiteLabels.find(
        (label) =>
          label.slug === app?.slug || app?.store?.app?.slug === label.slug,
      ) || c,
    [app, c],
  )

  const setIsRetro = (value: boolean) => {
    setIsRetroInternal(value)
    isRetroRef.current = value

    if (value) {
      setDailyQuestionSectionIndex(0)
      setDailyQuestionIndex(0)
    }
  }

  // Note: Input syncing with daily questions now handled in ChatProvider

  const chrryUrl = CHRRY_URL

  const appId = loadingAppId || app?.id

  const [isSavingApp, setIsSavingApp] = useState(false)
  const [isManagingApp, setIsManagingAppInternal] = useState(false)

  const setIsManagingApp = (value: boolean) => {
    setIsManagingAppInternal(value)
    value && isPear && setPear(undefined)
  }

  const threadId = getThreadId(pathname)
  const threadIdRef = useRef(threadId)

  const toFetchThread = threadId || threadIdRef.current

  const {
    data: sessionSwr,
    mutate: refetchSession,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useSWR(
    (isExtension || isCapacitor ? isStorageReady && isCookieReady : true) &&
      tokenCandidate &&
      deviceId &&
      !isRemovingApp &&
      !isSavingApp
      ? ["session", tokenCandidate]
      : null,
    async () => {
      // debugger

      try {
        // Don't pass appSlug - let the API determine base app by domain
        // Call the API action
        const result = await getSession({
          deviceId,
          appId: newApp?.id || lastAppId || app?.id,
          fingerprint,
          app: isBrowserExtension()
            ? "extension"
            : isStandalone
              ? "pwa"
              : "web",
          gift,
          isStandalone,
          API_URL,
          VERSION,
          token: tokenCandidate!,
          appSlug: app?.slug || baseApp?.slug,
          agentName,
          chrryUrl,
        })

        // Check if result exists
        if (!result) {
          throw new Error("No response from server")
        }

        // Type guard for error response
        if ("error" in result || "status" in result) {
          // Handle rate limit
          if ("status" in result && result.status === 429) {
            setShouldFetchSession(false)
            throw new Error("Rate limit exceeded")
          }

          // Handle other errors
          if ("error" in result && result.error) {
            toast.error(result.error as string)
            setShouldFetchSession(false)
          }
        }

        // 🔍 LOG: Check what apps are returned from session API
        const sessionResult = result as session
        console.log("📦 Session API Response - Apps:", {
          app: sessionResult.app?.name,
          totalApps: sessionResult.app?.store?.apps?.length || 0,
          apps: sessionResult.app?.store?.apps?.map((a: any) => ({
            slug: a.slug,
            name: a.name,
            storeId: a.store?.id,
            storeName: a.store?.name,
          })),
          currentStore: sessionResult.app?.store?.name,
          currentStoreId: sessionResult.app?.store?.id,
        })

        // Remove gift param from URL after successful session fetch
        if (gift) {
          removeParams("gift")
        }

        // Cache session data on successful fetch

        return sessionResult
      } catch (error) {
        captureException(error)
        console.error("Error fetching session:", error)
      }
    },
    {
      // revalidateOnMount: true,
      onError: (error) => {
        // Stop retrying on rate limit errors
        if (error.message.includes("429")) {
          setShouldFetchSession(false)
        }
      },
      errorRetryCount: 2,
      errorRetryInterval: 3000, // 5 seconds between retries
      shouldRetryOnError: (error) => {
        // Don't retry on rate limit errors
        return !error.message.includes("429")
      },
    },
  )
  const sessionData = sessionSwr || session

  const _getAlterNativeDomains = (store: storeWithApps) => {
    // Map askvex.com and vex.chrry.ai as equivalent domains
    if (
      store?.domain === "https://vex.chrry.ai" ||
      store?.domain === "https://askvex.com"
    ) {
      return ["https://vex.chrry.ai"]
    }

    return store.domain ? [store.domain] : []
  }

  const [agentName, _setAgentName] = useState(session?.aiAgent?.name)
  const flattenObject = (obj: any, prefix = ""): Record<string, any> => {
    const flattened: Record<string, any> = {}
    if (!obj) return flattened

    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const value = obj[key]
        const newKey = prefix ? `${prefix}_${key}` : key

        if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          Object.assign(flattened, flattenObject(value, newKey))
        } else {
          flattened[newKey] = value
        }
      }
    }
    return flattened
  }

  const plausibleEvent = ({
    name,
    url,
    domain,
    props = {},
    device,
    os,
    browser,
    isPWA,
  }: {
    name: string
    url?: string
    domain?: string
    props?: Record<string, any>
    device?: string
    os?: string
    browser?: string
    isPWA?: boolean
  }) => {
    if (isDevelopment) return

    const canAdd =
      isPWA !== undefined && os !== undefined && browser !== undefined

    const u = isExtension
      ? `/extension/${isFirefox ? "firefox" : "chrome"}${window.location.pathname}`
      : isTauri
        ? `/tauri/${os || "desktop"}${window?.location?.pathname || ""}`
        : isCapacitor
          ? `/capacitor/${os || "mobile"}${window?.location?.pathname || ""}`
          : typeof window !== "undefined"
            ? canAdd
              ? `${isPWA ? `${os}/${browser}` : ""}${window?.location?.pathname || ""}`
              : window?.location?.pathname || ""
            : "/"
  }

  const trackPageview = () => {
    plausible({
      name: "pageview",
    })
  }

  useEffect(() => {
    trackPageview()
  }, [pathname])

  useEffect(() => {
    hasStoreApps(baseAppInternal) && setBaseApp(baseAppInternal)
  }, [baseAppInternal])

  useEffect(() => {
    const signInParam = searchParams.get("signIn")
    const currentPart = signInParam as
      | "login"
      | "register"
      | "credentials"
      | null

    // Only update state if it's different from URL to avoid loops
    if (currentPart !== signInPart) {
      setSignInPartInternal(user ? undefined : currentPart || undefined)
    }
  }, [searchParams, user])

  // Throttle map to prevent duplicate rapid-fire events
  const plausibleThrottleMap = useRef<Map<string, number>>(new Map())
  const plausible_THROTTLE_MS = 500 // 500ms

  // Duration map to track time between same event calls
  const plausibleDurationMap = useRef<Map<string, number>>(new Map())
  const [timer, setTimer] = useLocalStorage<timer | undefined | null>(
    "timer",
    null,
  )

  const {
    data: timerData,
    mutate: refetchTimer,
    isValidating,
  } = useSWR(
    deviceId && token && session ? ["timer", deviceId] : null,
    async () => {
      const response = await apiFetch(`${API_URL}/timers/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.json()
    },
  )

  useEffect(() => {
    if (isValidating) return
    if (timerData && !timer) {
      setTimer((prev) => {
        if (
          prev?.id === timerData.id &&
          prev?.isCountingDown === timerData.isCountingDown &&
          prev?.count === timerData.count &&
          prev?.preset1 === timerData.preset1 &&
          prev?.preset2 === timerData.preset2 &&
          prev?.preset3 === timerData.preset3
        ) {
          return prev
        }
        return timerData
      })
    }
  }, [timerData, timer, isValidating])

  const [earnBadge, setEarnBadge] = useState<boolean>(true)

  const fetchTimer = useCallback(async () => {
    await refetchTimer()
  }, [refetchTimer])

  const [selectedAgent, setSelectedAgentInternal] = useLocalStorage<
    aiAgent | undefined | null
  >("selectedAgent", null)
  const [userSelectedAgent, setUserSelectedAgent] = useState<
    aiAgent | undefined | null
  >()
  const setSelectedAgent = (agent: aiAgent | undefined | null) => {
    setSelectedAgentInternal(agent)
  }
  const isBYOK = !!user?.apiKeys?.openrouter || !!guest?.apiKeys?.openrouter
  const isReplicateBYOK =
    !!user?.apiKeys?.replicate || !!guest?.apiKeys?.replicate
  const isFalYOK = !!user?.apiKeys?.fal || !!guest?.apiKeys?.fal

  const [creditsLeftInternal, setCreditsLeft] = useState<number | undefined>()

  const [accountCreditsLeft, setAccountCreditsLeft] = useState<
    number | undefined
  >(user?.creditsLeft || guest?.creditsLeft)

  // useEffect(() => {
  //   if (shouldGetCredits) {
  //     ;(async () => {
  //       try {
  //         const creditsBefore = creditsLeft
  //         let creditsAfter: number | undefined

  //         if (user) {
  //           const item = await actions.getUser({
  //             threadId: toFetch,
  //           })

  //           if (item) {
  //             creditsAfter = item.creditsLeft
  //             setCreditsLeft(item.creditsLeft)
  //           }
  //         }

  //         if (guest) {
  //           const item = await actions.getGuest({
  //             threadId: toFetch,
  //           })

  //           if (item) {
  //             creditsAfter = item.creditsLeft
  //             setCreditsLeft(item.creditsLeft)
  //           }
  //         }

  //         // Auto-disable Pear mode if credits didn't increase 3 times in a row
  //         if (
  //           isPear &&
  //           creditsAfter !== undefined &&
  //           creditsBefore !== undefined
  //         ) {
  //           if (creditsAfter <= creditsBefore) {
  //             pearNoGainStreakRef.current += 1
  //             if (pearNoGainStreakRef.current >= 3) {
  //               pearNoGainStreakRef.current = 0
  //               toast.success(t("pearNoGainStreak"), {
  //                 duration: 4000,
  //               })
  //             }
  //           } else {
  //             setPear(undefined)
  //             // Credits went up — reset streak
  //             pearNoGainStreakRef.current = 0
  //           }
  //         } else {
  //           creditsAfter &&
  //             creditsAfter <= 20 &&
  //             creditsAfter % 5 === 0 &&
  //             setPear(app)
  //         }
  //       } catch (error) {
  //         console.error(error)
  //       } finally {
  //         setShouldGetCredits(false)
  //       }
  //     })()
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [shouldGetCredits])

  const {
    data: account,
    mutate: refetchAccount,
    isLoading: isLoadingAccount,
  } = useSWR(
    appId && (user || guest) ? ["account", appId] : null,
    async () => {
      try {
        if (user) {
          const item = await actions.getUser({
            appId,
          })

          return item
        }

        if (guest) {
          const item = await actions.getGuest({
            appId,
          })

          return item
        }
      } catch (error) {
        console.error(error)
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  )

  useEffect(() => {
    if (!account) return
    setAccountCreditsLeft(account?.creditsLeft)
    if (account?.instructions) setInstructions(account?.instructions)
  }, [account])
  const creditsLeft = toFetchThread ? creditsLeftInternal : account?.creditsLeft

  const plausible = ({
    name,
    url,
    domain = siteConfig.domain,
    props = {},
  }: {
    name: string
    url?: string
    domain?: string
    props?: Record<string, any>
  }) => {
    if (!user && !guest) return

    const now = Date.now()

    // Calculate duration if this event was called before
    let duration = 0
    const lastEventTime = plausibleDurationMap.current.get(name)
    if (lastEventTime) {
      const durationMs = now - lastEventTime
      duration = durationMs // Keep as milliseconds
    }

    // Update the timestamp for this event
    plausibleDurationMap.current.set(name, now)

    // Throttle: Skip if same event was plausibleed recently
    const lastplausibleed = plausibleThrottleMap.current.get(name)
    if (lastplausibleed && now - lastplausibleed < plausible_THROTTLE_MS) {
      return // Skip this event
    }
    plausibleThrottleMap.current.set(name, now)

    // Normalize URL for different platforms
    let normalizedUrl = url
    if (url) {
      // Extension: chrome-extension://id/index.html#/threads -> /threads
      if (isExtension) {
        const hashIndex = url.indexOf("#")
        if (hashIndex !== -1) {
          normalizedUrl = url.substring(hashIndex + 1)
        }
      }
      // Tauri: tauri://localhost/threads -> /threads
      else if (isTauri && url.startsWith("tauri://")) {
        normalizedUrl = url.replace("tauri://localhost", "")
      }
      // Capacitor: capacitor://localhost/threads -> /threads
      else if (isCapacitor && url.startsWith("capacitor://")) {
        normalizedUrl = url.replace("capacitor://localhost", "")
      }
    }

    // Add duration to props if it exists (> 0 means this is not the first call)
    const enrichedProps = duration > 0 ? { ...props, duration } : props

    const basic = {
      isStandalone,
      os,
      device,
      burn,
      appName: app?.name,
      appSlug: app?.slug,
      baseAppName: baseApp?.name,
      duration,
      minimize,
      isPear,
      agentName: selectedAgent?.name,
      agentVersion: selectedAgent?.version,
      creditsLeft,
      hourlyLimit,
      hourlyUsageLeft,
      isBYOK,
      isReplicateBYOK,
      isFalYOK,
    }

    const finalProps = burn
      ? basic
      : {
          ...basic,
          ...enrichedProps,
          isMember: !!user,
          isBYOK,
          isGuest: !!guest,
          isSubscriber: !!(user || guest)?.subscription,
          isOwner: isOwner(app, {
            userId: user?.id,
            guestId: guest?.id,
          }),
          timer: {
            count: timer?.count,
            preset1: timer?.preset1,
            preset2: timer?.preset2,
            isCountingDown: timer?.isCountingDown,
            preset3: timer?.preset3,
          },
        }
    // Only send meaningful events to API for AI context
    if (token && MEANINGFUL_EVENTS.includes(name as any)) {
      analyticsLimit(() =>
        fetch(`${API_URL}/analytics/grape`, {
          method: "POST",
          credentials: "include", // Send cookies for auth
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            url: normalizedUrl,
            props: finalProps,
            timestamp: Date.now(),
          }),
        }).catch((error) => {
          // Fire and forget error handling
          // captureException(error)
          console.error("❌ Analytics plausible error:", error)
        }),
      )
    }

    if (user?.role === "admin") return

    plausibleEvent({
      name,
      url: normalizedUrl,
      domain,
      device,
      os,
      browser,
      isPWA: isStandalone,
      props:
        burn || !memoriesEnabled
          ? {
              burn,
              memoriesEnabled,
              minimize,
            }
          : finalProps,
    })
  }

  useEffect(() => {
    app &&
      plausible({
        name: ANALYTICS_EVENTS.APP,
      })
  }, [app, pathname])

  const gift = searchParams.get("gift") || ""

  // Note: deviceId initialization is handled by useLocalStorage hook above
  // It automatically checks storage (localStorage/chrome.storage/MMKV) on all platforms
  // and generates UUID if not found. No manual useEffect needed!

  useEffect(() => {
    if (gift) {
      setWasGifted(true)
    }
  }, [gift])

  useEffect(() => {
    if (wasGifted && (guest?.subscription || user?.subscription)) {
      toast.success("Welcome to Vex Plus!")
      setWasGifted(false)
    }
  }, [user, guest])

  const [, setUserRole] = useLocalStorage("userRole", user?.role)

  useEffect(() => {
    if (user) {
      setUserRole(user.role)
    }
  }, [user])

  // plausible UTM parameters for ad attribution (EthicalAds, etc.)
  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const utmSource = params.get("utm_source")
    const utmMedium = params.get("utm_medium")
    const utmCampaign = params.get("utm_campaign")

    if (utmSource) {
      plausible({
        name: ANALYTICS_EVENTS.AD_VISIT,
        props: {
          source: utmSource,
          medium: utmMedium || "unknown",
          campaign: utmCampaign || "unknown",
          app: app?.name || "unknown",
        },
      })
    }
  }, []) // Run once on mount

  const characterProfilesEnabled =
    user?.characterProfilesEnabled ||
    guest?.characterProfilesEnabled ||
    undefined

  const [memoriesEnabled, setMemoriesEnabled] = useState(
    !!(user || guest)?.memoriesEnabled,
  )

  useEffect(() => {
    if (user || guest) {
      setMemoriesEnabled(!!(user || guest)?.memoriesEnabled)
    }
  }, [user, guest])

  const [language, setLanguageInternal] = useLocalStorage(
    "locale",
    locale || (session?.locale as locale) || i18n.language || "en",
    // isExtension || isCapacitor,
  )

  const [languageModal, setLanguageModal] = useState<string | undefined>(
    undefined,
  )

  const rtlLanguages = ["fa", "ar", "he", "ur", "ku"]

  // Use locale prop (server data) for initial RTL - it's sync and reliable
  // language (from useLocalStorage) is async and starts with default value
  const rtlInitial = rtlLanguages.includes(locale as string)

  const [rtl, setRTL] = useState(rtlInitial)

  const processRTL = (l = language) => {
    const isRTL = rtlLanguages.includes(l)
    setRTL(isRTL)

    document.documentElement.setAttribute("lang", l)
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr")
  }
  useEffect(() => {
    processRTL(language)
  }, [language])

  // useEffect(() => {
  //   if (session?.locale) {
  //     setLanguageInternal(session?.locale)
  //   }
  // }, [session?.locale])

  // URL locale priority: if the URL has a locale prefix that differs from stored language, apply it
  useEffect(() => {
    const pn =
      typeof window === "undefined" ? pathname : window.location.pathname
    for (const loc of locales) {
      if (pn.startsWith(`/${loc}/`) || pn === `/${loc}`) {
        if (loc !== language) {
          setLanguageInternal(loc as locale)
          i18n.changeLanguage(loc)
          processRTL(loc as locale)
        }
        break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount — URL is source of truth on first load

  const setLanguage = async (language: locale) => {
    setLanguageInternal(language)
    i18n.changeLanguage(language)

    processRTL(language)
    const currentPath = window.location.pathname
    let pathWithoutLocale = currentPath

    // Remove any existing locale prefix (e.g., /en/... or /ja/...)
    for (const loc of locales) {
      if (currentPath.startsWith(`/${loc}/`)) {
        pathWithoutLocale = currentPath.substring(loc.length + 1)
        break
      } else if (currentPath === `/${loc}`) {
        pathWithoutLocale = "/"
        break
      }
    }

    const prefix = language === defaultLocale ? "" : `/${language}`
    const newPath = cleanSlug(`${prefix}${pathWithoutLocale}`) || "/"
    window.history.replaceState(null, "", newPath)
  }

  const migratedFromGuestRef = useRef(false)

  const [hasNotification, setHasNotification] = useState<boolean>(false)

  const lasProcessedSession = useRef<string | undefined>(undefined)

  // Find app by pathname - handles both base apps and sub-apps
  const findAppByPathname = (
    path: string,
    apps: sushi[],
  ): sushi | undefined => {
    // if (focus && showFocus) return focus
    if (path === "/" && !showFocus) return undefined

    const matchedApp = storeApps?.find((item) => {
      return getAppSlug(item) === pathname
    })

    return matchedApp
  }

  const [lastAppId, setLastAppId] = useLocalStorage<string | undefined>(
    "lastAppId",
    undefined,
  )

  // Get isStorageReady from platform context

  // Centralized function to merge apps without duplicates
  const mergeApps = useCallback((newApps: sushi[]) => {
    setAllApps((prevApps) => {
      console.log(`� prevApps before merge: ${prevApps.length} apps`)
      const result = merge(prevApps, newApps)
      console.log(`📦 result after merge: ${result.length} apps`)
      return result
    })
  }, [])

  // useEffect(() => {
  //   if (tribePosts?.posts?.length) {
  //     mergeApps(tribePosts.posts.map((p) => p.app) as sushi[])
  //   }
  // }, [tribePosts, mergeApps])

  const { clear } = useCache()

  const fetchSession = async () => {
    clear()
    setIsLoading(true)
    setShouldFetchSession(true)
    shouldFetchSession && (await refetchSession())
  }

  const [isSplash, setIsSplash] = useState(true)

  const [loadingApp, setLoadingAppInternal] = useState<sushi | undefined>(
    undefined,
  )

  const setLoadingApp = (sushi?: sushi) => {
    setLoadingAppId(sushi?.id)
    setLoadingAppInternal(sushi)
  }

  const { captureException } = useError()

  const chrry = storeApps?.find(
    (app) => hasStoreApps(app) && !app.store?.parentStoreId,
  )
  const vex = storeApps?.find((app) => hasStoreApps(app) && app.slug === "vex")
  const vault = storeApps?.find(
    (app) => hasStoreApps(app) && app.slug === "vault",
  )
  const hippo = storeApps?.find(
    (app) => hasStoreApps(app) && app.slug === "hippo",
  )
  const peach = storeApps?.find(
    (app) => hasStoreApps(app) && app.slug === "peach",
  )
  const sushi = storeApps?.find(
    (app) => hasStoreApps(app) && app.slug === "sushi",
  )

  const focus = storeApps?.find(
    (app) => hasStoreApps(app) && app.slug === "focus",
  )

  const burnApp = storeApps?.find(
    (app) => hasStoreApps(app) && app.slug === "burn",
  )

  const accountAppId = accountApp?.id

  const [skipAppCacheTemp, setSkipAppCacheTempInternal] = useState(false)

  const setSkipAppCacheTemp = (val: boolean) => {
    if (
      val &&
      !isOwner(app, {
        userId: user?.id,
        guestId: guest?.id,
      })
    ) {
      return
    }

    setSkipAppCacheTempInternal(val)
  }

  const [commentAppId, setCommentAppId] = useState<string | undefined>(
    undefined,
  )
  const {
    data: storeAppsSwr,
    mutate: refetchApps,
    isLoading: isLoadingApps,
  } = useSWR(
    token && [
      "app",
      appId,
      skipAppCacheTemp,
      isManagingApp,
      postId,
      loadingAppId,
    ],
    async () => {
      try {
        if (!token) return
        const result = await getApp({
          token,
          appId,
          chrryUrl,
          threadId,
          pathname,
          postId: loadingAppId ? undefined : postId,
          skipCache: isManagingApp
            ? isOwner(app, {
                userId: user?.id,
                guestId: guest?.id,
              })
            : false,
        })
        return result as sushi
      } catch (error) {
        captureException(error)
      }
    },
  )

  const {
    data: accountAppsSwr,
    mutate: refetchAccountApps,
    isLoading: isLoadingAccountApps,
  } = useSWR(
    !isRemovingApp &&
      !isSavingApp &&
      token && [
        "accountApp",
        accountAppId,
        skipAppCacheTemp,
        updatedApp?.id,
        newApp?.id,
      ],
    async () => {
      try {
        if (!token) return
        const result = await getApp({
          token,
          // chrryUrl,
          // pathname,
          accountApp: true,
          skipCache: true,
        })

        return result
      } catch (error) {
        captureException(error)
      }
    },
  )

  useEffect(() => {
    if (accountAppsSwr?.id) {
      setAccountApp(accountAppsSwr)
      mergeApps([accountAppsSwr])

      if (accountAppsSwr && newApp) {
        toast.success(t("🥳 WOW!, you created something amazing"))
        setNewApp(undefined)

        setAccountApp(accountAppsSwr)

        setIsSavingApp(false)
        setIsManagingApp(false)

        setApp(accountAppsSwr)
        setStore(accountAppsSwr.store || undefined)
        router.push(getAppSlug(accountAppsSwr))
        return
      }

      if (accountAppsSwr && updatedApp?.id) {
        toast.success(`${t("Updated")} 🚀`)
        // if (!isExtension && !isNative) {
        //   // setSlug(getAppSlug(n) || "")
        //   window.location.href = getAppSlug(u)
        //   return
        // }
        setUpdatedApp(undefined)
        setAccountApp(accountAppsSwr)

        setIsManagingApp(false)
        setIsSavingApp(false)

        setApp(accountAppsSwr)
        setStore(accountAppsSwr.store || undefined)

        setSlug(getAppSlug(accountAppsSwr) || "")
        // router.push(getAppSlug(accountAppsSwr))

        return
      }
      if (appId === accountAppsSwr.id) {
        mergeApps([accountAppsSwr])
        setApp(accountAppsSwr)
        setStore(accountAppsSwr.store || undefined)
      }
    }
  }, [accountAppsSwr, newApp?.id, updatedApp?.id, appId, app?.id])

  useEffect(() => {
    if (accountApp && pathname === getAppSlug(accountApp) && isRemovingApp) {
      setAccountApp(undefined)
      router.push("/")
    }
  }, [accountApp, pathname, isRemovingApp])

  useEffect(() => {
    if (storeAppsSwr) {
      if (storeAppsSwr?.id === commentAppId) {
        setCommentAppId(undefined)
      }
      skipAppCacheTemp && setSkipAppCacheTemp(false)
      const a = storeAppsSwr?.store?.apps?.find(
        (app) => app.id === loadingAppId,
      )
      if (hasStoreApps(a)) {
        setLoadingApp(undefined)
      }

      if (storeAppsSwr?.store?.apps?.length) {
        mergeApps(storeAppsSwr?.store?.apps)
      }
    }
  }, [storeAppsSwr, loadingAppId, commentAppId])

  const _routeSegments = (pathname.split("?")?.[0] || "")
    .replace(/^\//, "")
    .split("/")
  const _routeSlug =
    _routeSegments.length > 1 && locales.includes(_routeSegments[0] as any)
      ? _routeSegments[1]
      : _routeSegments[0]
  const _isExcluded = _routeSlug
    ? excludedSlugRoutes?.includes(_routeSlug)
    : false

  const showFocusQuery = searchParams.get("focus") === "true"
  const showFocusPathname = pathname === "/focus"

  const showFocusInitial = showFocusQuery || showFocusPathname

  const isFocus =
    !_isExcluded &&
    !siteConfig?.isTribe &&
    (!postId
      ? siteConfig
        ? siteConfig?.slug === "focus" || showFocusInitial
        : showFocusInitial
      : false)

  useEffect(() => {
    setPostId(postIdInitial)
  }, [postIdInitial])

  const [showFocusInternal, setShowFocusInternal] = useLocalStorage<
    boolean | undefined | null
  >(`focus`, undefined)

  const [store, setStore] = useState<storeWithApps | undefined>(
    app?.store || undefined,
  )

  const [p, setP] = useLocalStorage<boolean | null | undefined>("p", undefined)

  const storeAppInternal = storeApps?.find(
    (item) =>
      app?.store?.appId &&
      item.id === app?.store?.appId &&
      item.store?.id &&
      item.store?.id === app?.store?.id,
  )

  const [storeApp, setStoreAppInternal] = useState<sushi | undefined>(
    storeAppInternal,
  )

  const canShowAllTribe = !!(
    clearLocale(pathname) === "/tribe" ||
    (siteConfig.isTribe && !clearLocale(pathname)) ||
    clearLocale(pathname) === "/"
  )

  const installs = [
    "atlas",
    "focus",
    "vex",
    "popcorn",
    "chrry",
    "zarathustra",
    "search",
    "grape",
    "burn",
    "sushi",
    "pear",
    "vault",
  ]

  const withFallback = "chrry"
  const minioUrl = "https://minio.chrry.dev/chrry-installs/installs"

  const isBaseAppZarathustra = baseApp?.slug === "zarathustra"

  const [burnInternal, setBurnInternal] = useState<boolean | null>(null)

  // MinIO download URLs (production bucket)

  const burn = burnInternal === null ? false : burnInternal

  const burning = !!(burn || burnApp)

  const zarathustra = storeApps.find((app) => app.slug === "zarathustra")

  const hasInformedRef = useRef(false)
  useLocalStorage<boolean>("burnNotification", false)
  const setBurn = (value: boolean) => {
    setBurnInternal(value)

    // Privacy-respecting analytics: plausible burn usage WITHOUT personal info or identifiers.
    // This helps us understand if the feature is valuable and worth investing in,
    // while respecting the user's choice for privacy. No user data, IDs, or content is plausibleed.
    // Only the fact that burn was activated (boolean event).
    if (value) {
      if (!hasInformedRef.current) {
        hasInformedRef.current = true
        toast.error(`${t("When you burn there is nothing to remember")} 🔥`)
      }
      plausible({
        name: ANALYTICS_EVENTS.BURN,
        props: {
          value,
          app: app?.name,
          slug: app?.slug,
          id: app?.id,
        },
      })
    }

    // if (burnApp && value) {
    //   router.push(getAppSlug(burnApp))
    //   return
    // }

    // if (zarathustra && baseApp?.id === zarathustra.id) {
    //   value && router.push(getAppSlug(zarathustra))
    // }
  }

  const [isUpdatingCharacterProfile, setIsUpdatingCharacterProfile] =
    useState(false)

  const patchCharacterProfile = async ({
    newProfile,
    onError,
    onSuccess,
  }: {
    newProfile: boolean
    onError?: () => void
    onSuccess?: () => void
  }) => {
    if (!token) return
    setIsUpdatingCharacterProfile(true)

    try {
      if (user) {
        const updatedUser = await updateUser({
          token,
          characterProfilesEnabled: newProfile,
        })

        setUser(updatedUser)

        onSuccess?.()
      }

      if (guest) {
        const updatedGuest = await actions.updateGuest({
          characterProfilesEnabled: newProfile,
        })

        onSuccess?.()

        setGuest(updatedGuest)
      }
    } catch (error) {
      captureException(error)
      console.error("Error updating guest:", error)
      onError?.()

      user?.role === "admin" && toast.error("Something went wrong")
    } finally {
      setIsUpdatingCharacterProfile(false)
    }
  }

  const getTribeUrl = (app?: sushi) => {
    return !(siteConfig.isTribe && showTribe) &&
      app &&
      (getAppSlug(app) === pathname
        ? showTribe
          ? !showTribeProfile
          : showTribeProfile
        : showTribeProfile)
      ? getAppSlug(app)
      : siteConfig?.isTribe
        ? "/"
        : `/tribe`
  }

  const canBurn = true

  const isZ = searchParams?.get("programme") === "true"

  const [isProgrammeInternal, setIsProgrammeInternal] = useLocalStorage<
    boolean | undefined
  >("prog", baseApp ? isBaseAppZarathustra && app?.slug === "zarathustra" : isZ)

  useEffect(() => {
    if (!baseApp || !app) return
    if (isProgrammeInternal === undefined) {
      setIsProgrammeInternal(
        baseApp?.slug === "zarathustra" && app?.slug === "zarathustra",
      )
    }
  }, [baseApp, app, isProgrammeInternal]) // Only depend on slugs

  const apps = storeApps.filter((item) => {
    return app?.store?.app?.store?.apps?.some((app) => {
      return app.id === item.id
    })
  })

  const hive = (app?: sushi, apps: (sushi | undefined)[] = allApps) =>
    apps
      ?.sort((a) =>
        (["popcorn", "chrry", "vex", "sushi", "hippo", "peach"].includes(
          a?.slug || "",
        ) &&
          a?.id === app?.id) ||
        a?.storeId === app?.storeId
          ? -1
          : 1,
      )
      .filter((a) => a !== undefined) as sushi[]

  const [selecting, setSelecting] = useState("")

  const accountApps = apps?.filter((app) =>
    isOwner(app, {
      userId: user?.id,
      guestId: guest?.id,
    }),
  )
  const setIsProgramme = (value: boolean) => {
    setIsProgrammeInternal(value)
    removeParams("programme")
  }

  const grapes = storeApps.filter(
    (app) =>
      whiteLabels.some((w) => w.slug === app.slug) &&
      app.store?.appId === app.id,
  )

  const grape = storeApps.find((app) => app.slug === "grape")

  const [about, setAbout] = useState(searchParams.get("about") ?? undefined)

  const [ask, setAskInternal] = useState(searchParams.get("ask") ?? undefined)

  useEffect(() => {
    const ask = searchParams.get("ask")
    if (ask !== null) {
      setAskInternal(ask)
    }
    const about = searchParams.get("about")
    about !== null && setAbout(about)
  }, [searchParams])

  const setAsk = (value: string | undefined) => {
    setAskInternal(value)

    if (value) {
      router.push(`/?ask=${encodeURIComponent(value)}`)
    }
  }

  const isProgramme =
    (!!isProgrammeInternal && !siteConfig.isTribe) ||
    searchParams.get("programme") === "true"

  const setStoreApp = (sushi?: sushi) => {
    sushi?.id !== storeApp?.id && setStoreAppInternal(sushi)
  }

  useEffect(() => {
    hasStoreApps(app) && setStoreApp(storeAppInternal)
  }, [storeAppInternal])

  const [slugState, setSlugState] = useState<string | undefined>(
    (app && getAppSlug(app)) || undefined,
  )
  const [slugStorage, setSlugStorage] = useLocalStorage<string | undefined>(
    "slug",
    (app && getAppSlug(app)) || undefined,
  )

  const setSlug = (slug: string | undefined) => {
    if (isExtension || isCapacitor) {
      setSlugStorage(slug)
    } else {
      setSlugState(slug)
    }
  }

  const slug = isExtension || isCapacitor ? slugStorage : slugState

  const [stores, setStores] = useState<Paginated<storeWithApps> | undefined>(
    session?.stores,
  )

  const [selectedInstruction, setSelectedInstruction] =
    useState<instructionBase | null>(null)

  // Handle pathname changes: extract slug and switch app
  const hasHydratedInternal = useHasHydrated()

  const hasHydrated = hasHydratedInternal || !!isBot

  const [shouldFetchMoods, setShouldFetchMoods] = useState(false)

  const [moods, setMoods] = useState<{
    moods: mood[]
    totalCount: number
    hasNextPage: boolean
    nextPage: number | null
  }>({
    moods: [],
    totalCount: 0,
    hasNextPage: false,
    nextPage: null,
  })

  const [moltPlaceHolder, setMoltPlaceHolder] = useState<string[]>([])

  const [isLoadingMood, _setIsLoadingMood] = useState(true)
  const [mood, setMood] = useState<mood | null>(null)

  const [tribeStripeSession, setTribeStripeSession] = useLocalStorage<
    { sessionId: string; totalPrice: number } | undefined
  >("tribeStripeSessionId", undefined)

  const scheduledTaskId = searchParams.get("scheduledTaskId")

  const {
    data: scheduledJobsSwr,
    isLoading: isLoadingScheduledJobs,
    mutate: refetchScheduledJobs,
  } = useSWR(
    isOwner(app, {
      userId: user?.id,
    }) && token
      ? ["scheduledJobs", token, "scheduledTaskId", scheduledTaskId]
      : null,
    async () => {
      if (!token || !app) return

      const response = await apiFetch(
        `${API_URL}/scheduledJobs?appId=${app.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      return response.json()
    },
  )

  const [scheduledJobs, setScheduledJobs] = useState<scheduledJob[]>(
    scheduledJobsSwr?.scheduledJobs || [],
  )

  useEffect(() => {
    if (scheduledJobsSwr?.scheduledJobs) {
      setScheduledJobs(scheduledJobsSwr.scheduledJobs)
    }
  }, [scheduledJobsSwr])

  const [shouldFetchMood, setShouldFetchMood] = useState(true)

  const canShowTribe = true

  const showTribeFromPath = pathname === "/tribe"

  const showWatermelonInitial = Boolean(
    (siteConfig.isWatermelon && clearLocale(pathname) === "") ||
      pathname === "/watermelon",
  )

  const showGrapeInitial = Boolean(
    (siteConfig.isGrape && clearLocale(pathname) === "") || pathname === "/g",
  )

  const [showGrapeInternal, setShowGrapeInternal] = useLocalStorage<boolean>(
    "showGrape",
    showGrapeInitial || !!siteConfig.isGrape,
  )

  const showGrape = showGrapeInternal || showGrapeInitial
  const [showWatermelon, setShowWatermelonInternal] = useLocalStorage<boolean>(
    "showWatermelon",
    showWatermelonInitial || !!siteConfig.isWatermelon,
  )

  useEffect(() => {
    // setShowGrapeInternal(showGrapeInitial)
  }, [showGrapeInitial])

  const setShowGrape = (sw: boolean) => {
    setShowGrapeInternal(sw)
  }

  const setShowWatermelon = (sw: boolean) => {
    setShowWatermelonInternal(sw)
  }

  useEffect(() => {
    setShowWatermelonInternal(showWatermelonInitial)
  }, [showWatermelonInitial])

  // Only show tribe profile when on app's own page (not /tribe route)

  const tribeSlug = pathname?.startsWith("/t/")
    ? pathname.replace("/t/", "").split("?")[0]
    : undefined

  const currentTribe = tribeSlug
    ? tribes?.tribes?.find((t) => t.slug === tribeSlug)
    : undefined

  const tribeQuery = searchParams.get("tribe") === "true"

  // Normalize to first path segment (strip locale prefix if present) for excludedSlugRoutes

  const canBeTribeProfile =
    !canShowAllTribe &&
    !_isExcluded &&
    !(siteConfig.isTribe && !clearLocale(pathname))

  const showTribeInitial =
    !!(
      canShowAllTribe ||
      tribeSlug ||
      postId ||
      tribeQuery ||
      props.showTribe ||
      canBeTribeProfile
    ) && canShowTribe

  const [showTribeInternal, setShowTribeFinal] = useLocalStorage<
    boolean | undefined | null
  >("showTribe", showTribeInitial)

  const showTribe = !!showTribeInternal

  const showTribeProfileInternal = canBeTribeProfile

  const downloadUrl =
    (canShowAllTribe && showTribe) || _isExcluded
      ? `${minioUrl}/Tribe.dmg`
      : app && installs.includes(app?.slug || "")
        ? `${minioUrl}/${capitalizeFirstLetter(app.slug || "")}.dmg`
        : app?.store?.app && installs.includes(app?.store?.app?.slug || "")
          ? `${minioUrl}/${capitalizeFirstLetter(app?.store?.app?.slug || "")}.dmg`
          : installs.includes(withFallback)
            ? `${minioUrl}/${capitalizeFirstLetter(withFallback)}.dmg`
            : ""

  const chromeWebStoreUrl =
    (canShowAllTribe && showTribe) || _isExcluded
      ? tribeSiteConfig.chromeWebStoreUrl
      : (siteConfigApp as any)?.chromeWebStoreUrl ||
        app?.chromeWebStoreUrl ||
        storeApp?.chromeWebStoreUrl ||
        "https://chromewebstore.google.com/detail/chrry-%F0%9F%8D%92/odgdgbbddopmblglebfngmaebmnhegfc"

  const showTribeProfileMemo = useMemo(
    () => showTribeProfileInternal,
    [showTribeProfileInternal, tribeQuery],
  )

  const showTribeProfile =
    !tribeSlug && (showTribeProfileInternal || showTribeProfileMemo)

  const isPearInternal =
    (searchParams.get("pear") === "true" &&
      (accountApp ? app?.id !== accountApp?.id : true)) ||
    app?.slug === "pear"

  const [isPear, setPearInternal] = useState(isPearInternal)

  const showFocus = showFocusInternal ?? isFocus

  useEffect(() => {
    if (postId) setShowFocusInternal(false)
    if (
      showFocusInternal === undefined &&
      siteConfig?.slug === "focus" &&
      !siteConfig?.isTribe
    ) {
      setShowFocusInternal(true)
    }
    // if (showFocusInitial) {
    //   setShowFocusInternal(showFocusInitial)
    // }
  }, [showFocusInternal, siteConfig, postId])

  const setShowFocus = (sw: boolean) => {
    setShowFocusInternal(sw)

    if (sw) {
      addParams({ focus: "true" })
      setThread(undefined)
      setThreadId(undefined)
      setShowTribe(false)
    } else {
      showFocus && removeParams("focus")
    }
  }

  const pear = storeApps.find((app) => app.slug === "pear")

  const [wasPear, setWasPear] = useState(isPear)
  const setPear = (value: sushi | undefined, navigate?: boolean) => {
    setPearInternal(!!value)
    if (value) {
      setWasPear(true)
      toast.success(`${t("Let's Pear")} 🍐`)
      if (navigate) {
        router.push(`${getAppSlug(value)}?pear=true`)
      } else {
        addParams({ pear: "true" })
      }

      return
    }

    removeParams("pear")
  }

  const isP = false

  const setIsP = (value: boolean) => {
    setPearInternal(!!value)
  }
  useEffect(() => {
    isPearInternal && setPearInternal(isPearInternal)
    if (isPearInternal) {
      setShowFocus(false)
      plausible({
        name: ANALYTICS_EVENTS.PEAR,
        props: {
          value: true,
          app: app?.name,
          slug: app?.slug,
          id: app?.id,
        },
      })
    }
  }, [isPearInternal, app?.name, app?.slug, app?.id])

  const setShowTribe = (value: boolean) => {
    if (value && showWatermelon) {
      setShowWatermelon(false)
    }
    if (!canShowTribe) return
    setShowTribeFinal(value)

    // value ? addParams({ tribe: true }) : removeParams(["tribe"])
  }

  useEffect(() => {
    ;(showTribeFromPath || postId || tribeQuery) && setShowTribe(true)
  }, [showTribeFromPath, postId, tribeQuery])
  const { data: moodData, mutate: refetchMood } = useSWR(
    (user || guest) && shouldFetchMood && token ? ["mood", token] : null, // Disabled by default, fetch manually with refetchMood()
    async () => {
      const response = await apiFetch(`${API_URL}/mood`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.json()
    },
  )

  const fetchMood = async () => {
    setShouldFetchMood(true)
    shouldFetchMood && refetchMood()
  }

  useEffect(() => {
    if (moodData?.id) {
      setMood(moodData)
    }
  }, [moodData])

  const {
    data: moodsData,
    isLoading: isLoadingMoods,
    mutate: refetchMoods,
  } = useSWR(shouldFetchMoods && token ? ["moods", token] : null, async () => {
    const response = await apiFetch(`${API_URL}/moods`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  })

  const updateMood = async ({ type }: { type: moodType }) => {
    const result = await apiFetch(`${API_URL}/mood`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    })

    const data = await result.json()

    if (data?.error) {
      toast.error(data.error)
      return
    }

    refetchMood()
    refetchMoods()
  }

  useEffect(() => {
    if (moodsData && Array.isArray(moodsData?.moods)) {
      setMoods({
        ...moodsData,
        moods: moodsData?.moods?.map((item: mood) => ({
          ...item,
          createdOn: new Date(item?.createdOn || ""),
          updatedOn: new Date(item?.updatedOn || ""),
        })),
      })
    }
  }, [moodsData])

  if (translations && locale) {
    if (!i18n.hasResourceBundle(locale, "translation")) {
      i18n.addResourceBundle(locale, "translation", translations)
    }
    if (i18n.language !== locale && !hasHydrated) {
      i18n.changeLanguage(locale)
    }
  }

  const [modelIdInternal, setModelIdInternal] = useLocalStorage<
    string | undefined
  >("modelId", undefined)

  const setModelId = (value: string | undefined) => {
    setModelIdInternal(value || "")
  }
  const modelId = isAdmin ? modelIdInternal : undefined

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if ((user || guest) && !isSessionLoading) {
      setIsLoading(false)
    }
  }, [user, guest, isSessionLoading])

  const [showCharacterProfiles, setShowCharacterProfiles] = useState(false)
  const [characterProfiles, setCharacterProfiles] = useState<
    characterProfile[]
  >([])

  useEffect(() => {
    if (user?.characterProfiles || guest?.characterProfiles) {
      setCharacterProfiles(
        user?.characterProfiles || guest?.characterProfiles || [],
      )
    }
  }, [user, guest])

  const aiAgentsInitial = session?.aiAgents || []

  const [aiAgentsInternal, setAiAgents] = useState<aiAgent[]>(aiAgentsInitial)

  const sushiAgent = aiAgentsInternal?.find((agent) => agent.name === "sushi")
  const peachAgent = aiAgentsInternal?.find((agent) => agent.name === "sushi")
  const freeAgent = aiAgentsInternal?.find((agent) => agent.name === "free")

  const aiAgents = aiAgentsInternal.filter((agent) =>
    !isAdmin && isE2E && !isLiveTest ? agent.name === freeAgent?.name : true,
  )

  const claudeAgent = aiAgents?.find((agent) => agent.name === "claude")

  const deepSeekAgent = sushiAgent // Alias: deepSeek is replaced by Sushi
  const perplexityAgent = aiAgents?.find((agent) => agent.name === "perplexity")

  const appAgent = aiAgents.find((agent) => agent.name === app?.defaultModel)

  const favouriteAgent = aiAgents?.find(
    (agent) => agent.name === (user || guest)?.favouriteAgent,
  )

  const [instructions, setInstructions] = useState<instruction[] | undefined>(
    undefined,
  )

  const refetchInstructions = async ({ appId }: { appId?: string }) => {
    // if (!token) return
    // // setInstructions(app?.userInstructions)
    // if (user) {
    //   const item = await getUser({
    //     token,
    //     appId,
    //     threadId,
    //   })
    //   if (item) {
    //     setInstructions(item.instructions)
    //   }
    // }
    // if (guest) {
    //   const item = await getGuest({
    //     token,
    //     appId,
    //     threadId,
    //   })
    //   if (item) {
    //     setInstructions(item.instructions)
    //   }
    // }
  }

  const setApp = useCallback(
    (item: sushi | undefined) => {
      if (!hasStoreApps(item)) {
        setLoadingApp(item)
        return
      }

      setLastAppId(item?.id)
      setAppInternal((prevApp) => {
        const newApp = item
          ? {
              ...item,
              image: item.image || item.images?.[0]?.url,
            }
          : undefined

        // Only refetch instructions if app ID actually changed
        if (prevApp?.id !== newApp?.id) {
          // refetchAccount()
          // refetchInstructions({ appId: newApp?.id })
        }

        // Merge apps from the new app's store
        newApp?.store?.apps && mergeApps(newApp?.store?.apps)
        return newApp
      })
    },
    [baseApp, mergeApps, user, guest],
  )

  const [thread, setThreadInternal] = useState<thread | undefined>(
    props.thread?.thread,
  )

  const setThreadId = (id?: string) => {
    threadIdRef.current = id
  }

  const setThread = (thread: thread | undefined) => {
    setThreadId(thread?.id)
    setThreadInternal(thread)
  }

  // useEffect(() => {
  //   const slug = accountApp ? getAppSlug(accountApp) : ""
  //   if (slug !== pathname && accountApp?.id === app?.id) {
  //     router.push(slug)
  //   }
  // }, [accountApp, app, pathname])

  // app?.id removed from deps - use prevApp inside setState instead

  useEffect(() => {
    if (!baseApp) return
    if (!storeApps.length) return

    // Priority 1: If there's a thread, use the thread's app
    let matchedApp: sushi | undefined

    if (!matchedApp && thread?.appId && !loadingAppId) {
      const threadApp = storeApps.find((app) => app.id === thread.appId)
      matchedApp = threadApp
    }

    if (!matchedApp && postId && tribePost && !loadingAppId) {
      const postApp = storeApps.find((app) => app.id === tribePost.appId)
      matchedApp = postApp
    }

    // Priority 2: Find app by pathname
    if (!matchedApp) {
      matchedApp = findAppByPathname(pathname, storeApps) || baseApp
      // Using pathname app
    }

    // App detection logic

    // Only update if the matched app is different from current app
    if (matchedApp && matchedApp.id !== app?.id) {
      // Switching app
      setApp(matchedApp)
      setStore(matchedApp.store || undefined)

      setSlug(getAppSlug(matchedApp) || "")
    }
  }, [
    storeApps,
    pathname,
    baseApp,
    thread,
    threadId,
    lastAppId,
    postId,
    isExtension,
    loadingAppId,
    updatedApp,
    tribePost,
  ])
  // Thread app takes priority over pathname, then falls back to pathname detection

  const [profile, setProfileInternal] = useState<user | undefined>(undefined)

  const setProfile = (profile: user | undefined) => {
    // if (profile && profile?.id === user?.id) return

    setProfileInternal(profile)
  }

  useEffect(() => {
    // PerformanceObserver is web-only, skip on React Native
    if (typeof PerformanceObserver === "undefined") {
      return
    }

    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Sanitize URL to remove sensitive query params (fingerprint, tokens, etc.)
          const sanitizeName = (name: string) => {
            try {
              const url = new URL(name)
              // Remove sensitive query parameters
              url.searchParams.delete("fp") // fingerprint
              url.searchParams.delete("auth_token") // auth tokens
              url.searchParams.delete("token") // auth tokens
              url.searchParams.delete("api_key") // API keys
              return url.toString()
            } catch {
              // If not a valid URL, return as-is (could be a resource name)
              return name
            }
          }

          plausible({
            name: ANALYTICS_EVENTS.PERFORMANCE,
            props: {
              name: sanitizeName(entry.name),
              entryType: entry.entryType,
              startTime: entry.startTime,
              duration: entry.duration,
            },
          })
        }
      }).observe({
        entryTypes: [
          "largest-contentful-paint",
          "first-input",
          "layout-shift",
          "navigation",
          "paint",
        ],
      })
    } catch (error) {
      console.warn("PerformanceObserver not supported:", error)
    }
  }, [plausible])

  const [shouldFetchTasks, setShouldFetchTasks] = useState(false)

  const {
    data: tasksData,
    mutate: refetchTasks,
    isLoading: isLoadingTasks,
  } = useSWR(
    shouldFetchTasks && token ? ["tasks"] : null, // Disabled by default, fetch manually with refetchTasks()
    async () => {
      const response = await apiFetch(`${API_URL}/tasks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      return data
    },
  )

  const [tasks, setTasks] = useState<
    | {
        tasks: Task[]
        totalCount: number
        hasNextPage: boolean
        nextPage: number | null
      }
    | undefined
  >(tasksData?.tasks ? { ...tasksData, tasks: tasksData.tasks } : undefined)

  useEffect(() => {
    if (tasksData?.tasks) {
      setTasks({ ...tasksData, tasks: tasksData.tasks })
    }
  }, [tasksData])

  useEffect(() => {
    if (!threadId) {
      setThread(undefined)
    }
  }, [threadId])

  const fetchTasks = async () => {
    setShouldFetchTasks(true)
    await refetchTasks()
  }

  // Handle session data updates
  useEffect(() => {
    processSession(sessionData)
  }, [sessionData])

  const defaultInstructions = getExampleInstructions()
    .map((inst) => ({
      ...inst,
      title: inst.title,
      content: t(inst.content || ""),
    }))
    .map((inst) => ({
      ...inst,
      title: t(inst.title),
      content: t(inst.content || ""),
    }))

  const lastRateLimitErrorRef = useRef<string | null>(null)

  useEffect(() => {
    if (sessionError) {
      const errorMessage = sessionError?.message

      if (
        errorMessage.includes("HTTP 429") ||
        errorMessage.includes("Too Many Requests")
      ) {
        // Only show toast if it's a different error or enough time has passed
        if (lastRateLimitErrorRef.current !== errorMessage) {
          lastRateLimitErrorRef.current = errorMessage
          toast.error(
            "Rate limit exceeded. Please wait a moment before trying again.",
            {
              duration: 5000,
            },
          )
        }
      }
    }
  }, [sessionError])

  // Create sign in wrapper to match Chrry's expected interface
  const signInContext = async (
    provider: "google" | "apple" | "github" | "credentials",
    options: {
      email?: string
      password?: string
      redirect?: boolean
      callbackUrl: string
      errorUrl?: string
      blankTarget?: boolean
    },
  ) => {
    setToken(undefined)
    if (provider === "google") {
      return signInWithGoogle({
        callbackUrl: options.callbackUrl,
        errorUrl: options.errorUrl,
      })
    } else if (provider === "apple") {
      return signInWithApple({
        callbackUrl: options.callbackUrl,
        errorUrl: options.errorUrl,
      })
    } else if (provider === "github") {
      return signInWithGitHub({
        callbackUrl: options.callbackUrl,
        errorUrl: options.errorUrl,
      })
    } else if (
      provider === "credentials" &&
      options.email &&
      options.password
    ) {
      return signInWithPassword(options.email, options.password)
    }
    return { success: false, error: "Invalid provider or missing credentials" }
  }

  // Create sign out wrapper
  const signOutContext = async (options: { callbackUrl?: string }) => {
    return signOutInternal(options)
  }

  const popcorn = storeApps.find((app) => app.slug === "popcorn")
  const atlas = storeApps.find((app) => app.slug === "atlas")
  const bloom = storeApps.find((app) => app.slug === "bloom")

  const signOut = async () => {
    setShouldFetchSession(false)
    setUser(undefined)
    setGuest(undefined)
    setToken(fingerprint)

    if (isCapacitor || isTauri || isExtension) {
      await refetchSession()
    }

    signOutInternal({ callbackUrl: "/" })

    // if (typeof window !== "undefined") {
    //   window.location.href = "/?loggedOut=true"
    // }
  }

  const isExtensionRedirect = searchParams.get("extension") === "true"
  const isLoggedOut = searchParams.get("loggedOut") === "true" || undefined
  const isWelcome = searchParams.get("welcome") === "true" || undefined
  const showAccountStatusRef = useRef(false)

  useEffect(() => {
    if (showAccountStatusRef.current) return

    if (isLoggedOut) {
      showAccountStatusRef.current = true

      isExtensionRedirect
        ? toast.success(`${t("Logged out")}. ${t("Reload your extension")}`)
        : toast.success(t("Logged out successfully"))
      removeParams("loggedOut")
    }
    if (isWelcome) {
      // setSelectedAgent(undefined)
      isExtensionRedirect
        ? toast.success(`${t("Welcome")}. ${t("Reload your extension")}`)
        : toast.success(`${t("Welcome")}`)

      removeParams("welcome")
      showAccountStatusRef.current = true
    }
  }, [isLoggedOut, isWelcome])

  const auth_token = props.apiKey || searchParams.get("auth_token")

  const fp = searchParams.get("fp")

  const [displayedApps, setDisplayedApps] = useState<sushi[]>([])

  // Find the most recent cross-store app from navigation history:
  // i.e., an app the user previously visited that is NOT in the current store's apps
  const lastAnchorApp = useMemo(() => {
    const currentAppId = app?.id
    for (let i = navigationHistory.length - 1; i >= 0; i--) {
      const entry = navigationHistory[i]
      if (!entry || entry.appId === currentAppId) continue
      // Not in current store → this is the cross-store anchor
      if (!apps.some((x) => x.id === entry.appId)) {
        return entry
      }
    }
    return null
  }, [navigationHistory, app?.id, apps])

  const lastApp = app

  // back = the cross-store anchor app object (resolved from storeApps cache)
  const backInitial = lastAnchorApp
    ? storeApps.find((a) => a.id === lastAnchorApp.appId && a.id !== app?.id)
    : undefined

  const [back, setBack] = useState(backInitial)

  useEffect(() => {
    backInitial && setBack(backInitial)
  }, [backInitial])

  async function handleOAuthExchange(authCode: string) {
    if (!authCode) return

    console.log("🔑 Client-side OAuth exchange started...")

    try {
      const exchangeResponse = await apiFetch(`${API_URL}/auth/exchange-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode }),
        credentials: "include",
      })

      if (exchangeResponse.ok) {
        const { token } = await exchangeResponse.json()

        return token

        // Set cookie with domain for cross-subdomain auth

        console.log("✅ Client-side OAuth exchange successful")

        // Clean up URL - remove auth_token param

        // Reload to get fresh session with new token
      } else {
        const errText = await exchangeResponse.text()
        console.error(
          "❌ OAuth exchange failed:",
          exchangeResponse.status,
          errText,
        )
      }
    } catch (error) {
      console.error("❌ OAuth exchange error:", error)
    }
  }

  const [loadingToken, setLoadingToken] = useState(!!auth_token)

  useEffect(() => {
    if (auth_token) {
      handleOAuthExchange(auth_token)
        .then((token) => {
          setToken(token)
        })
        .finally(() => setLoadingToken(false))
      // Remove auth_token from URL
      removeParams("auth_token")
    } else if (!tokenCandidate && fingerprint && isStorageReady) {
      setToken(fingerprint)
    }
    if (fp) {
      // Remove fp from URL
      !isE2E && removeParams("fp")
    }
  }, [auth_token, tokenCandidate, fp, fingerprint, isStorageReady])

  // Track spatial navigation (app changes)
  useEffect(() => {
    if (!app?.id) return

    const now = Date.now()

    // Throttle: Skip rapid transitions (< 100ms)
    if (now - lastNavigationTime.current < NAVIGATION_THROTTLE_MS) {
      return
    }
    lastNavigationTime.current = now

    setNavigationHistory((prev) => {
      // Update duration of last entry
      if (prev.length > 0) {
        const lastEntry = prev[prev.length - 1]
        if (lastEntry && !lastEntry.duration) {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...lastEntry,
            duration: now - lastEntry.timestamp,
          }
          return [
            ...updated,
            {
              appId: app.id,
              appName: app.name || app.id,
              timestamp: now,
              from: lastEntry.appId,
            },
          ]
        }
      }

      // Add new navigation entry
      return [
        ...prev,
        {
          appId: app.id,
          appName: app.name || app.id,
          timestamp: now,
          from: prev[prev.length - 1]?.appId,
        },
      ]
    })

    // Track spatial navigation analytics
    plausible({
      name: ANALYTICS_EVENTS.SPATIAL_NAVIGATION,
      props: {
        from: navigationHistory[navigationHistory.length - 1]?.appName,
        to: app.name,
        duration:
          navigationHistory[navigationHistory.length - 1]?.duration || 0,
      },
    })
  }, [app?.id])

  useEffect(() => {
    if (session?.versions) {
      setVersions(session.versions)
    }
  }, [session?.versions])

  const [PROMPT_LIMITS, setPromptLimits] = useState({
    INPUT: 7000, // Max for direct input
    INSTRUCTIONS: 2000, // Max for instructions
    TOTAL: 30000, // Combined max (input + context)
    WARNING_THRESHOLD: 5000, // Show warning at this length
    THREAD_TITLE: 100,
  })

  const [loadingAffiliateStats, setLoadingAffiliateStats] =
    useState<boolean>(false)

  const actions = useMemo(
    () =>
      getActions({
        API_URL,
        token: token || "",
      }),
    [API_URL, token],
  )

  const { data: affiliateData, mutate: refetchAffiliateData } = useSWR(
    user && token && pathname.startsWith("/affiliate") ? ["affiliate"] : null,
    async () => {
      if (!token) {
        return null
      }
      setLoadingAffiliateStats(true)
      try {
        const res = await apiFetch(`${API_URL}/affiliates`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return data
      } catch (error) {
        console.error("Failed to fetch affiliate stats:", error)
        return null
      } finally {
        setLoadingAffiliateStats(false)
      }
    },
  )

  const swarmInitial = {
    bees: allApps.sort((a) =>
      [
        "hippo",
        "vex",
        "peach",
        "focus",
        "vault",
        "sushi",
        "pear",
        "grape",
        "chrry",
        "popcorn",
      ].includes(a.slug)
        ? -1
        : 1,
    ),
  }
  const [swarmState, setSwarm] = useState<swarm | undefined>({
    ...swarmInitial,
  } as swarm)

  const swarm = swarmState || (swarmInitial as swarm)

  const [affiliateStats, setAffiliateStats] = useState<
    affiliateStats | null | undefined
  >(null)

  useEffect(() => {
    if (affiliateData) {
      setAffiliateStats(affiliateData)
    } else if (!user && !loadingAffiliateStats) {
      setAffiliateStats(null)
    }
  }, [affiliateData, loadingAffiliateStats, user])

  const [affiliateCodeData, setAffiliateCodeData] = useLocalStorage<{
    code: string
    timestamp: number
  } | null>("vex_affiliate_code", null)

  const affiliateCode = useMemo(() => {
    if (!affiliateCodeData) return null

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const isExpired = now - affiliateCodeData.timestamp > thirtyDaysInMs

    if (isExpired) {
      setAffiliateCodeData(null)
      console.log("⏰ Affiliate code expired (30 days)")
      return null
    }

    return affiliateCodeData.code
  }, [affiliateCodeData, setAffiliateCodeData])

  const [weather, setWeather] = useLocalStorage<
    | {
        location: string
        country: string
        temperature: string
        condition: string
        code: number
        createdOn: Date
        lastUpdated: Date
      }
    | undefined
  >("weather", user?.weather || guest?.weather || undefined)

  function getUnitFromCountry(country: string) {
    const fahrenheitCountries = [
      "United States",
      "Bahamas",
      "Belize",
      "Cayman Islands",
      "Liberia",
    ]
    return fahrenheitCountries.includes(country) ? "F" : "C"
  }
  const {
    data: weatherData,
    error: weatherError,
    mutate: refetchWeather,
  } = useSWR(
    token ? ["weather"] : null,
    async () => {
      // return
      if (!token) return null

      try {
        const res = await apiFetch(`${API_URL}/weather`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          console.error(`Error fetching weather`, res)
          return null
        }
        return res.json()
      } catch (error) {
        captureException(error)
        console.error(`Error fetching weather`, error)
      }
    },
    {
      refreshInterval: (data) => {
        // Use the data parameter provided by SWR
        if (data) {
          return getWeatherCacheTime(data) * 1000 // Convert seconds to milliseconds
        }
        return 15 * 60 * 1000 // Default 15 minutes if no data yet
      },
      onErrorRetry: (error) => {
        if (error.message.includes("429")) return
      },
      shouldRetryOnError: false,
    },
  )

  useEffect(() => {
    if (weatherData) {
      if (!weatherData.location || !weatherData.current?.condition) return

      const unit = getUnitFromCountry(weatherData.location.country)
      setWeather({
        location: weatherData.location.name,
        country: weatherData.location.country,
        temperature: `${unit === "F" ? weatherData.current.temp_f : weatherData.current.temp_c}°${unit}`,
        condition: weatherData.current.condition.text,
        code: weatherData.current.condition.code,
        createdOn: new Date(),
        lastUpdated: weatherData.current.last_updated,
      })
    }
  }, [weatherData])

  const toVersionNumber = (version?: string): number => {
    if (!version) return 0

    // Split by dots and take first 3 parts for major.minor.patch
    const parts = version.split(".").slice(0, 3)

    // Pad with zeros if needed and convert each part
    const [major = 0, minor = 0, patch = 0] = parts.map((part) => {
      const num = Number.parseInt(part.replace(/\D/g, ""), 10)
      return Number.isNaN(num) ? 0 : num
    })

    // Create a comparable number: major * 10000 + minor * 100 + patch
    return major * 10000 + minor * 100 + patch
  }

  useEffect(() => {
    if (!token) return
    // Check URL for ref parameter
    const ref = searchParams.get("ref")

    if (ref && !affiliateCode) {
      // Track click immediately for all users (guests and registered)
      apiFetch(`${API_URL}/affiliates/trackClick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: ref }),
      }).catch((error) => {
        console.error("Failed to plausible affiliate click:", error)
      })

      // Check if user is trying to use their own affiliate code
      if (user) {
        apiFetch(`${API_URL}/affiliates`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (!data.code) return
            if (data.hasAffiliateLink && data.code === ref) {
              console.log("⚠️ Cannot use your own affiliate link")
              return
            }
            // Store affiliate code with timestamp
            setAffiliateCodeData({ code: data.code, timestamp: Date.now() })
            console.log("🎯 Affiliate code stored (30 days):", ref)
          })
          .catch((error) => {
            console.error("Failed to check affiliate link:", error)
            // If check fails, still store the code (backend will validate)
            setAffiliateCodeData({ code: ref, timestamp: Date.now() })
          })
      } else {
        // Guest users can always store affiliate codes
        setAffiliateCodeData({ code: ref, timestamp: Date.now() })
        console.log("🎯 Affiliate code stored (guest, 30 days):", ref)
      }
    }
  }, [searchParams, affiliateCode, setAffiliateCodeData, user, token])

  //Stable since
  const RELEASE_TIMESTAMP = "2025-09-14T09:48:29.393Z" // Move to constants

  const [createdOn, setCreatedOn] = useLocalStorage("createdOn", "")

  useEffect(() => {
    if (!isStorageReady) return

    if (createdOn === "") {
      setCreatedOn(new Date().toISOString())
    }
  }, [createdOn, isStorageReady])

  const [needsUpdateModalOpen, setNeedsUpdateModalOpen] = useState(false)
  const [needsUpdate, setNeedsUpdate] = useState(false)

  useEffect(() => {
    const update = !versions
      ? false
      : isTauri
        ? toVersionNumber(versions?.macosVersion) > toVersionNumber(VERSION)
        : isExtension
          ? isFirefox
            ? toVersionNumber(versions?.firefoxVersion) >
              toVersionNumber(VERSION)
            : toVersionNumber(versions?.chromeVersion) >
              toVersionNumber(VERSION)
          : isStandalone && createdOn
            ? new Date(createdOn).getTime() <
              new Date(RELEASE_TIMESTAMP).getTime()
            : false
    setNeedsUpdate(update)
    setNeedsUpdateModalOpen(update)
  }, [versions, createdOn, isStandalone, isExtension, isFirefox, isTauri])

  return (
    <AuthContext.Provider
      value={{
        showGrapes,
        setShowGrapes,
        grapes,
        burn,
        setBurn,
        canBurn,
        isProgramme,
        showWatermelon,
        setShowWatermelon,
        setIsProgramme,
        threads,
        setThreads,
        showFocus,
        setScheduledJobs,
        fetchScheduledJobs: async () => {
          await refetchScheduledJobs()
        },
        setShowFocus,
        displayedApps,
        lastApp,
        setDisplayedApps,
        lastAnchorApp,
        back,
        updatedApp,
        setUpdatedApp,
        isLoadingTasks,
        fetchTasks,
        tasks,
        setTasks,
        threadId,
        loadingApp,
        selectedAgent,
        setSelectedAgent,
        userSelectedAgent,
        setUserSelectedAgent,
        modelId,
        setModelId,
        setLoadingApp,
        taskId,
        focus,
        sushi,
        claudeAgent,
        appAgent,
        sushiAgent,
        deepSeekAgent,
        favouriteAgent,
        perplexityAgent,
        setMood,
        about,
        setAbout,
        isHippoOpen,
        setIsHippoOpen,
        ask,
        tickerPaused,
        setTickerPaused,
        setAsk,
        isLoadingMoods,
        mood,
        moods,
        earnBadge,
        setEarnBadge,
        isLoadingMood,
        enableNotifications,
        setEnableNotifications,
        loadingAppId,
        setLoadingAppId,
        wasPear,
        setWasPear,
        defaultInstructions,
        isSavingApp,
        setIsSavingApp,
        newApp,
        scheduledJobs,
        isLoadingScheduledJobs,
        hasStoreApps,
        storeAppsSwr,
        accountApps,
        threadIdRef,
        affiliateStats,
        affiliateCode,
        loadingAffiliateStats,
        vex,
        fetchApps: async () => {
          await refetchApps()
        },
        TEST_MEMBER_FINGERPRINTS,
        TEST_GUEST_FINGERPRINTS,
        TEST_MEMBER_EMAILS,
        app,
        chrry,
        chrryUrl,
        showTribe,
        setShowTribe,
        refetchWeather,
        weather,
        storeApp,
        tribeStripeSession,
        setTribeStripeSession,
        store,
        isDonutOpen,
        setIsDonutOpen,
        stores,
        migratedFromGuestRef,
        isDevelopment,
        setStore,
        setStores,
        getAppSlug,
        language,
        setLanguage,
        tribes,
        tribePosts,
        tribePost,
        setTribes,
        canShowTribe,
        setTribePosts,
        actions,
        setTribePost,
        postToTribe,
        setPostToTribe,
        postToMoltbook,
        setPostToMoltbook,
        moltPlaceHolder,
        setMoltPlaceHolder,
        accountApp,
        memoriesEnabled,
        patchCharacterProfile,
        isUpdatingCharacterProfile,
        setIsUpdatingCharacterProfile,
        appStatus,
        setAppStatus,
        setMemoriesEnabled,
        gift,
        wasGifted,
        lasProcessedSession,
        setWasGifted,
        isPear,
        donut,
        setSkipAppCacheTemp,
        skipAppCacheTemp,
        setPear,
        showCharacterProfiles,
        setShowCharacterProfiles,
        characterProfiles,
        setCharacterProfiles,
        GUEST_TASKS_COUNT,
        PLUS_TASKS_COUNT,
        isLiveTest,
        fingerprint,
        setFingerprint,
        deviceId,
        isGuestTest,
        setIsRetro,
        isRetro,
        isMemberTest,
        user,
        setUser,
        setGuest,
        appId,
        isCI,
        baseApp,
        hasNotification,
        guest,
        threadData: props.thread,
        session,
        token: user?.token || guest?.fingerprint,
        signInPart,
        setSignInPart,
        setShowGrape,
        setSlug,
        slug,
        plausible,
        setToken,
        shouldFetchSession,
        profile,
        setProfile,
        tribeSlug,
        currentTribe,
        timer,
        fetchTimer,
        setTimer,
        isLoadingApps,
        setShouldFetchSession,
        isLoading,
        setIsLoading,
        signOut,
        hourlyLimit,
        hourlyUsageLeft,
        instructions,
        setInstructions,
        thread,
        isSplash,
        setIsSplash,
        minimize,
        setMinimize,
        setThread,
        showGrapeInitial,
        isExtensionRedirect,
        signInContext,
        signOutContext,
        characterProfilesEnabled,
        grape,
        apps,
        setApps: setAllApps,
        setHasNotification,
        atlas,
        bloom,
        popcorn,
        zarathustra,
        updateMood,
        setThreadId,
        burning,
        lastAppId,
        peachAgent,
        freeAgent,
        isRemovingApp,
        storeApps, // All apps from all stores
        refetchSession: async () => {
          await fetchSession()
        },
        refetchAccountApps: async () => {
          await refetchAccountApps()
        },
        pear,
        swarm,
        setSwarm,
        setIsManagingApp,
        isManagingApp,
        setNewApp,
        setIsRemovingApp,
        fetchSession,
        env,
        setEnv,
        WS_URL,
        PROD_FRONTEND_URL,
        isIDE,
        toggleIDE,
        isLoadingPosts,
        setIsLoadingPosts,
        isP,
        setIsP,
        findAppByPathname,
        chromeWebStoreUrl,
        siteConfig,
        from,
        setFrom,
        setAccountApp: setAccountApp,
        setDeviceId,
        hasHydrated,
        setApp,
        aiAgents,
        rtl,
        timeAgo: (date: string | Date, locale = language || "en-US") =>
          ago(date, locale),
        fetchMoods: async () => {
          setShouldFetchMoods(true)
          shouldFetchMood && refetchMoods()
        },
        MAX_FILE_LIMITS,
        OWNER_CREDITS,
        burnApp,
        downloadUrl,
        fetchMood,
        dailyQuestionData,
        advanceDailySection,
        setNeedsUpdateModalOpen,
        needsUpdateModalOpen,
        needsUpdate,
        setDailyQuestionIndex,
        dailyQuestionIndex,
        showTribeProfile,
        postId,
        languageModal,
        setLanguageModal,
        mergeApps,
        CREDITS_PRICE,
        getTribeUrl,
        showGrape,
        canShowAllTribe,
        refetchAffiliateData,
        FRONTEND_URL,
        API_URL,
        MAX_FILE_SIZES,
        commentAppId,
        setCommentAppId,
        showWatermelonInitial,
        creditsLeft,
        setCreditsLeft,
        isE2E,
        PRO_PRICE,
        setPostId,
        PLUS_PRICE,
        selectedInstruction,
        setSelectedInstruction,
        FREE_DAYS,
        ADDITIONAL_CREDITS,
        PROMPT_LIMITS,
        push: router.push,
        versions,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

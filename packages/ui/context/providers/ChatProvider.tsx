"use client"

import { t } from "i18next"
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import toast from "react-hot-toast"
import useSWR from "swr"
import { useUserScroll } from "../../hooks/useUserScroll"
import { useWebSocket } from "../../hooks/useWebSocket"

import { useNavigation, usePlatform, useTheme } from "../../platform"
import type {
  aiAgent,
  app,
  collaboration,
  guest,
  message,
  messages,
  paginatedMessages,
  sushi,
  thread,
  user,
} from "../../types"
import { isOwner, pageSizes } from "../../utils"
import { ANALYTICS_EVENTS } from "../../utils/analyticsEvents"
import { hasThreadNotification } from "../../utils/hasThreadNotification"
import { useApp } from "./AppProvider"
import { useAuth } from "./AuthProvider"
import { useError } from "./ErrorProvider"

interface placeHolder {
  // TODO: Define placeHolder type
  [key: string]: any
}

const ChatContext = createContext<
  | {
      scrollToTop: (timeout?: number) => void
      onlyAgent: boolean
      shouldFetchThread: boolean
      setShouldFetchThread: (shouldFetchThread: boolean) => void
      shouldGetCredits: boolean
      setShouldGetCredits: (shouldGetCredits: boolean) => void
      fetchActiveCollaborationThreadsCount: () => Promise<void>
      fetchPendingCollaborationThreadsCount: () => Promise<void>
      artifacts: File[]
      setArtifacts: (artifacts: File[]) => void
      setIsNewAppChat: ({
        item,
        tribe,
      }: {
        item: sushi | undefined
        tribe?: boolean
      }) => void
      userSelectedAgent?: aiAgent | null
      setInstruction: (instruction: string | undefined) => void
      instruction: string | undefined
      shouldFocus: boolean
      needsReplicate: boolean
      setNeedsReplicate: (value: boolean) => void
      needsFal: boolean
      setNeedsFal: (value: boolean) => void
      setShouldFocus: (shouldFocus: boolean) => void
      placeHolderText: string | undefined
      setPlaceHolderText: (placeHolderText: string | undefined) => void
      isImageGenerationEnabled: boolean
      setShowTribe: (show: boolean) => void
      showTribe: boolean | undefined
      setAbout: (value: string | undefined) => void
      setAsk: (value: string | undefined) => void
      threadsAppId: string | undefined
      setThreadsAppId: (threadsAppId: string | undefined) => void
      hasPearApp?: boolean
      setHasPearApp: (hasPearApp?: boolean) => void
      isDNA?: boolean
      setIsDNA: (isDNA?: boolean) => void
      isTribe?: boolean
      setIsTribe: (isTribe?: boolean) => void
      setIsImageGenerationEnabled: (
        value: boolean,
        forAgent?: aiAgent | null,
      ) => void
      hasNotification: boolean
      nextPage: number | undefined
      setNextPage: (nextPage: number | undefined) => void
      scrollToBottom: (
        timeout?: number,
        force?: boolean,
        element?: HTMLElement | null,
      ) => void
      status: number | null
      error: any
      until: number
      setUntil: (until: number) => void
      liked?: boolean
      setLiked: (liked: boolean | undefined) => void
      isLoadingMore: boolean
      setIsLoadingMore: (isLoadingMore: boolean) => void
      isLoading: boolean
      setIsAgentModalOpenInternal: (isAgentModalOpen: boolean) => void
      isDebateAgentModalOpen: boolean
      setIsDebateAgentModalOpen: (isDebateAgentModalOpen: boolean) => void
      isAgentModalOpen: boolean
      setIsAgentModalOpen: (isAgentModalOpen: boolean) => void
      isAgentAuthorized: (agent: aiAgent | undefined | null) => boolean
      messages: messages
      setMessages: React.Dispatch<React.SetStateAction<messages>>
      perplexityAgent?: aiAgent
      deepSeekAgent?: aiAgent
      claudeAgent?: aiAgent
      favouriteAgent?: aiAgent
      setCreditsLeft: (creditsLeft: number) => void
      isWebSearchEnabled: boolean
      selectedAgent: aiAgent | undefined | null
      setSelectedAgent: (agent: aiAgent | undefined | null) => void
      aiAgents: aiAgent[]
      hitHourlyLimit: boolean
      debateAgent: aiAgent | undefined | null
      setDebateAgent: (agent: aiAgent | undefined | null) => void
      isDebating: boolean
      hourlyLimit: number
      hourlyUsageLeft: number
      isEmpty: boolean
      isChatFloating: boolean
      setIsChatFloating: (isChatFloating: boolean) => void
      input: string
      refetchThread: () => Promise<void>
      setIsWebSearchEnabled: (isWebSearchEnabled: boolean) => void
      setInput: (input: string) => void
      placeHolder: placeHolder | undefined
      setPlaceHolder: (placeHolder?: placeHolder) => void
      creditsLeft?: number
      thread?: thread
      threadId?: string
      setThread: (thread?: thread) => void
      userNameByUrl: string | undefined
      isLoadingThreads: boolean
      setIsLoadingThreads: (value: boolean) => void
      burn: boolean
      threads?: {
        threads?: thread[]
        totalCount: number
      }
      setThreads: (value: { threads: thread[]; totalCount: number }) => void

      wasIncognito: boolean
      setWasIncognito: (value: boolean) => void
      isVisitor: boolean
      setIsVisitor: (value: boolean) => void
      collaborationStep: number
      setCollaborationStep: (step: number) => void
      isNewChat: boolean
      refetchThreads: () => Promise<void>
      activeCollaborationThreadsCount: number
      pendingCollaborationThreadsCount: number
      setCollaborationStatus: (
        status: "pending" | "active" | undefined | null,
      ) => void
      collaborationStatus: "pending" | "active" | undefined | null
      setIsNewChat: ({
        value,
        to,
        tribe,
        pear,
        postId,
      }: {
        value: boolean
        to?: string
        tribe?: boolean
        pear?: boolean
        postId?: string
      }) => void
    }
  | undefined
>(undefined)

export function ChatProvider({
  children,
}: {
  children: ReactNode
}): React.JSX.Element {
  // Get auth data
  const {
    setGuest,
    setUser,
    setInstructions,
    setApp,
    storeApps,
    storeAppsSwr,
    app,
    chrry,
    plausible,
    aiAgents,
    token,
    setProfile,
    getAppSlug,
    deviceId,
    profile,
    fingerprint,
    user,
    guest,
    session,
    thread,
    setThread,
    sushiAgent,
    deepSeekAgent,
    perplexityAgent,
    claudeAgent,
    favouriteAgent,
    threadIdRef,
    threadId,
    migratedFromGuestRef,
    fetchSession,
    loadingApp,
    setLoadingApp,
    threads,
    setThreads,
    hasStoreApps,
    hasNotification,
    setHasNotification,
    setThreadId,
    newApp,
    updatedApp,
    setNewApp,
    setUpdatedApp,
    setAccountApp,
    burn,
    setBurn,
    isPear,
    setPear,
    setShowFocus,
    showFocus,
    hourlyLimit,
    hourlyUsageLeft,
    baseApp,
    postId,
    canShowAllTribe,
    siteConfig,
    actions,
    setShowWatermelon,
    appId,
    setPostId,
    userSelectedAgent,
    setUserSelectedAgent,
    ...auth
  } = useAuth()

  const [isNewChat, setIsNewChatInternal] = useState(false)

  // const threadId = threadIdRef.current

  const [isChatFloating, setIsChatFloating] = useState(false)

  // Chat state

  const [messages, setMessages] = useState<
    {
      message: message & {
        isStreaming?: boolean
        isStreamingStop?: boolean
      }
      user?: user
      guest?: guest
      aiAgent?: aiAgent
      thread?: thread
      app?: sushi
    }[]
  >(auth.threadData?.messages.messages || [])

  const isEmpty = !messages?.length

  const { pathname, searchParams, addParams, removeParams, ...router } =
    useNavigation()

  const showTribe = auth.showTribe && isEmpty

  const setShowTribe = auth.setShowTribe

  const { isExtension, isMobile, isTauri } = usePlatform()

  // Move input state here to prevent AuthProvider re-renders
  const [input, setInput] = useState<string>("")

  // Override setAsk and setAbout to also update input
  const setAsk = (value: string | undefined) => {
    auth.setAsk(value)
    if (value) {
      setInput(value)
    }
  }

  const setAbout = (value: string | undefined) => {
    auth.setAbout(value)
  }

  const [shouldFetchThreads, setShouldFetchThreads] = useState(true)

  // Sync input with URL ask/about parameters
  useEffect(() => {
    const ask = searchParams.get("ask")
    const about = searchParams.get("about")

    if (ask) {
      setInput(ask)
    } else if (about) {
      setInput(about)
    }
  }, [searchParams])

  let userNameByUrl: string | undefined

  const pathSegments = pathname.split("/").filter(Boolean)

  if (pathSegments.length >= 1 && pathname.includes("/u/")) {
    // New pattern: /u/[locale]/[username] OR /u/[username]
    userNameByUrl = pathSegments[pathSegments.length - 1]
  }

  const [collaborationStatus, setCollaborationStatusInternal] = useState<
    "pending" | "active" | undefined | null
  >(
    user?.pendingCollaborationThreadsCount ||
      guest?.pendingCollaborationThreadsCount
      ? "pending"
      : undefined,
  )

  const toFetch = threadId || threadIdRef.current

  // Load cached threads immediately on mount

  useEffect(() => {
    if (user && migratedFromGuestRef.current) {
      migratedFromGuestRef.current = false
      fetchSession()
      refetchThreads()
    }
  }, [user])

  const [threadsAppId, setThreadsAppId] = useState<string | undefined>()
  const [hasPearApp, setHasPearApp] = useState<boolean | undefined>(undefined)
  const [isDNA, setIsDNA] = useState<boolean | undefined>(undefined)
  const [isTribe, setIsTribe] = useState<boolean | undefined>(undefined)

  const {
    data: threadsSwr,
    mutate: refetchThreads,
    isLoading: isLoadingThreadsSwr,
    error: threadsError,
  } = useSWR(
    token && shouldFetchThreads && session
      ? [
          "contextThreads",
          toFetch,
          appId,
          collaborationStatus,
          isNewChat,
          threadsAppId,
          hasPearApp,
          isDNA,
          isTribe,
        ]
      : null,
    async () => {
      try {
        const threads = await actions.getThreads({
          onError: (status) => {
            if (status === 429) {
              setShouldFetchThreads(false)
            }
          },
          hasPearApp: pathname.includes("/threads") ? hasPearApp : undefined,
          appId: pathname.includes("/threads") ? threadsAppId : appId,
          isDNA: pathname.includes("/threads") ? isDNA : undefined,
          userName: userNameByUrl,
          isTribe: pathname.includes("/threads") ? isTribe : undefined,
          pageSize: pageSizes.menuThreads - (isMobile ? 2 : 0),
          sort: "bookmark",
          collaborationStatus:
            collaborationStatus === "pending" ? undefined : collaborationStatus,
          threadId:
            !thread?.collaborations?.some(
              (c) => user && c.user.id === user?.id,
            ) || guest
              ? toFetch
              : undefined,
        })

        // Cache threads on successful fetch (30 min TTL)

        return threads
      } catch (error) {
        captureException(error)
      }
    },

    {
      onError: (error) => {
        // Stop retrying on rate limit errors
        if (error.message.includes("429")) {
          setShouldFetchThreads(false)
        }
      },
      // revalidateOnMount: true,
      // revalidateOnFocus: true,
    },
  )

  const [isLoadingThreads, setIsLoadingThreads] = useState(!threads)

  useEffect(() => {
    if (threadsError || !isLoadingThreadsSwr) {
      setIsLoadingThreads(false)
    }
  }, [threadsError, isLoadingThreadsSwr])

  const [activeCollaborationThreadsCount, setActiveCollaborationThreadsCount] =
    useState<number>(
      user?.activeCollaborationThreadsCount ||
        guest?.activeCollaborationThreadsCount ||
        0,
    )

  useEffect(() => {
    if (threadsSwr && Array.isArray(threadsSwr.threads)) {
      setThreads(threadsSwr)
      setIsLoadingThreads(false)
    }
  }, [threadsSwr])

  const fetchActiveCollaborationThreadsCount = async () => {
    const threads = await actions.getThreads({
      pageSize: 1,
      collaborationStatus: "active",
      appId,
    })
    threads?.totalCount &&
      setActiveCollaborationThreadsCount(threads.totalCount)
  }

  const [
    pendingCollaborationThreadsCount,
    setPendingCollaborationThreadsCount,
  ] = useState<number>(
    threads?.threads?.filter((t) =>
      t.collaborations?.some((c) => c.collaboration.status === "pending"),
    ).length || 0,
  )

  const fetchPendingCollaborationThreadsCount = async () => {
    const threads = await actions.getThreads({
      pageSize: 1,
      myPendingCollaborations: true,
      appId,
    })
    threads?.totalCount &&
      setPendingCollaborationThreadsCount(threads.totalCount)
  }

  const currentSearchStatus = searchParams.get("collaborationStatus")

  const setCollaborationStatus = (
    newStatus: "pending" | "active" | undefined | null,
  ) => {
    if (!newStatus && currentSearchStatus) {
      removeParams("collaborationStatus")
    }
    if (newStatus === collaborationStatus) {
      return
    }
    setCollaborationStatusInternal(newStatus)

    fetchActiveCollaborationThreadsCount()
    fetchPendingCollaborationThreadsCount()
  }

  const [collaborationStep, setCollaborationStep] = useState(0)

  useEffect(() => {
    if (burn) {
      setWasIncognito(true)
      // addParams({ burn: "true" })
    } else {
      setWasIncognito(false)
      // removeParams("burn")
    }
  }, [burn])

  const [wasIncognito, setWasIncognito] = useState(burn)

  const loadingAppRef = useRef<sushi | undefined>(undefined)

  useEffect(() => {
    const a = storeApps.find((app) => app.id === loadingAppRef?.current?.id)
    if (hasStoreApps(a) && a) {
      loadingAppRef.current = undefined

      router.push(getAppSlug(a))
    }
  }, [loadingApp, storeApps])

  const setIsNewAppChat = ({
    item,
    tribe,
  }: {
    item: sushi | undefined
    tribe?: boolean
  }) => {
    if (!item) {
      return
    }

    if (!hasStoreApps(item)) {
      loadingAppRef.current = item
      setLoadingApp(item)
      return
    }

    setIsNewChat({ value: true, to: getAppSlug(item), tribe })
  }

  useEffect(() => {
    if (!threadIdRef.current) {
      setMessages([])
    }
  }, [threadIdRef.current])

  const setIsNewChat = ({
    value,
    to = app?.slug ? getAppSlug(app) : "/",
    tribe,
    pear,
    postId,
  }: {
    value: boolean
    to?: string
    tribe?: boolean
    pear?: boolean
    postId?: string
  }) => {
    if (value) {
      shouldStopAutoScrollRef.current = true
      setPostId(undefined)

      setLikedInternal(undefined)
      setShowFocus(false)
      setShowWatermelon(false)

      setCollaborationStep(0)
      setThread(undefined)
      setStatus(null)
      burn && setWasIncognito(true)
      setShowTribe(tribe === true)

      setCollaborationStatus(null)
      setIsChatFloating(false)
      setThreadId(undefined)
      setMessages([])
      threadIdRef.current = undefined
      if (postId) {
        router.push(`/p/${postId}`)
      } else {
        router.push(to)
      }
    } else {
      shouldStopAutoScrollRef.current = false
      // Ensure tribe view resets when closing a new chat
      setShowTribe(false)
    }

    setIsNewChatInternal(value)
  }

  const fetchThreads = async () => {
    setShouldFetchThreads(true)
    await refetchThreads()
  }

  useEffect(() => {
    if (app) {
      fetchThreads()
    }
  }, [app])

  const userOrGuest = user || guest

  const { isSmallDevice, isDrawerOpen, playNotification } = useTheme()

  const [shouldGetCredits, setShouldGetCredits] = useState(false)

  const [instruction, setInstruction] = useState<string | undefined>(undefined)

  const [artifacts, setArtifacts] = useState<File[]>([])

  const [shouldMutate, setShouldMutate] = useState(false)

  const isStreaming = messages.some((message) => message?.message?.isStreaming)
  const isStreamingStop = messages.some(
    (message) => message?.message?.isStreamingStop,
  )
  useEffect(() => {
    if (isStreaming) {
      return
    }

    if (shouldMutate) {
      mutate()
      setShouldMutate(false)
    }
  }, [shouldMutate, isStreaming])

  const { notifyPresence, connected } = useWebSocket<{
    type: string
    data: {
      placeholders?: {
        home: placeHolder
        thread: placeHolder
        app?: app
      }
      message?: {
        message: message
        user?: user
        guest?: guest
        aiAgent?: aiAgent
      }
      collaboration?: collaboration
    }
  }>({
    token,
    deviceId,
    deps: [userOrGuest, token, deviceId],
    onMessage: async ({ type, data }) => {
      if (type === "suggestions_generated") {
        if (user) {
          const updatedUser = await actions.getUser()
          setUser(updatedUser)
          updatedUser && setInstructions(updatedUser.instructions)
        }
        if (guest) {
          const updatedGuest = await actions.getGuest()
          setGuest(updatedGuest)
          updatedGuest && setInstructions(updatedGuest.instructions)
        }
        setShouldMutate(true)
      }
      if (
        type === "notification" &&
        data?.message?.message?.threadId !== threadId
      ) {
        playNotification()

        const title = `${
          data?.message?.message.content?.slice(0, 100) ||
          "You have a new message"
        } - Vex`

        if (isExtension) {
          // Extension notification using chrome.notifications
          if (typeof chrome !== "undefined" && chrome.notifications) {
            chrome.notifications.getPermissionLevel((level) => {
              if (level === "granted") {
                chrome.notifications.create({
                  type: "basic",
                  iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
                  title,
                  message: title,
                  contextMessage: "Vex",
                  buttons: [{ title: "View" }],
                })
              } else {
                console.log(
                  "Extension notification permission not granted:",
                  level,
                )
              }
            })
          }
        }
        if (
          data?.collaboration?.status === "active" ||
          data?.collaboration?.status === "pending"
        ) {
          setCollaborationStatus(data.collaboration.status)
        }
      }
    },
  })

  useEffect(() => {
    const hasNotifications = !!threads?.threads?.some((thread: thread) =>
      hasThreadNotification({ thread }),
    )
    hasNotifications && setHasNotification(hasNotifications)
  }, [threads])

  const [isVisitor, setIsVisitor] = useState(false)

  useEffect(() => {
    toFetch && setIsNewChat({ value: false })
  }, [toFetch])

  useEffect(() => {
    if (!profile) return
    if (!user && !guest) return
    if (profile && user) {
      setIsVisitor(user?.id !== profile.id)
      return
    } else if (userNameByUrl && user) {
      setIsVisitor(user?.userName !== userNameByUrl)
      return
    }

    if (thread) {
      setIsVisitor(
        !isOwner(thread, {
          userId: user?.id,
          guestId: guest?.id,
        }),
      )
      return
    }

    setIsVisitor(false)
  }, [profile, guest, user, userNameByUrl, thread, isNewChat])

  useEffect(() => {
    if (!token || !fingerprint || !connected) return

    const heartbeatInterval = setInterval(() => {
      if (!connected) return
      notifyPresence?.({
        isOnline: navigator.onLine,
        threadId: threadId,
      })
    }, 30000) // 30 seconds

    return () => clearInterval(heartbeatInterval)
  }, [token, fingerprint, notifyPresence, threadId, connected])

  useEffect(() => {
    if (!token || !fingerprint || !connected) return
    // Listen for navigation messages from service worker
    const _handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NAVIGATE_TO_URL") {
        window.location.href = event.data.url
      }
    }

    const handleNetworkChange = () => {
      notifyPresence?.({
        isOnline: navigator.onLine,
        threadId: threadId,
      })
    }
    const handleVisibilityChange = () => {
      notifyPresence?.({
        isOnline: document.visibilityState === "visible",
        threadId: threadId,
      })
    }
    const handleBeforeUnload = () => {
      notifyPresence?.({
        isOnline: false,
        threadId: threadId,
      })
    }

    if (user || guest) {
      // Initial online notification
      notifyPresence?.({
        isOnline: true,
        threadId: threadId,
      })

      // Platform-safe event listeners
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleVisibilityChange)
        document.addEventListener("pagehide", handleBeforeUnload)
      }

      if (typeof window !== "undefined" && window.addEventListener) {
        window.addEventListener("pageshow", () =>
          notifyPresence?.({ isOnline: true }),
        )

        window.addEventListener("offline", handleNetworkChange)

        // Add unload listener
        window.addEventListener("beforeunload", handleBeforeUnload)
        window.addEventListener("online", handleNetworkChange)
      }

      return () => {
        // Cleanup
        if (typeof window !== "undefined" && window.removeEventListener) {
          window.removeEventListener("offline", handleNetworkChange)
          window.removeEventListener("online", handleNetworkChange)
          window.removeEventListener("beforeunload", handleBeforeUnload)
        }
        if (typeof document !== "undefined" && document.removeEventListener) {
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
          )
        }
        notifyPresence?.({
          isOnline: false,
          threadId: thread?.id,
        })
      }
    }
  }, [user, guest, threadId, connected])

  // Credits tracking

  const creditsLeft = auth.creditsLeft

  const setCreditsLeft = (creditsLeft?: number) => {
    auth.setCreditsLeft(creditsLeft)
  }

  // Track consecutive Pear messages that earned 0 credits → auto-disable after 3
  const pearNoGainStreakRef = React.useRef(0)

  const onlyAgent = !!app?.onlyAgent

  const [debateAgent, setDebateAgentInternal] = useState<
    aiAgent | undefined | null
  >(undefined)

  useEffect(() => {
    if (debateAgent) {
      plausible({
        name: ANALYTICS_EVENTS.DEBATE_AGENT_SELECTED,
        props: { agent: debateAgent.displayName },
      })
    }
  }, [debateAgent])

  const isAgentAuthorized = (agent: aiAgent | undefined | null) => {
    if (!agent) return false
    if (user?.subscription || guest?.subscription) {
      return true
    }
    return user
      ? !["subscriber"].includes(agent.authorization)
      : ["guest", "all"].includes(agent.authorization)
  }

  const ph = thread?.placeHolder || app?.placeHolder

  const [placeHolder, setPlaceHolder] = useState<placeHolder | undefined>(
    ph || undefined,
  )

  useEffect(() => {
    setPlaceHolder(ph || undefined)
  }, [thread, app])

  const [placeHolderText, setPlaceHolderText] = React.useState<
    string | undefined
  >(placeHolder?.text)

  const [shouldFocus, setShouldFocus] = useState(false)

  useEffect(() => {
    if (placeHolder?.text) {
      setPlaceHolderText(placeHolder.text)
    } else if (app?.placeholder) {
      setPlaceHolderText(app?.placeholder)
    }
  }, [placeHolder, app])

  const { appStatus, setAppStatus } = useApp()

  const { captureException } = useError()

  const [shouldFetchThread, setShouldFetchThread] = useState(!auth.threadData)

  useEffect(() => {
    if (threadId && !shouldFetchThread) {
      setShouldFetchThread(true)
    }
  }, [threadId, shouldFetchThread])

  const [until, setUntil] = useState<number>(1)
  const [liked, setLikedInternal] = useState<boolean | undefined>(undefined)

  const setLiked = (liked: boolean | undefined) => {
    setLikedInternal(liked)
    plausible({
      name: ANALYTICS_EVENTS.THREAD_LIKES,
      props: { liked },
    })
  }

  const [isLoading, setIsLoading] = useState(!!threadId)

  const [status, setStatus] = useState<number | null>(null)

  const {
    data: threadSWR,
    mutate,
    error: threadError,
    isLoading: isLoadingThread,
  } = useSWR(
    shouldFetchThread && token && toFetch
      ? ["thread", toFetch, liked, until]
      : null,
    async () => {
      if (!toFetch) return

      const threadData = await actions.getThread({
        id: toFetch,
        pageSize: until * pageSizes.threads,
        liked: !!liked,
        onError: (error: number) => {
          setIsLoading(false)
          setStatus(error)
        },
      })

      setIsLoading(false)
      return threadData
    },
    {
      // revalidateOnMount: true,
    },
  )

  useEffect(() => {
    threadId && setIsLoading(isLoadingThread)
  }, [isLoadingThread, threadId])

  const isBYOK = Boolean(
    user?.apiKeys?.openrouter || guest?.apiKeys?.openrouter,
  )

  const needsReplicateInternal =
    isBYOK &&
    Boolean(user ? !user?.apiKeys?.replicate : !guest?.apiKeys?.replicate)

  const needsFalInternal =
    isBYOK && Boolean(user ? !user?.apiKeys?.fal : !guest?.apiKeys?.fal)

  const [agentName, setAgentName] = useState(session?.aiAgent?.name || "")

  const [isWebSearchEnabled, setIsWebSearchEnabledInternal] = useState<boolean>(
    agentName === "perplexity",
  )

  const [isImageGenerationEnabled, setIsImageGenerationEnabledInternal] =
    useState(false)

  const isImageGenerationEnabledRef = useRef<boolean>(isImageGenerationEnabled)

  const [needsReplicate, setNeedsReplicate] = useState<boolean>(false)

  const [needsFal, setNeedsFal] = useState<boolean>(false)

  const setIsImageGenerationEnabled = (
    value: boolean,
    forAgent?: aiAgent | null,
  ) => {
    if (value) {
      if (needsReplicateInternal) {
        setNeedsReplicate(true)
        return
      }
    }

    needsReplicate && setNeedsReplicate(false)
    isImageGenerationEnabledRef.current = value
    setIsImageGenerationEnabledInternal(value)
    setSelectedAgentInternal(forAgent || sushiAgent)
    value && setDebateAgent(null)
  }

  const setSelectedAgent = (agent: aiAgent | undefined | null) => {
    !agent?.capabilities?.webSearch &&
      isWebSearchEnabled &&
      setIsWebSearchEnabledInternal(false)

    agent?.name === "perplexity" && setIsWebSearchEnabledInternal(true)
    agent?.name === "flux" && setIsImageGenerationEnabledInternal(true)

    !agent?.capabilities?.imageGeneration &&
      isImageGenerationEnabled &&
      setIsImageGenerationEnabledInternal(false)

    if (selectedAgent?.name === agent?.name) return
    if (agent === null) {
      setAgentName("")
      setSelectedAgentInternal(undefined)
      setDebateAgent(null)
      return
    }

    setSelectedAgentInternal(agent)
    setAgentName(agent?.name || "")
    isImageGenerationEnabledRef.current &&
      setIsImageGenerationEnabledInternal(
        agent?.capabilities?.imageGeneration || false,
      )
  }

  const defaultAgent = aiAgents.find(
    (a) => app?.defaultModel && a.name === app?.defaultModel,
  )
  const selectedAgent = auth.selectedAgent
  const setSelectedAgentInternal = (agent?: aiAgent | null) => {
    if (auth.selectedAgent === undefined) return
    auth.setSelectedAgent(agent)
  }

  useEffect(() => {
    defaultAgent &&
      (!selectedAgent || isEmpty) &&
      setSelectedAgent(defaultAgent)
  }, [defaultAgent, isEmpty])

  const setIsWebSearchEnabled = (value: boolean) => {
    if (value) {
      app?.defaultModel === "perplexity" &&
      app?.onlyAgent &&
      selectedAgent?.name !== "perplexity"
        ? setSelectedAgent(perplexityAgent)
        : selectedAgent?.name !== "sushi" &&
          !selectedAgent?.capabilities?.webSearch &&
          setSelectedAgent(sushiAgent)
    }

    setIsWebSearchEnabledInternal(value)
  }

  const setDebateAgent = (agent: aiAgent | undefined | null) => {
    setDebateAgentInternal(agent)
  }

  useEffect(() => {
    if (!user && !guest) return
    if (aiAgents?.length) {
      if (selectedAgent === null) return

      if (selectedAgent) {
        const currentAgent = aiAgents.find(
          (agent) => agent.name === selectedAgent.name,
        )
        setSelectedAgent(currentAgent)

        return
      }

      setSelectedAgent(undefined)
    }
  }, [aiAgents, selectedAgent, user, guest])

  const [isAgentModalOpen, setIsAgentModalOpenInternal] = useState(false)

  const [isDebateAgentModalOpen, setIsDebateAgentModalOpenInternal] =
    useState(false)

  const setIsAgentModalOpen = (open: boolean) => {
    setIsAgentModalOpenInternal(open)
    if (!open) {
      setIsDebateAgentModalOpenInternal(false)
    }
    open &&
      plausible({
        name: ANALYTICS_EVENTS.AGENT_MODAL,
        props: {},
      })
  }

  const setIsDebateAgentModalOpen = (open: boolean) => {
    setIsDebateAgentModalOpenInternal(open)
    setIsAgentModalOpenInternal(open)
    open &&
      plausible({
        name: ANALYTICS_EVENTS.DEBATE_AGENT_MODAL,
        props: {},
      })
  }

  useEffect(() => {
    const a = aiAgents.find(
      (agent) =>
        app?.defaultModel &&
        app.onlyAgent &&
        agent.name.toLowerCase() === app?.defaultModel?.toLowerCase(),
    )
    if (!a) return

    setSelectedAgent(a)
    setDebateAgent(null)
  }, [app, aiAgents])

  const isDebating = !!debateAgent

  const hitHourlyLimit = hourlyUsageLeft <= 0

  // Auto-refresh hourly limits when timer expires
  useEffect(() => {
    if (!hitHourlyLimit) return

    const lastMessage = user?.lastMessage || guest?.lastMessage
    if (!lastMessage?.createdOn) return

    const lastMessageTime = new Date(lastMessage.createdOn)
    const oneHourLater = new Date(lastMessageTime.getTime() + 60 * 60 * 1000)
    const now = new Date()

    if (now >= oneHourLater) {
      // Hour has already passed, reset immediately
      if (user) {
        setUser({ ...user, messagesLastHour: 0 })
      }
      if (guest) {
        setGuest({ ...guest, messagesLastHour: 0 })
      }
      return
    }

    // Set timer for when hour expires
    const timeUntilReset = oneHourLater.getTime() - now.getTime()
    const timer = setTimeout(() => {
      if (user) {
        setUser({ ...user, messagesLastHour: 0 })
      }
      if (guest) {
        setGuest({ ...guest, messagesLastHour: 0 })
      }
    }, timeUntilReset)

    return () => clearTimeout(timer)
  }, [
    hitHourlyLimit,
    user?.lastMessage?.createdOn,
    guest?.lastMessage?.createdOn,
  ])

  const [nextPage, setNextPage] = useState<number | undefined>(undefined)

  const threadData = threadSWR || auth.threadData || undefined

  const shouldStopAutoScrollRef = useRef(false)

  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const { isUserScrolling, hasStoppedScrolling } = useUserScroll()

  const toFetchRef = useRef<boolean | null>(null)

  const scrollToBottom = (
    timeout = isTauri ? 0 : 500,
    force = false,
    element?: HTMLElement | null,
  ) => {
    if (showFocus) setShowFocus(false)

    if (!threadId && !force) return
    if (postId && !force) return
    // Also check window.location directly as fallback if showTribe state is stale
    const isTribeUrl =
      typeof window !== "undefined" &&
      window.location.search.includes("tribe=true")
    if ((showTribe || isTribeUrl) && !force) return
    if ((isEmpty || isUserScrolling || hasStoppedScrolling) && !force) return
    setTimeout(() => {
      // Use requestAnimationFrame for more stable scrolling in Tauri
      requestAnimationFrame(() => {
        // In Tauri, use instant scroll instead of smooth to prevent hopping
        const behavior = isTauri ? "instant" : "smooth"
        const target = element || window
        const top = element ? element.scrollHeight : document.body.scrollHeight

        target.scrollTo({
          top,
          behavior: behavior as ScrollBehavior,
        })
        toFetchRef.current = null
      })
    }, timeout)
  }

  useEffect(() => {
    !toFetchRef.current && (toFetchRef.current = !!toFetch)
  }, [toFetch])

  const scrollToTop = (timeout = 0) => {
    setTimeout(() => {
      // Use requestAnimationFrame for more stable scrolling in Tauri
      requestAnimationFrame(() => {
        // In Tauri, use instant scroll instead of smooth to prevent hopping
        const behavior = isTauri ? "instant" : "smooth"
        window.scrollTo({
          top: 0,
          behavior: behavior as ScrollBehavior,
        })
      })
    }, timeout)
  }

  useEffect(() => {
    threadError && setIsLoading(false)
  }, [threadError])

  useEffect(() => {
    if (toFetch) {
      setShowFocus(false)
      return
    }
    if (showFocus || !toFetch) {
      setThread(undefined)
      setMessages([])
    }
  }, [showFocus, toFetch])

  useEffect(() => {
    if (typeof threadData?.thread?.creditsLeft === "number") {
      setCreditsLeft(threadData?.thread?.creditsLeft)
    }
    if (!toFetch) {
      status && setStatus(null)
      // setMessages([])
      return
    }

    const serverMessages = threadData?.messages as paginatedMessages

    if (
      threadData?.thread &&
      Array.isArray(serverMessages.messages) &&
      !isDebating &&
      !isStreaming &&
      !isStreamingStop
    ) {
      const serverThreadId = threadData.thread.id
      const currentMessagesThreadId = messages[0]?.thread?.id
      const threadChanged =
        currentMessagesThreadId && serverThreadId !== currentMessagesThreadId

      if (threadChanged) {
        // Thread switched - clear old messages immediately
        setMessages(serverMessages.messages)
        setNextPage(threadData.messages.nextPage)
        setThread(threadData.thread)
        return
      }

      // setMessages(serverMessages.messages)

      if (!messages.length && serverMessages.messages.length) {
        setMessages(serverMessages.messages)
      } else if (!isDebating && !isStreaming && !isStreamingStop) {
        // ID-based diff: only update if server has new messages we don't have
        // This prevents wiping optimistic messages while server is catching up
        const localIds = new Set(messages.map((m) => m.message?.id))
        const serverIds = new Set(
          serverMessages.messages.map((m) => m.message?.id),
        )
        const hasNewServerMessages = serverMessages.messages.some(
          (m) => !localIds.has(m.message?.id),
        )
        const localHasOptimistic = messages.some(
          (m) => !serverIds.has(m.message?.id),
        )

        const threadSwitched =
          !threadIdRef.current ||
          serverMessages.messages[0]?.thread?.id !== threadIdRef.current

        if (threadSwitched) {
          // Thread switched - clear old messages immediately
          setMessages(serverMessages.messages)
        } else if (hasNewServerMessages && !localHasOptimistic) {
          // Server has new confirmed messages and no pending optimistics — safe to replace
          setMessages(serverMessages.messages)
        } else if (hasNewServerMessages && localHasOptimistic) {
          // Merge: keep optimistic messages + add new server messages
          const merged = [
            ...serverMessages.messages,
            ...messages.filter((m) => !serverIds.has(m.message?.id)),
          ]
          setMessages(merged)
        } else if (!localHasOptimistic) {
          // No new server msgs, no optimistic — replace (thread switch, edits, deletions)
          setMessages(serverMessages.messages)
        }
      }

      setNextPage(threadData.messages.nextPage)
      setThread(threadData.thread)

      isNewChat && setStatus(null)

      !isNewChat &&
        threadData?.thread?.user &&
        threadData.thread.user.id !== user?.id &&
        setProfile(threadData.thread.user)

      collaborationStatus !== "pending" &&
        !shouldStopAutoScrollRef.current &&
        !isLoadingMore &&
        !(isSmallDevice && isDrawerOpen) &&
        !isChatFloating &&
        scrollToBottom(100)

      // return () => {
      //   setThread(undefined)
      //   setMessages([])
      // }
    }
  }, [
    threadData,
    isLoadingMore,
    aiAgents,
    isStreaming,
    isStreamingStop,
    user,
    setSelectedAgent,
    isNewChat,
    liked,
    shouldStopAutoScrollRef,
    collaborationStatus,
    isSmallDevice,
    isDrawerOpen,
    isChatFloating,
    threadId,
    threadIdRef,
    messages,
  ])

  return (
    <ChatContext.Provider
      value={{
        fetchActiveCollaborationThreadsCount,
        fetchPendingCollaborationThreadsCount,
        setIsNewAppChat,
        shouldFocus,
        setShouldFocus,
        placeHolderText,
        setPlaceHolderText,
        isImageGenerationEnabled,
        setIsImageGenerationEnabled,
        status,
        isLoadingMore,
        setIsLoadingMore,
        isLoading,
        shouldFetchThread,
        scrollToTop,
        setShouldFetchThread,
        refetchThread: async () => {
          setShouldFetchThread(true)
          await mutate()
        },
        setIsWebSearchEnabled,
        input,
        setIsAgentModalOpen,
        isAgentModalOpen,
        creditsLeft,
        aiAgents,
        setInput,
        placeHolder,
        setPlaceHolder,
        isChatFloating,
        setIsChatFloating,
        thread,
        setThread,
        threadId,
        until,
        liked,
        setLiked,
        error: threadError,
        setUntil,
        onlyAgent,
        isEmpty,
        scrollToBottom,
        isWebSearchEnabled,
        selectedAgent,
        setSelectedAgent: (agent: aiAgent | undefined | null) => {
          setSelectedAgent(agent)
          setUserSelectedAgent(agent)
        },
        userSelectedAgent,
        hitHourlyLimit,
        debateAgent,
        setDebateAgent,
        isDebating,
        hourlyLimit,
        hourlyUsageLeft,
        setCreditsLeft,
        claudeAgent,
        favouriteAgent,
        messages,
        setMessages,
        isAgentAuthorized,
        setIsDebateAgentModalOpen,
        isDebateAgentModalOpen,
        setIsAgentModalOpenInternal,
        nextPage,
        setNextPage,
        setIsNewChat,
        isNewChat,
        hasNotification,
        needsReplicate,
        setNeedsReplicate,
        needsFal,
        setNeedsFal,
        isLoadingThreads,
        setIsLoadingThreads,
        threads,
        setThreads,
        wasIncognito,
        setWasIncognito,
        burn,
        instruction,
        setInstruction,
        pendingCollaborationThreadsCount,
        activeCollaborationThreadsCount,
        setCollaborationStatus,
        collaborationStatus,
        collaborationStep,
        setCollaborationStep,
        isVisitor,
        setIsVisitor,
        refetchThreads: fetchThreads,
        userNameByUrl,
        shouldGetCredits,
        setShouldGetCredits,
        showTribe,
        setShowTribe,
        artifacts,
        setArtifacts,
        setAsk,
        threadsAppId,
        setThreadsAppId,
        hasPearApp,
        setHasPearApp,
        setAbout,
        isDNA,
        setIsDNA,
        isTribe,
        setIsTribe,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within ChatProvider")
  }
  return context
}

"use client"

import clsx from "clsx"
import nProgress from "nprogress"
import React, {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import toast from "react-hot-toast"
import sanitizeHtml from "sanitize-html"
import useSWR from "swr"
import { v4 as uuidv4, validate } from "uuid"
import App from "./App"
import AppLink from "./AppLink"
import A from "./a/A"
import { useChatStyles } from "./Chat.styles"
import { COLORS, useAppContext } from "./context/AppContext"
import {
  useApp,
  useAuth,
  useChat,
  useError,
  useNavigationContext,
} from "./context/providers"
import { useStyles } from "./context/StylesContext"
import DeleteThread from "./DeleteThread"
import { FalkorDBSetupModal } from "./FalkorDBSetupModal"
import Grapes from "./Grapes"
import {
  useCountdown,
  useHasHydrated,
  useLocalStorage,
  useSyncedState,
} from "./hooks"
import { useWebSocket } from "./hooks/useWebSocket"
import Img from "./Image"
import {
  ArrowRight,
  AudioLines,
  ChevronDown,
  CircleArrowDown,
  CircleArrowUp,
  CircleCheck,
  CircleStop,
  CircleX,
  Claude,
  Clock,
  ClockPlus,
  Coins,
  DeepSeek,
  FileIcon,
  FileText,
  Flux,
  Gemini,
  Globe,
  GlobeLock,
  Grok,
  HardDrive,
  ImageIcon,
  Info,
  Link,
  LogIn,
  Megaphone,
  Music,
  OpenAI,
  OpenRouter,
  Palette,
  Perplexity,
  Plus,
  Sparkles,
  Star,
  TextIcon,
  Timer,
  VideoIcon,
} from "./icons"
import Loading from "./Loading"
import Logo from "./Logo"
import { buildAiRequestBody, handleAiResponse } from "./lib"
import { checkSpeechLimits, SPEECH_LIMITS } from "./lib/speechLimits"
import { stripMarkdown } from "./lib/stripMarkdown"
import Modal from "./Modal"
import MoodSelector from "./MoodSelector"
import {
  Button,
  Div,
  Form,
  H2,
  Input,
  Label,
  P,
  Span,
  Strong,
  TextArea,
  usePlatform,
  useTheme,
  Video,
} from "./platform"
import { WatermelonButton } from "./Skeleton"
import {
  type aiAgent,
  type collaboration,
  emojiMap,
  type guest,
  type message,
  type thread,
  type user,
} from "./types"
import {
  apiFetch,
  BrowserInstance,
  capitalizeFirstLetter,
  isOwner,
} from "./utils"
import { ANALYTICS_EVENTS } from "./utils/analyticsEvents"
import { formatFileSize, validateFile } from "./utils/fileValidation"

export default function Machine({
  className,
  onToggleGame,
  onMessage,
  onStreamingUpdate,
  showGreeting,
  onStreamingComplete,
  showSuggestions,
  disabled,
  text,
  thread,
  onStreamingStop,
  Top,
  placeholder: placeHolderInternal,
  compactMode,
  onTyping,
  style,
  requiresSignin,
  chatKey,
  dataTestId,
  hipchat = true,
  hipChatId,
}: {
  requiresSignin?: boolean
  compactMode?: boolean
  placeholder?: string
  Top?: React.ReactNode
  dataTestId?: string
  showSuggestions?: boolean
  showGreeting?: boolean
  className?: string
  hipchat?: boolean
  chatKey?: string
  hipChatId?: string
  onToggleGame?: (on: boolean) => void
  disabled?: boolean
  onMessage?: (message: {
    content: string
    isUser: boolean
    isStreaming?: boolean
    message?: {
      message: message
      user?: user
      guest?: guest
      aiAgent?: aiAgent
      thread?: thread
    }
    hipChatId?: string
    webSearchResults?: any[]
    isImageGenerationEnabled?: boolean
    isWebSearchEnabled?: boolean
  }) => void
  onStreamingUpdate?: ({
    content,
    clientId,
    aiAgent,
    isWebSearchEnabled,
    isImageGenerationEnabled,
    hipchat,
  }: {
    content: string
    clientId?: string
    aiAgent?: aiAgent
    isWebSearchEnabled?: boolean
    isImageGenerationEnabled?: boolean
    hipchat?: boolean
  }) => void
  style?: React.CSSProperties
  onStreamingStop?: (message?: {
    message: message
    user?: user
    guest?: guest
    aiAgent?: aiAgent
    thread?: thread
  }) => void
  onStreamingComplete?: (message?: {
    message: message
    user?: user
    guest?: guest
    aiAgent?: aiAgent
    thread?: thread & {
      likeCount: number
      collaborations?: {
        collaboration: collaboration
        user: user
      }[]
    }
    hipchat?: boolean
  }) => void
  text?: string
  thread?: thread
  onTyping?: (isTyping: boolean) => void
}): React.ReactElement {
  const { t, console } = useAppContext()

  const styles = useChatStyles()

  const { utilities } = useStyles()

  const {
    user,
    token,
    fingerprint,
    language,
    setUser,
    setGuest,
    guest,
    plausible,
    deviceId,
    API_URL,
    FRONTEND_URL,
    chrry,
    app,
    sushiAgent,
    mood,
    updateMood,
    taskId,
    fetchTasks,
    canBurn,
    weather,
    actions,
    isProgramme,
    burn,
    isPear,
    wasPear,
    setPear,
    isIDE,
    accountApps,
    isRetro,
    setIsRetro,
    dailyQuestionData,
    advanceDailySection,
    setDailyQuestionIndex,
    dailyQuestionIndex,
    back,
    lastApp,
    getAppSlug,
    ask,
    about,
    setShowGrapes,
    grapes,
    postToTribe,
    setPostToTribe: setPostToTribeInternal,
    postToMoltbook,
    setPostToMoltbook: setPostToMoltbookInternal,
    moltPlaceHolder,
    canShowTribe,
    showFocus,
    postId,
    burnApp,
    rtl,
    isDevelopment,
    MAX_FILE_LIMITS,
    MAX_FILE_SIZES,
    isHippoOpen,
    OWNER_CREDITS,
    PROMPT_LIMITS,
    isE2E,
    modelId,
    peachAgent,
    earnBadge,
    setEarnBadge,
    ...auth
  } = useAuth()

  const MAX_FILES = MAX_FILE_LIMITS.chat

  const lastTribe = user?.lastTribe
  const lastMolt = user?.lastMolt
  const now = new Date()

  const cooldownMinutes = user?.role === "admin" ? 0 : 30
  const cooldownMs = cooldownMinutes * 60 * 1000

  const setPostToTribe = (value: boolean) => {
    if (value && lastTribe?.createdOn) {
      const timeSinceLastPost =
        now.getTime() - new Date(lastTribe.createdOn).getTime()
      const remainingCooldown = cooldownMs - timeSinceLastPost

      // Cooldown still active
      if (remainingCooldown > 0) {
        const remainingMinutes = Math.ceil(remainingCooldown / (60 * 1000))
        toast.error(
          `Please wait ${remainingMinutes} more minute${remainingMinutes > 1 ? "s" : ""} before posting to tribe again`,
        )
        return // Don't set the value, just return
      }
    }
    setPostToTribeInternal(value)
  }

  const setPostToMoltbook = (value: boolean) => {
    if (value && lastMolt?.createdOn) {
      const timeSinceLastPost =
        now.getTime() - new Date(lastMolt.createdOn).getTime()
      const remainingCooldown = cooldownMs - timeSinceLastPost

      if (remainingCooldown > 0) {
        const remainingMinutes = Math.ceil(remainingCooldown / (60 * 1000))
        toast.error(
          `Please wait ${remainingMinutes} more minute${remainingMinutes > 1 ? "s" : ""} before posting to Moltbook again`,
        )
        return
      }
    }
    setPostToMoltbookInternal(value)
  }

  const threadId = auth.threadId || auth.threadIdRef.current

  const [isSelectingMood, setIsSelectingMood] = useState(false)

  const {
    aiAgents,
    selectedAgent,
    setSelectedAgent: setSelectedAgentInternal,
    debateAgent,
    setDebateAgent,
    isDebating,
    setIsChatFloating,
    setIsWebSearchEnabled: setWebSearchEnabledInternal,
    isWebSearchEnabled,
    setInput: setInputInternal,
    input,
    creditsLeft,
    setShouldGetCredits,
    hourlyUsageLeft,
    hitHourlyLimit,
    hourlyLimit,
    isEmpty: empty,
    isAgentModalOpen,
    setIsAgentModalOpen,
    isDebateAgentModalOpen,
    setIsDebateAgentModalOpen,
    setIsAgentModalOpenInternal,
    isImageGenerationEnabled,
    setIsImageGenerationEnabled,
    setShouldFocus,
    shouldFocus,
    isChatFloating: isChatFloatingContext,
    isNewChat,
    setIsNewChat,
    onlyAgent,
    scrollToBottom,
    setNeedsReplicate,
    showTribe,
    needsReplicate,
    artifacts,
    setArtifacts,
    instruction,
    setInstruction,
    userSelectedAgent,
  } = useChat()

  const {
    router,
    isShowingCollaborate,
    collaborationStep,
    setCollaborationStep,
    addParams,
    pathname,
  } = useNavigationContext()

  const { slug, appStatus, minimize, setMinimize, isAppOwner } = useApp()

  const threadIdRef = useRef(threadId)

  useEffect(() => {
    // Only update threadIdRef when threadId is truthy to prevent clearing on transient auth gaps
    if (threadId) {
      threadIdRef.current = threadId
    }
  }, [threadId])

  const setThreadId = (id?: string) => {
    threadIdRef.current = id
  }

  useEffect(() => {
    if (isNewChat) {
      setThreadId(undefined)
      auth.setThreadId(undefined)
      setPostToMoltbook(false)
      setPostToTribe(false)
    }
  }, [isNewChat])

  // Sync input with daily question data when it changes
  useEffect(() => {
    if (isRetro && dailyQuestionData?.currentQuestion) {
      setInputInternal(dailyQuestionData.currentQuestion)
    }
  }, [isRetro, dailyQuestionData?.currentQuestion])

  const { captureException } = useError()

  const {
    device,
    os,
    isStandalone,
    isExtension,
    viewPortWidth,
    isWeb,
    isCapacitor,
  } = usePlatform()
  const inputRef = useRef(text || "")

  const {
    addHapticFeedback,
    playNotification,
    isSmallDevice,
    isMobileDevice,
    getRadius,
    ...theme
  } = useTheme()

  const isDrawerOpen = theme.isDrawerOpen && !hipchat

  const canShowLinks =
    !showTribe && canShowTribe && empty && app && !appStatus?.part

  const setSelectedAgent = (agent: aiAgent | undefined | null) => {
    setSelectedAgentInternal(agent)
    setShouldFocus(true)
    plausible({
      name: ANALYTICS_EVENTS.AGENT_SELECTED,
      props: {
        agentId: agent?.id,
        agentName: agent?.name,
        agentVersion: agent?.version,
      },
    })
  }

  useEffect(() => {
    if (shouldFocus) {
      chatInputRef.current?.focus()
      setShouldFocus(false)
    }
  }, [shouldFocus])

  const setIsWebSearchEnabled = (value: boolean) => {
    setWebSearchEnabledInternal(value)
    value && setShouldFocus(true)
  }

  // Scroll detection for auto-hide chat input
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showChatInput, setShowChatInput] = useState(true)
  const [, setWindowHeight] = useState(600)

  useEffect(() => {
    // Set actual window height on client
    if (typeof window !== "undefined") {
      setWindowHeight(window.innerHeight)
    }
  }, [])

  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current = input
  }, [input])

  // const currentIndexRef = useRef(0) // Moved to context

  useEffect(() => {
    if (isNewChat) {
      setShowChatInput(true)
    }
  }, [isNewChat])
  // Determine if we should use compact mode based on bottom offset
  const [hasBottomOffsetInternal, setHasBottomOffset] = useState(false)
  const hasBottomOffset = hasBottomOffsetInternal && !empty

  const shouldUseCompactMode = compactMode || hasBottomOffset

  const floatingInitial =
    shouldUseCompactMode || minimize || showTribe
      ? true
      : empty
        ? false
        : isChatFloatingContext && !showChatInput

  const [isChatFloatingInternal] = useSyncedState(floatingInitial, [
    empty,
    shouldUseCompactMode,
    isChatFloatingContext,
    showChatInput,
  ])

  const m = minimize && empty

  const isChatFloating =
    m || isIDE || (isChatFloatingInternal && shouldUseCompactMode)

  const [needsReview, setNeedsReviewInternal] = useState(false)
  const needsReviewRef = useRef(needsReview)
  const placeholder =
    burnApp?.placeholder && burn
      ? burnApp.placeholder
      : isImageGenerationEnabled
        ? `🎨 ${t("Describe the image you want to create")} ✨`
        : isSelectingMood
          ? `📊 ${t("Track your mood daily")} 🎭`
          : needsReview
            ? `🍒 ${t("By using this, you accept our privacy policy")} 🔒`
            : isPear && !showTribe
              ? `💬 ${t("Share feedback, earn 10-50 credits!")} 🍇`
              : !user && hourlyUsageLeft >= 5 && hourlyUsageLeft <= 7
                ? `⏰ ${hourlyUsageLeft} ${t("messages left! Discover more apps")} 🍇`
                : user && hourlyUsageLeft >= 24 && hourlyUsageLeft <= 26
                  ? `✨ ${t("Explore new apps while you chat")} 🍇`
                  : placeHolderInternal
  // useEffect(() => {
  //   setIsChatFloating(isChatFloating)
  // }, [isChatFloating])

  // Strip ACTION JSON sfrom streaming text
  const stripActionFromText = (text: string): string => {
    // Check if there's a complete ACTION JSON at the end
    const actionMatch = text.match(/ACTION:\s*(\{(?:[^{}]|\{[^}]*\})*\})\s*$/)
    if (actionMatch) {
      // Complete ACTION JSON found, strip it
      return text.replace(/ACTION:\s*\{(?:[^{}]|\{[^}]*\})*\}\s*$/, "").trim()
    }

    // Check if there's an incomplete ACTION at the end
    const incompleteActionMatch = text.match(/ACTION:\s*\{[^}]*$/)
    if (incompleteActionMatch) {
      // Incomplete ACTION found, strip everything from "ACTION:" onwards
      return text.replace(/ACTION:\s*\{[^}]*$/, "").trim()
    }

    // Check for just "ACTION:" at the end
    if (text.match(/ACTION:\s*$/)) {
      return text.replace(/ACTION:\s*$/, "").trim()
    }

    return text
  }

  const hasIncompleteAction = (streamedContent: string) =>
    streamedContent.includes("ACTION:") &&
    (streamedContent.match(/ACTION:\s*\{[^}]*$/) ||
      streamedContent.match(/ACTION:\s*$/))

  function stripActionText(streamedContent: string, chunk: string) {
    const isIncompleteAction = hasIncompleteAction(streamedContent)

    // If chunk starts with { and we might be receiving ACTION JSON, be more cautious
    const chunkStartsWithJson = chunk.trim().startsWith("{")
    const mightBeActionJson =
      streamedContent.includes("ACTION:") && chunkStartsWithJson

    // Update streaming content (strip ACTION JSON from display)
    let cleanStreamedContent = stripActionFromText(streamedContent)

    // If we detect we might be in the middle of ACTION JSON, show previous clean content
    if (isIncompleteAction || mightBeActionJson) {
      // Find the last complete sentence before ACTION
      const beforeAction = streamedContent.split("ACTION:")[0]?.trim() || ""
      cleanStreamedContent = beforeAction
    }
    return cleanStreamedContent
  }
  // Listen for extension messages (like page summary results)

  const [attempt, setAttempt] = useState<
    "webSearch" | "tasks" | "submit" | "debate" | undefined
  >(undefined)

  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [_retroAppIndex, _setRetroAppIndex] = useState(0)
  const controller = new AbortController()

  const [files, setFilesInternal] = useState<File[]>([])

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const setFiles: Dispatch<SetStateAction<File[]>> = (data) => {
    const f = typeof data === "function" ? data(files) : data

    if (!selectedAgent) {
      setFilesInternal(f)
      return
    }

    // Get agent-specific limits
    const agentLimits =
      MAX_FILE_SIZES[selectedAgent.name as keyof typeof MAX_FILE_SIZES] ||
      MAX_FILE_SIZES.sushi

    // Calculate maximum total size from agent's individual file limits
    const MAX_TOTAL_FILE_SIZE =
      Math.max(
        agentLimits.pdf,
        agentLimits.image,
        agentLimits.audio,
        agentLimits.video,
        agentLimits.text,
      ) * MAX_FILES // Multiply by max number of files allowed

    // Calculate individual file size limits (your existing logic)
    const maxIndividualFileSizes = f.reduce(
      (acc, file) => acc + getMaxFileSize(file.type),
      0,
    )

    // Calculate total file size
    const totalFileSize = f.reduce((acc, file) => acc + file.size, 0)

    // Check individual file size limits
    if (totalFileSize > maxIndividualFileSizes) {
      const maxIndividualSizeMB = (
        maxIndividualFileSizes /
        (1024 * 1024)
      ).toFixed(1)
      toast.error(`Maximum file size exceeds limit: ${maxIndividualSizeMB}MB`)
      return
    }

    // Check total file size limit
    if (totalFileSize > MAX_TOTAL_FILE_SIZE) {
      const maxTotalSizeMB = (MAX_TOTAL_FILE_SIZE / (1024 * 1024)).toFixed(1)
      const currentTotalSizeMB = (totalFileSize / (1024 * 1024)).toFixed(1)
      toast.error(
        `Total file size (${currentTotalSizeMB}MB) exceeds maximum limit of ${maxTotalSizeMB}MB`,
      )
      return
    }

    setFilesInternal(f)
  }
  const [isListening, setIsListeningInternal] = useState(false)
  const [isSpeaking, setIsSpeakingInternal] = useState(false)
  const limitCheck =
    user || guest
      ? user
        ? checkSpeechLimits({ user, textLength: 10 })
        : guest
          ? checkSpeechLimits({ guest, textLength: 10 })
          : { allowed: false }
      : { allowed: false }

  const setIsListening = (isListening: boolean) => {
    setIsListeningInternal(isListening)
    if (isListening) {
      setIsSpeakingInternal(false)
    }
  }

  const [playVideo, setPlayVideo] = useState(false)

  const setIsSpeaking = (isSpeaking: boolean) => {
    setIsSpeakingInternal(isSpeaking)
    if (isSpeaking) {
      setIsListeningInternal(false)
    }
  }

  const [isSpeechActive, setIsSpeechActive] = useState(false)

  const [recognition, setRecognition] = useState<any>(null)
  const [quotaInfo, setQuotaInfo] = useState<{
    hourly: { used: number; limit: number; resetTime: string }
    daily: { used: number; limit: number; resetTime: string }
    dailySize: { used: number; limit: number; resetTime: string }
    images?: { used: number; limit: number; resetTime: string }
  } | null>(null)
  const [showQuotaInfo, setShowQuotaInfoInternal] = useState(false)
  const [showFalkorModal, setShowFalkorModal] = useState(false)
  const setShowQuotaInfo = (show: boolean) => {
    setShowQuotaInfoInternal(show)
    show &&
      plausible({
        name: ANALYTICS_EVENTS.QUOTA_INFO,
        props: {
          show,
        },
      })
  }

  const replicateApiKeyInternal =
    user?.apiKeys?.replicate || guest?.apiKeys?.replicate || ""

  const [replicateApiKey, setReplicateApiKey] = useState(
    replicateApiKeyInternal,
  )

  const [isSavingReplicateApiKey, setIsSavingReplicateApiKey] = useState(false)
  const setInput = (value: string) => {
    inputRef.current = value

    setInputInternal(value)
  }

  useEffect(() => {
    inputRef.current = input
  }, [input])

  const [message, setMessageInternal] = useState<{
    message: message
    user?: user
    guest?: guest
    aiAgent?: aiAgent
    thread?: thread
  } | null>(null)

  const setMessage = (
    message: {
      message: message
      user?: user
      guest?: guest
      aiAgent?: aiAgent
      thread?: thread
    } | null,
  ) => {
    setMessageInternal(message)
    setClientId(message?.message?.clientId)
    message?.message?.threadId && setThreadId(message?.message?.threadId)
  }

  const isHydrated = useHasHydrated()

  const [isAttaching, setIsAttachingInternal] = useState(false)
  const [clientId, setClientId] = useState<string | undefined>()

  useEffect(() => {
    !clientId && setClientId(uuidv4())
  }, [clientId])

  // State for accumulating incomplete XML messages
  const xmlBufferRef = useRef<string>("")
  const filteredLogRef = useRef<string>("")

  // Filter out technical messages and only show meaningful updates
  const _filterStreamingMessage = (input: string | any): string | null => {
    // Handle workflow messages directly in the filter
    if (typeof input === "object" && input !== null) {
      const msg = input as any
      if (msg.type === "workflow" && msg.workflow) {
        const { workflow } = msg
        let progressMessage = ""

        if (workflow.name) {
          progressMessage += `🎯 ${workflow.name}\n`
        }
        if (workflow.thought) {
          progressMessage += `💭 ${workflow.thought}\n`
        }

        // Show agent tasks
        if (workflow.agents && workflow.agents.length > 0) {
          workflow.agents.forEach((agent: any, index: number) => {
            if (agent.task) {
              progressMessage += `📋 ${agent.name}: ${agent.task}\n`
            }
          })
        }

        return progressMessage.trim() || t("🤖 Planning workflow...")
      }

      if (msg.type === "text" && msg.text) {
        console.log("Text message received:", msg.text)

        // Handle XML content using DOMParser for proper parsing
        if (msg.text.includes("<root>") || xmlBufferRef.current) {
          // Accumulate XML content
          if (msg.text.includes("<root>") && !xmlBufferRef.current) {
            xmlBufferRef.current = msg.text
          } else if (xmlBufferRef.current) {
            xmlBufferRef.current += msg.text
          }

          // Check if we have complete XML
          if (xmlBufferRef.current.includes("</root>")) {
            try {
              const parser = new DOMParser()
              const doc = parser.parseFromString(
                xmlBufferRef.current,
                "text/xml",
              )

              // Check for parsing errors
              const errorNode = doc.querySelector("parsererror")
              if (errorNode) {
                console.warn("XML parsing error:", errorNode.textContent)
                // Fallback to text extraction using DOMParser
                const tempDiv = document.createElement("div")
                tempDiv.textContent = xmlBufferRef.current // Use textContent to safely extract text
                const textContent = tempDiv.textContent || ""
                xmlBufferRef.current = ""
                return textContent.replaceAll(/\s+/g, " ").trim()
              }

              // Extract text content from parsed XML (textContent is safe)
              const textContent = doc.documentElement.textContent || ""
              const cleanedContent = textContent.replaceAll(/\s+/g, " ").trim()

              xmlBufferRef.current = ""
              return cleanedContent
            } catch (e) {
              console.warn("XML parsing failed:", e)
              // Fallback to safe text extraction
              const tempDiv = document.createElement("div")
              tempDiv.textContent = xmlBufferRef.current
              const textContent = (tempDiv.textContent || "")
                .replaceAll(/\s+/g, " ")
                .trim()
              xmlBufferRef.current = ""
              return textContent
            }
          }

          // Don't stream partial XML
          return null
        }

        return _filterStreamingMessage(msg.text)
      }
      // If it's a log message object, extract the log string
      if (msg.type === "log" && msg.log) {
        return _filterStreamingMessage(msg.log)
      }

      return null
    }

    const log = input as string

    // Ensure log is a string
    if (typeof log !== "string") {
      return null
    }

    // Show planning indicator at start of workflow
    if (log.includes('"xml":') && log.includes("<root>")) {
      return t("🤖 Planning workflow...")
    }

    // Skip technical tool commands (JSON syntax) - but allow XML content
    if (log.includes('{"index":') || log.includes('{"url":')) {
      return null
    }

    // Skip repetitive character-by-character streaming patterns
    if (log.match(/^(.+?)\1{3,}/) || log.includes("II'll'll")) {
      // console.warn(
      //   "🚫 Skipping repetitive streaming pattern:",
      //   log.slice(0, 100),
      // )
      // return log.replace(/(.+?)\1{3,}/g, "$1")
    }

    // Remove the wait condition since we handle concatenation in the text handler above

    // Strip XML tags and show clean text content for any <root> message
    if (log.includes("<root>")) {
      try {
        // Parse XML and extract text content properly
        try {
          // Auto-close incomplete tags by adding missing closing tags
          let xmlContent = log

          // Find all opening tags that don't have closing tags
          const openTags = xmlContent.match(/<(\w+)[^>]*>/g) || []
          const closeTags = xmlContent.match(/<\/(\w+)>/g) || []

          const openTagNames = openTags
            .map((tag) => tag.match(/<(\w+)/)?.[1])
            .filter(Boolean)
          const closeTagNames = closeTags
            .map((tag) => tag.match(/<\/(\w+)>/)?.[1])
            .filter(Boolean)

          // Add missing closing tags
          const unclosedTags = openTagNames.filter(
            (tag) => !closeTagNames.includes(tag),
          )
          unclosedTags.reverse().forEach((tag) => {
            xmlContent += `</${tag}>`
          })

          // Create a temporary DOM element to parse XML and extract text
          const tempDiv = document.createElement("div")
          tempDiv.innerHTML = xmlContent
          const textContent = tempDiv.textContent || tempDiv.innerText || ""

          const cleanedContent = textContent
            .replace(/\n\s*\n/g, "\n") // Remove extra blank lines
            .replace(/^\s+|\s+$/g, "") // Trim whitespace
            .trim()

          if (cleanedContent.length > 20) {
            filteredLogRef.current = `✅ ${cleanedContent}`
            return filteredLogRef.current
          }
          return null
        } catch (_e) {
          // Fallback to safe text extraction using DOM
          const tempDiv = document.createElement("div")
          tempDiv.textContent = log // Use textContent to safely extract text without HTML
          const cleanedContent = (tempDiv.textContent || "")
            .replace(/\n\s*\n/g, "\n") // Remove extra blank lines
            .trim()

          if (cleanedContent.length > 20) {
            return `✅ ${cleanedContent}`
          }
          return null
        }
      } catch (_e) {
        return null
      }
    }

    // Skip raw XML workflow syntax (but we handle structured XML above)
    if (
      log.includes("<node>") ||
      log.includes("</node>") ||
      log.includes("<agent>") ||
      log.includes("<root>")
    ) {
      return null
    }

    // Skip tool execution details
    if (log.match(/^Browser > \w+/)) {
      return null
    }

    // Keep meaningful messages like:
    // - "Searching for askvex.com on Google"
    // - "Filling out form with information"
    // - "Collecting search results"
    // - "Plan\n<workflow content>" (but clean it up)

    if (log.startsWith("Plan\n")) {
      return t("🤖 Planning your task...")
    }

    // Keep other meaningful messages
    if (log.length > 10 && !log.includes("{") && !log.includes("<")) {
      return stripMarkdown(log)
    }

    return null
  }

  // Note: Base64 encoding increases size by ~33%, and DeepSeek has 28K token limit
  const getMaxFileSize = (fileType: string) => {
    if (!selectedAgent) return 0

    // Conservative limits based on agent capabilities and token limits
    const limits = MAX_FILE_SIZES

    const agentLimits =
      limits[selectedAgent.name as keyof typeof limits] || limits.deepSeek

    if (fileType.startsWith("image/")) return agentLimits.image
    if (fileType.startsWith("audio/")) return agentLimits.audio
    if (fileType.startsWith("video/")) return agentLimits.video
    if (fileType.startsWith("text/")) return agentLimits.text

    if (fileType.startsWith("application/pdf")) return agentLimits.pdf

    return agentLimits.text
  }
  const setIsAttaching = (attaching: boolean) => {
    if (attaching) {
      if (!isPrivacyApproved) {
        setNeedsReview(true)
        return
      }
    }

    setIsAttachingInternal(attaching)
    attaching &&
      plausible({
        name: ANALYTICS_EVENTS.IS_ATTACHING,
        props: {
          attaching,
        },
      })
  }
  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles = Array.from(selectedFiles)

    // File size limits to prevent token overflow (conservative estimates)

    // Validate against agent capabilities and file size
    const validFiles: File[] = []

    for (const file of newFiles) {
      // Validate file using utility function
      const validation = validateFile(
        file,
        selectedAgent?.capabilities,
        selectedAgent?.name as any, // Pass agent model for size limits
      )

      if (!validation.isSupported) {
        toast.error(
          `${file.name}: File type not supported by ${selectedAgent?.displayName}`,
        )
        continue // Skip this file but continue processing others
      }

      if (file.size > validation.maxSize) {
        toast.error(
          `${file.name}: File too large. Max size: ${formatFileSize(validation.maxSize)}`,
        )
        continue
      }

      // Send original file - server will handle optimization if needed
      validFiles.push(file)
    }

    setFiles((prev) => [...prev, ...validFiles].slice(0, MAX_FILES))

    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} file(s) selected`)
      setIsAttaching(false) // Close attachment menu after selection
    }
  }

  const clearFiles = () => setFiles([])

  // Remove specific file
  const removeFile = (index: number) => {
    setFilesInternal((prev) => prev.filter((_, i) => i !== index))
    device === "desktop" && setShouldFocus(true)
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.items?.length > 0) setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    dragCounter.current = 0
    if (e.dataTransfer.files?.length > 0) {
      const sushiAgent = aiAgents.find((a) => a.name === "sushi")
      if (sushiAgent && !selectedAgent?.capabilities?.pdf)
        setSelectedAgent(sushiAgent)
      handleFileSelect(e.dataTransfer.files)
    }
  }

  // Fetch quota information
  const fetchQuotaInfo = async () => {
    const response = await apiFetch(`${API_URL}/messages?quota=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) {
      const data = await response.json()
      return data
    }
  }

  const {
    data: quotaData,
    mutate: refetchQuotaInfo,
    isLoading: isFetchingQuotaInfo,
  } = useSWR(
    token && ["quotaInfo"],
    () => {
      return fetchQuotaInfo()
    },
    {
      // revalidateOnMount: true,
      // revalidateOnFocus: true,
    },
  )

  const [instructionsIndex, setInstructionsIndex] = useState(0)

  useEffect(() => {
    refetchQuotaInfo()
  }, [])

  useEffect(() => {
    if (!quotaData) return
    setQuotaInfo(quotaData.quotaInfo)
  }, [quotaData])

  // Handle extension actions from AI responses

  // Format time remaining until reset
  const formatTimeUntilReset = (resetTime: string) => {
    const now = new Date()
    const reset = new Date(resetTime)
    const diff = reset.getTime() - now.getTime()

    if (diff <= 0) return "Now"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Get file type for UI logic
  const getFileType = (
    file: File,
  ): "image" | "audio" | "video" | "pdf" | "text" | "other" => {
    const type = file.type.toLowerCase()
    if (type.startsWith("image/")) return "image"
    if (type.startsWith("audio/")) return "audio"
    if (type.startsWith("video/")) return "video"
    if (type.startsWith("text/")) return "text"
    if (type.startsWith("application/pdf")) return "pdf"
    return "other"
  }

  // Check if we have files of a specific type
  const hasFileType = (type: "image" | "audio" | "video" | "pdf") => {
    return files.some((file) => getFileType(file) === type)
  }

  // Check if attachment buttons should be disabled
  const isAttachmentDisabled = (type: "image" | "audio" | "video" | "pdf") => {
    // Disable if we have 3 files already
    if (files.length >= MAX_FILES) return true

    // Disable if we have files of a different type
    // const currentTypes = [...new Set(files.map(getFileType))]
    // if (currentTypes.length > 0 && !currentTypes.includes(type)) return true

    return false
  }

  // Get button color based on selection state
  const getButtonColor = (type: "image" | "audio" | "video" | "pdf") => {
    if (isAttachmentDisabled(type)) return "var(--shade-3)"
    if (hasFileType(type)) return "var(--accent-4)"
    return "var(--accent-6)"
  }

  const [synthesis, setSynthesis] = useState<SpeechSynthesisUtterance | null>(
    null,
  )

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  // Create image preview URL
  const createImagePreview = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const inConversationRef = useRef(false)

  const [hasPlayed, setHasPlayed] = useState(false)

  // Voice conversation functionality
  const startVoiceConversation = async () => {
    plausible({
      name: ANALYTICS_EVENTS.VOICE_CONVERSATION,
      props: {
        started: true,
      },
    })

    if (hasPlayed) {
      setIsSpeechActive(true)
    }

    inConversationRef.current = true

    setIsLoading(true)

    // Start with AI greeting

    try {
      if (synthesis) synthesis.dispatchEvent(new Event("pause"))

      if (audio) audio?.pause()

      // Generate and play AI greeting with TTS
      playAIResponseWithTTS()

      setHasPlayed(true)
    } catch (error) {
      console.error("Voice conversation error:", error)
      captureException(error)
      startListening()
    } finally {
      setIsLoading(false)
    }
  }
  const [_isVideoLoading, _setIsVideoLoading] = useState(true)

  const _videoRef = useRef<HTMLVideoElement>(null)
  const [voiceMessages, setVoiceMessages] = useState<
    { messageId?: string; text: string }[]
  >([])

  useEffect(() => {
    if (isSpeaking || isListening) return
    if (voiceMessages.length > 0) {
      const message = voiceMessages[0]
      message && playAIResponseWithTTS(message.text)
      setVoiceMessages((prev) => prev.slice(1))
    }
  }, [voiceMessages, isSpeaking, isListening])

  // Play AI response with TTS and continue conversation
  const playAIResponseWithTTS = async (text?: string) => {
    // return
    try {
      if (canEarnBadgeRef.current)
        await auth.patchCharacterProfile({
          newProfile: true,

          onSuccess: () => {
            setCanEarnBadge(false)
          },
          onError: () => {
            setCanEarnBadge(false)
          },
        })
      const response = await apiFetch(`${API_URL}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ text, language }),
      })

      const data = await response.json()

      if (data.usage) {
        user &&
          setUser({
            ...user,
            speechRequestsToday: data.usage.requestsToday,
            speechRequestsThisHour: data.usage.requestsThisHour,
            speechCharactersToday: data.usage.charactersToday,
          })

        guest &&
          setGuest({
            ...guest,
            speechRequestsToday: data.usage.requestsToday,
            speechRequestsThisHour: data.usage.requestsThisHour,
            speechCharactersToday: data.usage.charactersToday,
          })

        setIsSpeechActive(true)
      }

      if (data.error) {
        toast.error(t(data.error))
        setIsLoading(false)
        inConversationRef.current = false
        return
      }

      if (data.useWebSpeech) {
        // Fallback to Web Speech API
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.onend = () => {
            setSynthesis(null)
            setIsSpeaking(false)
            inConversationRef.current = false
            // Continue conversation - start listening again
            // if (!isDebate) {
            //   setTimeout(() => startListening(), 1000)
            //   inConversationRef.current = false
            // }
            inConversationRef.current = false
          }
          speechSynthesis.speak(utterance)
          setIsSpeaking(true)
          setSynthesis(utterance)
        }
      } else if (data.audio) {
        // Play ElevenLabs audio
        const audio = new Audio(data.audio)
        setAudio(audio)
        audio.onended = () => {
          setIsSpeaking(false)
          setAudio(null)
          // if (!isDebate && voiceMessages.length === 0) {
          //   setTimeout(() => startListening(), 1000)
          //   inConversationRef.current = false
          // }
          inConversationRef.current = false
        }

        try {
          setIsSpeaking(true)
          await audio.play()
          setAudio(audio)
        } catch (error) {
          captureException(error)
          console.error("Audio play failed, falling back to Web Speech:", error)
          // ios audio fallback to Web Speech API
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.onend = () => {
              setIsSpeaking(false)
              inConversationRef.current = false
              setTimeout(() => startListening(), 1000)
            }
            speechSynthesis.speak(utterance)
            setIsSpeaking(true)
          }
        }
      }
    } catch (error) {
      captureException(error)
      console.error("TTS playback error:", error)
      // Continue conversation even if TTS fails
      setTimeout(() => startListening(), 1000)
    }
  }

  const startListening = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast.error(
        "Voice input not supported in this browser. Try Chrome or Edge.",
      )
      return
    }

    if (isListening) {
      stopVoiceInput()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = language === "en" ? "en-US" : language
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log("🎤 Voice recognition started")
      setIsListening(true)
      toast.success("Listening... Speak now!")
    }

    let finalTranscript = ""

    recognition.onresult = (event: any) => {
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      // Show interim + final results in input
      const displayText = finalTranscript + interimTranscript
      console.log("🎤 Transcript:", displayText)
    }

    recognition.onend = () => {
      console.log("🎤 Voice recognition ended")
      setIsListening(false)
      setRecognition(null)
      // Auto-send the message and get AI response with voice
      if (inputRef.current) {
        handleSubmit()
      }
    }

    recognition.onerror = (event: any) => {
      console.error("🎤 Voice recognition error:", event.error)
      captureException(event.error)
      setIsListening(false)
      setRecognition(null)

      switch (event.error) {
        case "aborted":
          break
        case "no-speech":
          break
        case "audio-capture":
          toast.error("Microphone not accessible. Please check permissions.")
          break
        case "not-allowed":
          toast.error(
            "Microphone access denied. Please allow microphone access.",
          )
          break
        default:
          toast.error(`Voice recognition error: ${event.error}`)
      }
    }

    recognition.start()
    setRecognition(recognition)
  }

  const stopVoiceInput = () => {
    plausible({
      name: ANALYTICS_EVENTS.VOICE_INPUT,
      props: {
        stopped: true,
      },
    })
    if (recognition) {
      recognition.stop()
    }
    setIsListening(false)
    setRecognition(null)
  }

  const stopSpeechConversation = () => {
    addHapticFeedback()
    plausible({
      name: ANALYTICS_EVENTS.VOICE_CONVERSATION,
      props: {
        stopped: true,
      },
    })
    stopVoiceInput()
    synthesis?.dispatchEvent(new Event("pause"))
    audio?.pause()
    if (recognition) {
      recognition.stop()
    }
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel()
    }
    setIsListening(false)
    setIsSpeechActive(false)
    setRecognition(null)
    inConversationRef.current = false
  }

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [recognition])

  const _showHourlyLimitInfo = hourlyUsageLeft <= 5

  // Compress images to reduce token usage
  const _compressImage = (
    file: File,
    maxWidth = 1920,
    quality = 0.92,
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      console.log(`🔧 Starting compression for ${file.name}...`)

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        console.warn("❌ Canvas context not available")
        resolve(file)
        return
      }

      const img = new Image()

      img.onload = () => {
        console.log(`📐 Original dimensions: ${img.width}x${img.height}`)

        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1) // Don't upscale
        const newWidth = Math.floor(img.width * ratio)
        const newHeight = Math.floor(img.height * ratio)

        console.log(
          `📐 New dimensions: ${newWidth}x${newHeight} (ratio: ${ratio})`,
        )

        canvas.width = newWidth
        canvas.height = newHeight

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`✅ Blob created: ${blob.size} bytes`)
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg", // Force JPEG for better compression
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              console.warn("❌ Failed to create blob")
              resolve(file) // Fallback to original
            }
          },
          "image/jpeg",
          quality,
        ) // Force JPEG format
      }

      img.onerror = (error) => {
        console.warn("❌ Image load error:", error)
        resolve(file)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // File input handlers for different media types
  const triggerFileInput = (accept: string) => {
    addHapticFeedback()
    plausible({
      name: ANALYTICS_EVENTS.FILE_INPUT,
      props: {
        accept,
      },
    })
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.multiple = true
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (!target.files) return

      if (target.files.length + files.length > MAX_FILES) {
        toast.error(t("Too many files selected"))
      }

      const dataTransfer = new DataTransfer()
      Array.from(target.files)
        .slice(0, MAX_FILES - files.length)
        .forEach((file) => {
          dataTransfer.items.add(file)
        })

      handleFileSelect(dataTransfer.files)
    }
    input.click()
  }

  const { push } = router

  // Collaboration wizard steps
  const collaborationSteps = [
    {
      title: t("Start Your Conversation"),
      description: t(
        "Type your message or question in the chat input below to begin collaborating with AI.",
      ),
    },
    {
      title: t("Share Your Thread"),
      description: t(
        "Once you have a conversation going, click the share button to invite others to collaborate.",
      ),
    },
    {
      title: t("Real-time Collaboration"),
      description: t(
        "See when others are typing and collaborate in real-time with presence indicators.",
      ),
    },
    {
      title: t("You're All Set!"),
      description: t(
        "Start collaborating and create something amazing together!",
      ),
    },
  ]

  // Simple tooltip handlers
  const closeCollaborationTooltip = () => {
    addHapticFeedback()
    setCollaborationStep(0)
  }
  useEffect(() => {
    // clientIdRef.current = message?.message?.clientId
    BrowserInstance?.storage?.local?.set?.({ messageId: message?.message?.id })
  }, [message])

  const handleSubmit = async (approve?: boolean) => {
    if (
      guest &&
      selectedAgent?.authorization &&
      !["all", "guest"].includes(selectedAgent?.authorization)
    ) {
      addParams({
        subscribe: "true",
        plan: "member",
      })

      return
    }

    if (hitHourlyLimit) {
      if (guest && guest?.subscription?.plan !== "pro") {
        if (!guest?.subscription) {
          addParams({
            subscribe: "true",
            plan: "member",
          })
        } else {
          addParams({
            subscribe: "true",
            plan: guest?.subscription?.plan === "plus" ? "pro" : "plus",
          })
        }
      }

      if (user && user?.subscription?.plan !== "pro") {
        addParams({
          subscribe: "true",
          plan: user?.subscription?.plan === "plus" ? "pro" : "plus",
        })
      }

      toast.error(
        t("You hit your hourly limit {{hourlyLimit}}", {
          hourlyLimit,
        }),
      )

      return
    }

    if (creditsLeft === 0 && selectedAgent?.name !== "free") {
      setIsAgentModalOpen(true)
      toast.error(t("credits_left_other", { count: 0 }))
      return
    }

    if (!isPrivacyApproved && !approve) {
      setNeedsReview(true)
      return
    }

    if (approve) {
      setNeedsReview(false)
      setIsPrivacyApproved(true)
    }

    addHapticFeedback()

    clearFiles()

    if (
      !selectedAgent?.capabilities?.image &&
      files.some((file) => file.type.startsWith("image/"))
    ) {
      setIsAgentModalOpen(true)
      return
    }
    if (
      !selectedAgent?.capabilities?.pdf &&
      files.some((file) => file.type.startsWith("application/pdf"))
    ) {
      setIsAgentModalOpen(true)
      return
    }

    if (
      !selectedAgent?.capabilities?.audio &&
      files.some((file) => file.type.startsWith("audio/"))
    ) {
      setIsAgentModalOpen(true)
      return
    }
    if (
      !selectedAgent?.capabilities?.video &&
      files.some((file) => file.type.startsWith("video/"))
    ) {
      setIsAgentModalOpen(true)
      return
    }
    if (
      !selectedAgent?.capabilities?.text &&
      files.some((file) => file.type.startsWith("text/"))
    ) {
      setIsAgentModalOpen(true)
      return
    }

    shouldStopRef.current = false

    if (requiresSignin && !user) {
      addParams({ signIn: "login", callbackUrl: pathname })
      return
    }

    // e.preventDefault()

    if (
      selectedAgent?.maxPromptSize &&
      inputRef.current.length > selectedAgent?.maxPromptSize
    ) {
      toast.error(
        t(`Input too long (max ${selectedAgent?.maxPromptSize} chars)`),
      )
      return
    }

    if (files.length > 0 && !selectedAgent?.capabilities?.text) {
      setIsAgentModalOpen(true)
      return
    }

    if (isWebSearchEnabled && !selectedAgent?.capabilities?.webSearch) {
      setIsAgentModalOpen(true)
      return
    }

    if (getIsSendDisabled()) return

    const userMessageText = sanitizeHtml(inputRef.current.trim())

    if (userMessageText.length > PROMPT_LIMITS.TOTAL) {
      toast.error(t(`Input too long (max ${PROMPT_LIMITS.TOTAL} chars)`))
      return
    }

    setInput("")
    device === "desktop" && setShouldFocus(true)
    setIsLoading(true)

    // Scroll to bottom after sending message
    scrollToBottom(100, undefined, chatContainerRef.current)

    if (canEarnBadgeRef.current) {
      await auth.patchCharacterProfile({
        newProfile: true,
        onSuccess: () => {
          setCanEarnBadge(false)
        },
        onError: () => {
          setCanEarnBadge(false)
        },
      })
    }

    playNotification()

    if (isImageGenerationEnabled) {
      toast.success(t("Generating image, keep calm..."), {
        duration: 6000,
      })
    }
    onMessage?.({
      content: userMessageText,
      isUser: true,
      message: {
        message: {
          content: userMessageText,
          isUser: true,
          id: uuidv4(),
          clientId,
          createdOn: new Date(),
          guestId: guest?.id,
          userId: user?.id,
        } as unknown as message,
        user: user as user,
        guest: guest as guest,
      },
      hipChatId,
    })

    setIsLoading(true)

    const sanitizedThreadId =
      threadIdRef.current && validate(threadIdRef.current)
        ? threadIdRef.current
        : null

    try {
      let postRequestBody: FormData | string
      const postRequestHeaders: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      }
      if (artifacts && artifacts.length > 0) {
        nProgress.start()

        toast.success(t("Uploading artifacts..."))
        // Use FormData for file uploads
        const formData = new FormData()

        app && formData.append("appId", app?.id)
        postId && formData.append("tribePostId", postId)

        formData.append("content", userMessageText)
        formData.append("isIncognito", JSON.stringify(burn))
        selectedAgent && formData.append("agentId", selectedAgent?.id)
        debateAgent && formData.append("debateAgentId", debateAgent?.id)
        sanitizedThreadId && formData.append("threadId", sanitizedThreadId)
        formData.append("attachmentType", "file")
        formData.append("webSearchEnabled", JSON.stringify(isWebSearchEnabled))
        formData.append(
          "imageGenerationEnabled",
          JSON.stringify(isImageGenerationEnabled),
        )
        taskId && formData.append("taskId", taskId)
        mood && formData.append("moodId", mood.id)
        formData.append("actionEnabled", JSON.stringify(isExtension))
        instruction && formData.append("instructions", instruction)
        formData.append("language", language)
        clientId && formData.append("clientId", clientId)
        isPear && formData.append("pear", JSON.stringify(isPear))
        wasPear && formData.append("wasPear", JSON.stringify(wasPear))

        isRetro && formData.append("retro", JSON.stringify(isRetro))
        postToTribe && formData.append("tribe", JSON.stringify(postToTribe))
        postToMoltbook &&
          formData.append("molt", JSON.stringify(postToMoltbook))

        artifacts.forEach((artifact, index) => {
          formData.append(`artifact_${index}`, artifact)
        })

        postRequestBody = formData
        // Don't set Content-Type for FormData - browser will set it with boundary
      } else {
        // Use JSON for text-only messages
        postRequestHeaders["Content-Type"] = "application/json"
        postRequestBody = JSON.stringify({
          content: userMessageText,
          isIncognito: burn,
          agentId: selectedAgent?.id,
          debateAgentId: debateAgent?.id,
          threadId: sanitizedThreadId,
          webSearchEnabled: isWebSearchEnabled && !isExtension,
          imageGenerationEnabled: isImageGenerationEnabled,
          actionEnabled: isExtension,
          instructions: instruction,
          language,
          attachmentType: "file",
          clientId,
          appId: app?.id,
          moodId: mood?.id,
          taskId,
          pear: isPear,
          wasPear,
          retro: isRetro,
          tribe: postToTribe,
          molt: postToMoltbook,
          fingerprint,
          tribePostId: postId,
        })
      }
      const userResponse = await apiFetch(`${API_URL}/messages`, {
        method: "POST",
        headers: postRequestHeaders,
        body: postRequestBody,
      })

      if (debateAgent) {
        toast.success(t("Let's debate!"))
      }

      let result
      if (
        userResponse.headers.get("content-type")?.includes("application/json")
      ) {
        result = await userResponse.json()
        if (result.error) {
          nProgress.done()
          toast.error(result.error)
          return
        }
        // handle non-streaming JSON response
      }

      if (!userResponse.ok) {
        nProgress.done()
        toast.error("Failed to send message. Response is not ok")
        return
      }

      setIsLoading(false)

      nProgress.done()

      setInstruction("")
      setArtifacts([])

      const userMessage: {
        message: message
        user?: user
        guest?: guest
        aiAgent?: aiAgent
        thread?: thread
      } | null = result.message

      setMessage(userMessage)
      // Refresh tasks list after first message to task (to get newly created threadId)
      // playNotification()

      // const clientId = message?.message?.clientId

      if (userMessage?.message?.id) {
        setThreadId(userMessage?.message?.threadId)
        if (collaborationStep === 2) {
          setCollaborationStep(3)
        }

        onMessage?.({
          content: userMessageText,
          isUser: true,
          message: userMessage,
          hipChatId,
        })

        // Auto-advance daily questions AFTER message is sent
        // if (isRetro && dailyQuestionData) {
        //   const { questions, isLastQuestionOfSection } = dailyQuestionData
        //   if (isLastQuestionOfSection) {
        //     advanceDailySection()
        //   } else {
        //     setDailyQuestionIndex(dailyQuestionIndex + 1)
        //   }
        // }
      } else {
        toast.error("Failed to send message")
        return
      }

      if (!userMessage?.message?.clientId) {
        toast.error("Failed to send message")
        return
      }

      if (!selectedAgent || !token) {
        return
      }

      // Prepare request data - use FormData if files are present, JSON otherwise
      const { body: requestBody, headers: requestHeaders } = buildAiRequestBody(
        {
          token,
          files,
          slug,
          app,
          ask,
          about,
          userMessage,
          debateAgent,
          selectedAgent,
          language,
          isWebSearchEnabled,
          isExtension,
          isImageGenerationEnabled,
          isRetro,
          isPear,
          wasPear,
          placeholder,
          weather,
          deviceId,
          isSpeechActive,
          fingerprint,
          modelId,
          user,
        },
      )

      onMessage?.({
        content: "",
        isUser: false,
        message: {
          ...userMessage,
          message: {
            ...userMessage.message,
            id: userMessage?.message?.clientId,
          },
        },
        isStreaming: true,
        isImageGenerationEnabled,
        isWebSearchEnabled,
        hipChatId,
      })

      setIsStreaming(true)

      const agentResponse = await apiFetch(`${API_URL}/ai`, {
        method: "POST",
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
      })

      // Handle error and JSON responses
      const aiResult = await handleAiResponse(agentResponse)
      if (!aiResult.ok) return
      if (aiResult.result?.success) return
    } catch (error: any) {
      console.error("Chat error:", error)
      captureException(error)
      // Could add onError callback here
    } finally {
      setIsLoading(false)
      setClientId(uuidv4())
    }
  }

  useEffect(() => {
    let isProcessing = false
    let message = ""
    const processAction = async () => {
      if (isProcessing) return
      isProcessing = true

      try {
        const result = (await BrowserInstance?.storage?.local?.get?.([
          "contextMenuAction",
        ])) as {
          contextMenuAction: { type: string; text: string }
        }

        const type = result?.contextMenuAction?.type
        if (type) {
          message = (() => {
            if (type === "writeReply") {
              return t(`✍️ Please help me write a reply to`)
            } else if (type === "checkGrammar")
              return t(`📝 Please check the grammar in this text`)
            else if (type === "aiDebate")
              return t(`⚖️ Let's have a debate about this`)
            else if (type === "factCheck")
              return t(`🔍 Please fact check this statement`)
            else if (type === "summarize")
              return t(`📋 Please summarize this text`)

            return message
          })()
        }

        if (result?.contextMenuAction?.text) {
          setInput(`${message}: ${result.contextMenuAction.text}`)

          const storageLocal = BrowserInstance?.storage?.local
          if (storageLocal && "remove" in storageLocal) {
            await storageLocal.remove(["contextMenuAction"])
          }

          if (type !== "aiDebate") {
            debateAgent && setDebateAgent(null)
            setAttempt("submit")
            setShouldSubmit(true)
          } else {
            if (selectedAgent === null) {
              setSelectedAgent(undefined)
            }
            if (!debateAgent) {
              setIsDebateAgentModalOpen(true)
              setAttempt("debate")
            } else {
              setAttempt("debate")
              setShouldSubmit(true)
            }
          }
        }
      } catch (error) {
        console.error("Error processing action:", error)
        captureException(error)
      } finally {
        isProcessing = false
      }
    }

    // Primary: Storage change listener (instant)
    const handleStorageChange = (changes: any, areaName?: string) => {
      if (areaName === "local" && changes.contextMenuAction?.newValue?.text) {
        processAction()
      }
    }

    // Fallback: Check on mount and occasional polling
    processAction()
    const interval = setInterval(processAction, 2000) // Reduced to 2s

    const storageAPI = BrowserInstance?.storage
    const hasOnChanged =
      storageAPI && "onChanged" in storageAPI && storageAPI.onChanged

    if (hasOnChanged) {
      storageAPI.onChanged.addListener(handleStorageChange)
    }

    return () => {
      clearInterval(interval)
      if (hasOnChanged) {
        storageAPI.onChanged.removeListener(handleStorageChange)
      }
    }
  }, [setInput])

  const [streamId, setStreamId] = useState<string | null>(null)
  const handleStopStreaming = async () => {
    addHapticFeedback()
    isPlayingSillyPopCluster.current = false

    await apiFetch(`${API_URL}/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        stopStreamId: streamId,
        messageId: message?.message.id,
        fingerprint,
        agentId: isDebating
          ? message?.message.debateAgentId
          : message?.message.selectedAgentId,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        setShouldGetCredits(true)

        message &&
          onStreamingStop?.({
            ...message,
            message: {
              ...message.message,
            },
          })
        setIsStreaming(false)
        setIsLoading(false)
        shouldStopRef.current = true
        streamContentRef.current = ""
        setClientId(uuidv4())
      })

    if (controller) {
      controller.abort()
      // Re-enable sending after a short delay
      setTimeout(() => {
        // This timeout allows the UI to update and prevents immediate re-sending
      }, 1000)
    }
  }

  const handleInputChange = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLInputElement>,
    ) => {
      const value = e.target.value
      setInput(value)

      // Handle typing notifications for collaborative threads
      if (onTyping && thread) {
        // Clear existing timeout

        // If input is empty, immediately stop typing
        if (value.length === 0) {
          onTyping(false)
        } else {
          onTyping(true)
        }
      }
    },
    [onTyping, thread, setInput],
  )

  function getUnlockTime() {
    if (user) {
      if (!user?.lastMessage?.createdOn) return null
      return new Date(
        new Date(user?.lastMessage?.createdOn).getTime() + 60 * 60 * 1000,
      )
    }
    if (guest) {
      if (!guest?.lastMessage?.createdOn) return null
      return new Date(
        new Date(guest?.lastMessage?.createdOn).getTime() + 60 * 60 * 1000,
      )
    }

    return null
  }

  const placeholderStages = [".", "..", "..."]
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showGlow, setShowGlow] = useState(false)
  const previousPlaceholder = useRef(placeholder)

  const animationLoop = useRef<number>(0)

  // Trigger glow effect on initial load AND when placeholder changes
  useEffect(() => {
    if (placeholder) {
      // Trigger on load or change
      if (
        !previousPlaceholder.current ||
        placeholder !== previousPlaceholder.current
      ) {
        setShowGlow(true)
        previousPlaceholder.current = placeholder

        // Remove glow after animation completes
        const timer = setTimeout(() => {
          setShowGlow(false)
        }, 2000) // Match animation duration

        return () => clearTimeout(timer)
      }
    }
  }, [placeholder])

  useEffect(() => {
    let interval: any = null
    // Only animate if input is empty and not focused
    if (inputRef.current.length > 0) {
      interval && clearInterval(interval)
      return
    }
    interval = setInterval(() => {
      animationLoop.current = animationLoop.current + placeholderIndex + 1

      setPlaceholderIndex((i) => (i + 1) % placeholderStages.length)
      if (animationLoop.current >= placeholderStages.length + 2) {
        interval && clearInterval(interval)
      }
    }, 600) // adjust speed as desired
    return () => clearInterval(interval)
  }, [inputRef.current])

  // function formatUnlockTime(date: Date | null) {
  //   if (!date) return ""
  //   return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  // }

  const [isGame, setIsGameInternal] = useState(false)
  const _setIsGame = (value: boolean) => {
    setIsGameInternal(value)
    plausible({
      name: ANALYTICS_EVENTS.GAME_TOGGLE,
      props: {
        isGame: value,
      },
    })
  }

  const shouldStopRef = useRef(false)

  const streamContentRef = useRef("")

  const isPlayingSillyPopCluster = useRef(false)

  // Memoize deps to prevent reconnection loop
  const webSocketDeps = useMemo(
    () => [isSpeechActive, app?.id, deviceId, accountApps],
    [isSpeechActive, app?.id, deviceId, accountApps],
  )

  useWebSocket<{
    type: string
    data: {
      clientId?: string
      streamId?: string
      chunk?: string
      isImageGenerationEnabled?: boolean
      isWebSearchEnabled?: boolean
      message?: {
        message: message & { parentMessage?: message }
        user?: user
        guest?: guest
        aiAgent?: aiAgent
      }
      isFinal?: boolean
      deviceId?: string
    }
  }>({
    deps: webSocketDeps,
    onMessage: async ({ type, data }) => {
      const threadId = threadIdRef.current

      data?.streamId && setStreamId(data.streamId)

      if (!token) return

      const mClientId = data?.clientId

      if (
        data?.message?.message?.agentId &&
        isOwner(data.message.message, {
          userId: user?.id,
          guestId: guest?.id,
        })
          ? data?.deviceId && data?.deviceId !== deviceId
          : false
      ) {
        return
      }

      const chunk = data?.chunk
      if (type === "stream_update" && chunk && mClientId && data.message) {
        if (isSpeechActive && os !== "ios") {
          return
        }

        if (threadId && data.message?.message?.threadId !== threadId) {
          return
        }
        if (!isPlayingSillyPopCluster.current) {
          playNotification()
          isPlayingSillyPopCluster.current = true
        }

        if (shouldStopRef.current) return // Early exit if stopped

        // Accumulate chunks
        if (!shouldStopRef.current) {
          streamContentRef.current += data.chunk
          const cleanContent = stripActionText(streamContentRef.current, chunk)
          onStreamingUpdate?.({
            content: cleanContent,
            clientId: mClientId,
            aiAgent: data.message?.aiAgent,
            isWebSearchEnabled,
            isImageGenerationEnabled,
            hipchat,
          })
        }
      } else if (type === "stream_complete") {
        const threadId = data.message?.message?.threadId

        isPlayingSillyPopCluster.current = false
        setIsStreaming(false)

        if (!threadId) return
        if (threadId && data.message?.message?.threadId !== threadId) {
          return
        }
        if (!data.message?.aiAgent) {
          return
        }
        // Get final message
        // Reset stream state
        streamContentRef.current = ""

        // Play AI response with TTS if in voice conversation mode (skip on ios)
        if (isSpeechActive && data.message?.message?.content) {
          if (os === "ios") {
            setIsSpeechActive(false)
            setIsSpeaking(false)
            setIsSpeechActive(false)
          } else {
            data?.message?.message?.content &&
              setVoiceMessages((prev) => [
                ...prev,
                { text: stripMarkdown(data?.message?.message?.content || "") },
              ])
          }
        }

        // Notify completion
        onStreamingComplete?.(data.message)
        isImageGenerationEnabled && setIsImageGenerationEnabled(false)

        sushiAgent &&
          selectedAgent?.name === sushiAgent?.name &&
          isWebSearchEnabled &&
          setIsWebSearchEnabled(false)

        !userSelectedAgent &&
          peachAgent &&
          sushiAgent &&
          selectedAgent?.name === sushiAgent?.name &&
          creditsLeft &&
          creditsLeft < 10 &&
          setSelectedAgent(peachAgent)

        isPear && setPear(undefined)

        data.streamId === streamId && setStreamId(null)

        if (
          message?.message &&
          isOwner(data.message.message, {
            userId: user?.id,
            guestId: guest?.id,
          })
        ) {
          if (user) {
            setUser({
              ...user,
              lastMessage: data.message.message,
              messagesLastHour: (user.messagesLastHour || 0) + 1,
            })
          }

          if (guest) {
            setGuest({
              ...guest,
              lastMessage: data.message.message,
              messagesLastHour: (guest.messagesLastHour || 0) + 1,
            })
          }
        }

        if (
          data.message.message.debateAgentId &&
          !data.message.message.pauseDebate
        ) {
          onMessage?.({
            content: "",
            isUser: false,
            message: {
              ...data.message,
              message: {
                ...data.message?.message,
                id: data.message.message.clientId,
              },
              aiAgent: aiAgents?.find(
                (agent) => agent.id === data.message?.message.debateAgentId,
              ),
            },
            hipChatId,
            isStreaming: true,
            isImageGenerationEnabled: data?.isImageGenerationEnabled,
            isWebSearchEnabled: data?.isWebSearchEnabled,
          })
          setIsStreaming(true)
          const requestHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
          const requestBody = JSON.stringify({
            messageId: data.message.message.id,
            agentId: data.message.message.debateAgentId,
            debateAgentId: data.message.message.agentId,
            language,
            pauseDebate: true,
            isSpeechActive,
            deviceId,
            appId: app?.id,
            retro: isRetro,
            fingerprint,
          })

          try {
            const agentResponse = await apiFetch(`${API_URL}/ai`, {
              method: "POST",
              headers: requestHeaders,
              body: requestBody,
              signal: controller.signal,
            })

            if (!agentResponse.ok) {
              toast.error("Error starting debate")
              return
            }

            const agentData = await agentResponse.json()

            if (agentData.error) {
              toast.error(agentData.error)
              return
            }
            setIsStreaming(true)
          } catch (error) {
            console.error("Error updating message:", error)
            captureException(error)
            toast.error("Error starting debate")
          }
        }
      } else if (type === "message" && data.message) {
        if (!threadId || data.deviceId === deviceId) return
        if (threadId && data.message?.message.threadId !== threadId) {
          return
        }

        onMessage?.({
          content: data.message?.message.content || "",
          isUser: true,
          message: data.message,
          isImageGenerationEnabled: data?.isImageGenerationEnabled,
          isWebSearchEnabled: data?.isWebSearchEnabled,
          hipChatId,
        })

        data.message.message.selectedAgentId &&
          onMessage?.({
            content: "",
            isUser: false,
            message: {
              ...data.message,
              message: {
                ...data.message?.message,
                id: data.message.message.clientId,
              },
            },
            isStreaming: true,
            isImageGenerationEnabled: data?.isImageGenerationEnabled,
            isWebSearchEnabled: data?.isWebSearchEnabled,
            hipChatId,
          })
      }
    },
    token,
    deviceId,
  })

  const [isPrivacyApproved, setIsPrivacyApprovedInternal] = useLocalStorage(
    "isPrivacyApproved",
    !!user,
  )

  const canEarnBadgeRef = useRef(false)
  const setCanEarnBadge = (value: boolean) => {
    !auth.characterProfilesEnabled && (canEarnBadgeRef.current = value)
  }
  const setIsPrivacyApproved = (value: boolean) => {
    if (value && !auth.characterProfilesEnabled) {
      setCanEarnBadge(true)
    }
    setIsPrivacyApprovedInternal(value)
  }

  useEffect(() => {
    user && setIsPrivacyApproved(true)
  }, [user])

  const setNeedsReview = (value: boolean) => {
    setNeedsReviewInternal(value)
    needsReviewRef.current = value
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    addHapticFeedback()
    device === "desktop" && setShouldFocus(true)

    if (e.clipboardData.files.length > 0) {
      const imageFiles = Array.from(e.clipboardData.files).filter((file) =>
        file.type.startsWith("image/"),
      )

      if (imageFiles.length > 0) {
        e.preventDefault()

        // Check agent capabilities for images
        if (!selectedAgent?.capabilities.image) {
          setIsAgentModalOpenInternal(true)
          return
        }

        if (debateAgent && !debateAgent.capabilities.image) {
          setIsDebateAgentModalOpen(true)
          return
        }

        // Check file count limit
        const remainingSlots = MAX_FILES - files.length
        if (remainingSlots <= 0) {
          toast.error(t("Too many files"))
          return
        }

        // Add the images (respecting remaining slots)
        const filesToAdd = imageFiles.slice(0, remainingSlots)
        setFiles((prev) => [...prev, ...filesToAdd])
        return
      }
    }
    const text = e.clipboardData.getData("text/plain")

    if (text.length > 700) {
      e.preventDefault()
      if (!selectedAgent?.capabilities.pdf) {
        setIsAgentModalOpenInternal(true)
        return
      }

      if (debateAgent && !debateAgent?.capabilities.pdf) {
        setIsDebateAgentModalOpen(true)
        return
      }
      // Use agent-specific limit if available, otherwise default
      const maxSize = getMaxFileSize("text/plain")

      if (text.length > maxSize) {
        toast.error(t(`Paste limit exceeded (max ${maxSize} chars)`))
        return
      }

      const blob = new Blob([text], { type: "text/plain" })
      const file = new File([blob], "pasted.txt", {
        type: "text/plain",
        lastModified: Date.now(),
      })

      if (files.length >= MAX_FILES) {
        toast.error(t("Too many files"))
        return
      }

      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
        toast.error(`${file.name}: File too large. Max size: ${maxSizeMB}MB`)
        return
      }

      setFiles([...files, file])
      e.preventDefault()
    }
  }

  useEffect(() => {
    onToggleGame?.(isGame)
  }, [isGame])

  useEffect(() => {
    onToggleGame?.(isGame)
  }, [isGame])

  const unlockDate = getUnlockTime()
  const remainingMs = useCountdown(hitHourlyLimit ? unlockDate : null)

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const [exceededInitial, setExceededInitial] = useState(false)
  const initialHeight = useRef<number | null>(null)

  useEffect(() => {
    // Use setTimeout to ensure ref is registered
    const timer = setTimeout(() => {
      const el = chatInputRef.current

      if (!el || typeof window === "undefined") return

      // Save initial height on first render
      if (initialHeight.current === null) {
        initialHeight.current = el.scrollHeight
      }

      // Wait for element to be fully rendered with width
      if (el.clientWidth === 0) {
        return
      }

      let newHeight = initialHeight.current || 0

      // If there's input, measure it directly
      if (input && el?.scrollHeight) {
        el.style.height = "auto"
        newHeight = el.scrollHeight
      }
      // If no input but placeholder exists, estimate height
      else if (placeholder && !input) {
        // Get computed styles
        const styles = window.getComputedStyle(el)
        const lineHeight = Number.parseInt(styles.lineHeight, 10) || 20
        const paddingTop = Number.parseInt(styles.paddingTop, 10) || 0
        const paddingBottom = Number.parseInt(styles.paddingBottom, 10) || 0
        const width =
          el.clientWidth -
          Number.parseInt(styles.paddingLeft || "0", 10) -
          Number.parseInt(styles.paddingRight || "0", 10)

        // Only calculate if we have a valid width
        if (width > 0) {
          // Estimate characters per line based on average character width
          const avgCharWidth = 8 // approximate for most fonts
          const charsPerLine = Math.floor(width / avgCharWidth)
          const estimatedLines = Math.ceil(placeholder.length / charsPerLine)

          // Calculate estimated height
          newHeight = estimatedLines * lineHeight + paddingTop + paddingBottom
        }
      }

      // Apply calculated height
      if (isWeb && (input || placeholder)) {
        el.style.height = `${newHeight}px`
      } else if (!input && !placeholder && initialHeight.current) {
        // Reset to initial height when both are empty
        el.style.height = `${initialHeight.current}px`
      }

      // Check if exceeded
      setExceededInitial(newHeight > (initialHeight.current + 30 || 0))
    }, 0)

    return () => clearTimeout(timer)
  }, [input, placeholder, isWeb, minimize])

  const inputText = inputRef.current?.trim() || input?.trim() || ""

  const getIsSendDisabled = () =>
    (inputText === "" && files.length === 0) || isLoading || disabled

  const isVoiceDisabled = isLoading || disabled

  const [_speechSupported, setSpeechSupported] = useState(false)

  useEffect(() => {
    const hasRecognition =
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window

    setSpeechSupported(hasRecognition)
  }, [])

  useEffect(() => {
    device === "desktop" && setShouldFocus(true)
  }, [device, setShouldFocus])

  useEffect(() => {
    if (!hitHourlyLimit) return
    plausible({
      name: ANALYTICS_EVENTS.HIT_HOURLY_LIMIT,
      props: {
        hourlyUsageLeft,
      },
    })

    setMinimize(false)
  }, [hitHourlyLimit, hourlyUsageLeft, setMinimize])

  useEffect(() => {
    files.length > 0 &&
      plausible({
        name: ANALYTICS_EVENTS.FILE_UPLOAD,
        props: {
          filesLength: files.length,
        },
      })
  }, [files.length])

  const newDesign = !auth.isLiveTest

  const showAgentDetailsInitial = !newDesign
    ? undefined
    : creditsLeft
      ? selectedAgent?.name
      : "free"
  const [showAgentDetails, setShowAgentDetails] = useState<string | undefined>(
    showAgentDetailsInitial,
  )

  useEffect(() => {
    setShowAgentDetails(showAgentDetailsInitial)
  }, [selectedAgent])

  // Scroll detection for auto-hide chat input
  useEffect(() => {
    if (empty) return

    const offset = 150
    const checkBottomOffset = () => {
      const scrollPosition = window.scrollY
      const documentHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      const distanceFromBottom =
        documentHeight - (scrollPosition + viewportHeight)

      // Has bottom offset if not at the very bottom (more than 100px from bottom)
      setHasBottomOffset(distanceFromBottom > offset)
    }

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null
    const handleScroll = () => {
      if (scrollTimeout) return
      scrollTimeout = setTimeout(() => {
        const scrollPosition = window.scrollY
        const documentHeight = document.documentElement.scrollHeight
        const currentWindowHeight = window.innerHeight
        const distanceFromBottom =
          documentHeight - (scrollPosition + currentWindowHeight)

        // Show chat input when within 150px of bottom
        setShowChatInput(distanceFromBottom < offset)

        // Check for bottom offset
        checkBottomOffset()
        scrollTimeout = null
      }, 16) // ~60fps throttle
    }

    const handleResize = () => {
      setWindowHeight(window.innerHeight)
      // Check for bottom offset after resize
      setTimeout(checkBottomOffset, 0) // Defer to next tick
    }

    const handleDOMChange = () => {
      // Only update window height if it actually changed
      const currentHeight = window.innerHeight
      setWindowHeight((prev) => (prev !== currentHeight ? currentHeight : prev))
      // Check for bottom offset when DOM changes
      setTimeout(checkBottomOffset, 0) // Defer to next tick
    }

    // Initial check for bottom offset
    setTimeout(checkBottomOffset, 0)

    // Add comprehensive event listeners
    window.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)

    // Listen for DOM changes that could affect layout
    // Use throttling to prevent excessive calls
    let domChangeTimeout: ReturnType<typeof setTimeout> | null = null
    const throttledDOMChange = () => {
      if (domChangeTimeout) return
      domChangeTimeout = setTimeout(() => {
        handleDOMChange()
        domChangeTimeout = null
      }, 100) // Throttle to max once per 100ms
    }

    const observer = new MutationObserver(throttledDOMChange)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "height"],
    })

    // Listen for image loads and other layout-affecting events
    window.addEventListener("load", handleDOMChange)
    window.addEventListener("networkidle", handleDOMChange)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
      window.removeEventListener("load", handleDOMChange)
      window.removeEventListener("networkidle", handleDOMChange)
      observer.disconnect()
      if (domChangeTimeout) {
        clearTimeout(domChangeTimeout)
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [empty])

  // Function to show chat input and scroll to bottom
  const showInputAndScrollToBottom = () => {
    addHapticFeedback()
    scrollToBottom(500, true, chatContainerRef.current)
  }

  const [shouldSubmit, setShouldSubmit] = useState(false)

  useEffect(() => {
    if (
      shouldSubmit &&
      ((attempt === "debate" && debateAgent && selectedAgent) ||
        (attempt === "submit" && selectedAgent && !debateAgent))
    ) {
      setTimeout(handleSubmit, 500)
      setShouldSubmit(false)
      setAttempt(undefined)
    }
  }, [shouldSubmit, selectedAgent, attempt, debateAgent])

  const getFilteredAgents = (onlyOne?: boolean) =>
    aiAgents
      ?.filter((agent) =>
        isDebateAgentModalOpen
          ? onlyOne && newDesign
            ? agent.name === showAgentDetails
            : files.length
              ? agent.capabilities.pdf
              : agent.capabilities.text &&
                agent.state === "active" &&
                agent.id !== selectedAgent?.id &&
                agent.id !== debateAgent?.id
          : debateAgent
            ? agent.id !== debateAgent.id
            : onlyOne && newDesign
              ? agent.name === showAgentDetails
              : true,
      )
      .sort((a, b) => {
        if (a.id === sushiAgent?.id) {
          return -1
        }
        return a.order - b.order
      })

  const renderSubmit = () => {
    return (
      <>
        {!isSelectingMood && (
          <>
            {streamId && isStreaming ? (
              <Button
                data-testid="chat-stop-streaming-button"
                title={t("Stop streaming")}
                className="link"
                type="button"
                style={{ ...styles.sendButton.style }}
                disabled={!isStreaming}
                onClick={handleStopStreaming}
              >
                <CircleStop color="var(--accent-0)" size={26} />
              </Button>
            ) : isLoading && !isStreaming ? (
              <Loading width={28} height={28} />
            ) : inputText || files.length > 0 ? (
              <Button
                data-testid="chat-send-button"
                title={
                  creditsLeft === 0
                    ? t("credits_left", { count: creditsLeft })
                    : needsReviewRef.current
                      ? t("Accept and send")
                      : t("Send")
                }
                className="link"
                style={{ ...styles.sendButton.style }}
                type="submit"
                disabled={getIsSendDisabled()}
                onClick={() => handleSubmit(needsReviewRef.current)}
              >
                {needsReviewRef.current ? (
                  <Span
                    style={{
                      ...utilities.row.style,
                    }}
                    data-testid="chat-accept-button"
                  >
                    {t("Accept")}
                    <CircleCheck size={30} color="var(--accent-6)" />
                  </Span>
                ) : (
                  <CircleArrowUp
                    color={
                      creditsLeft === 0
                        ? "var(--accent-0)"
                        : getIsSendDisabled()
                          ? "var(--shade-3)"
                          : "var(--accent-6)"
                    }
                    size={30}
                  />
                )}
              </Button>
            ) : isLoading ? (
              <Loading width={26} height={26} />
            ) : (
              <Button
                onClick={() => {
                  if (
                    guest &&
                    selectedAgent?.authorization &&
                    !["all", "guest"].includes(selectedAgent?.authorization)
                  ) {
                    addParams({
                      subscribe: "true",
                      plan: "member",
                    })

                    return
                  }

                  if (hitHourlyLimit) {
                    toast.error(
                      t("You hit your hourly limit {{hourlyLimit}}", {
                        hourlyLimit,
                      }),
                    )
                    return
                  }
                  if (creditsLeft === 0 && selectedAgent?.name !== "free") {
                    setIsAgentModalOpen(true)
                    toast.error(t("credits_left_other", { count: 0 }))
                    return
                  }
                  if (!isPrivacyApproved) {
                    if (needsReview) {
                      // Approve and start voice conversation
                      setIsPrivacyApproved(true)
                      setNeedsReview(false)

                      playNotification()
                      addHapticFeedback()

                      setPlayVideo(!playVideo)
                      setIsLoading(true)
                      startVoiceConversation()
                    } else {
                      setNeedsReview(true)
                    }
                    return
                  }

                  playNotification()
                  addHapticFeedback()

                  setPlayVideo(!playVideo)
                  setIsLoading(true)
                  startVoiceConversation()
                }}
                disabled={isVoiceDisabled || inConversationRef.current}
                className="link"
                style={{
                  ...styles.voiceButton.style,
                  ...(isListening ? styles.voiceButtonListening.style : {}),
                }}
                type="button"
                title={
                  isListening ? t("Stop listening") : t("Start voice input")
                }
              >
                {needsReview ? (
                  <Span
                    style={{
                      ...utilities.row.style,
                    }}
                    data-testid="chat-accept-button"
                  >
                    {t("Accept")}
                    <CircleCheck size={30} color="var(--accent-6)" />
                  </Span>
                ) : (
                  <Div title={t("Sound")} style={styles.videoContainer.style}>
                    {needsReview ? (
                      <Span data-testid="chat-accept-button">
                        <CircleCheck size={30} color="var(--accent-6)" />
                      </Span>
                    ) : (
                      <>
                        <Video
                          // onLoadedData={() => setIsVideoLoading(false)}
                          // ref={videoRef}
                          src={`${FRONTEND_URL}/video/blob.mp4`}
                          style={styles.video.style}
                          loop
                          autoPlay
                          muted
                          playsInline
                        />
                      </>
                    )}
                  </Div>
                )}
              </Button>
            )}
          </>
        )}
      </>
    )
  }

  return (
    <Div key={chatKey}>
      {isAgentModalOpen && (
        <Div style={styles.modalContent.style}>
          {getFilteredAgents(true)?.map((agent) => (
            <Div
              style={{ ...styles.agentModal.style, gap: 12.5 }}
              key={agent.id}
            >
              <Div style={{ ...styles.agentButtonContainer.style }}>
                {(user || guest)?.favouriteAgent === agent.name ? (
                  <Span style={styles.stateLabel.style}>
                    <Star
                      color="var(--accent-1)"
                      fill="var(--accent-1)"
                      size={17}
                    />
                  </Span>
                ) : (
                  <Button
                    title={t("Set as favorite")}
                    className="favorite link"
                    onClick={async () => {
                      addHapticFeedback()
                      user &&
                        setUser({
                          ...user,
                          favouriteAgent: agent.name,
                        })
                      guest &&
                        setGuest({
                          ...guest,
                          favouriteAgent: agent.name,
                        })

                      try {
                        const response = await apiFetch(
                          `${API_URL}/${user ? "user" : "guest"}`,
                          {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              favouriteAgent: agent.name,
                            }),
                          },
                        )
                        const data = await response.json()

                        if (!response.ok || data.error) {
                          toast.error(
                            data.error || t("Error updating username"),
                          )
                        }
                      } catch (_error) {
                        toast.error(t("Error updating favorite agent"))
                      } finally {
                      }
                    }}
                  >
                    <Star color="var(--accent-1)" strokeWidth={1.5} size={17} />
                  </Button>
                )}
                <WatermelonButton
                  size={20}
                  style={{
                    fontSize: "0.75rem",
                  }}
                />
                {agent.authorization === "user" &&
                !user &&
                !guest?.subscription &&
                agent.state === "active" ? (
                  <Span style={styles.stateLabel.style}>
                    <Button
                      onClick={() => {
                        addHapticFeedback()
                        // setIsAgentModalOpen(false)

                        addParams({
                          subscribe: "true",
                          plan: "member",
                        })
                      }}
                      className="link"
                      style={styles.loginButton.style}
                    >
                      <LogIn color="var(--accent-6)" size={14} /> {t("Login")}
                    </Button>
                  </Span>
                ) : (
                  <>
                    {agent.state === "active" && (
                      <Span style={styles.stateLabelContainer.style}>
                        <Span
                          style={{
                            ...styles.creditCost.style,
                            display:
                              viewPortWidth > 400 ? "inline-flex" : "none",
                          }}
                        >
                          <Coins size={15} color="var(--accent-1)" />
                          {t("credits", {
                            count: Number(agent.creditCost),
                          })}
                        </Span>
                        <Span style={styles.stateLabel.style}>
                          <CircleCheck
                            color={
                              agent.name === selectedAgent?.name
                                ? "var(--accent-4)"
                                : "var(--accent-5)"
                            }
                            size={14}
                          />{" "}
                          {t(
                            agent.name === selectedAgent?.name
                              ? "Current"
                              : "Active",
                          )}
                        </Span>
                      </Span>
                    )}
                    {agent.state === "testing" && (
                      <Span style={styles.stateLabel.style}>
                        <Info color="var(--accent-1)" size={14} />{" "}
                        {t("In testing")}
                      </Span>
                    )}
                    {agent.state === "inactive" && (
                      <Span style={styles.stateLabel.style}>
                        <Info size={14} /> {t("Soon")}
                      </Span>
                    )}
                  </>
                )}
              </Div>
              <Div
                style={{
                  ...styles.agentButtonContainer.style,
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <Button
                  data-agent-name={agent.name}
                  data-testid={`agent-modal-button-${agent.name}`}
                  className={clsx(
                    `inverted medium ${
                      agent.authorization === "user" &&
                      !user &&
                      !guest?.subscription
                    }`,
                  )}
                  style={{
                    ...styles.agentButtonModal.style,
                    ...((user || guest)?.favouriteAgent === agent.name
                      ? styles.favorite.style
                      : agent.name === selectedAgent?.name
                        ? styles.current.style
                        : undefined),
                    ...utilities.inverted.style,
                    ...utilities.small.style,
                  }}
                  onClick={() => {
                    addHapticFeedback()
                    if (agent.state !== "active") {
                      return
                    }
                    if (
                      agent.authorization === "user" &&
                      !user &&
                      !guest?.subscription
                    ) {
                      addParams({
                        subscribe: "true",
                        plan: "member",
                      })

                      return
                    }
                    isDebateAgentModalOpen
                      ? setDebateAgent(agent)
                      : setSelectedAgent(agent)
                    setIsAgentModalOpen(false)
                    setIsDebateAgentModalOpen(false)

                    if (attempt === "webSearch") {
                      setIsWebSearchEnabled(true)
                      setAttempt(undefined)
                    } else if (attempt === "submit" || attempt === "debate") {
                      setShouldSubmit(true)
                    }
                  }}
                >
                  {agent.name === "deepSeek" ? (
                    <DeepSeek size={18} />
                  ) : agent.name === "chatGPT" ? (
                    <OpenAI size={18} />
                  ) : agent.name === "claude" ? (
                    <Claude size={18} />
                  ) : agent.name === "gemini" ? (
                    <Gemini size={18} />
                  ) : agent.name === "flux" ? (
                    <Flux size={18} />
                  ) : agent.name === "perplexity" ? (
                    <Perplexity size={18} />
                  ) : agent.name === "sushi" ? (
                    <Img icon="sushi" size={18} />
                  ) : agent.name === "grok" ? (
                    <Grok size={18} />
                  ) : agent.name === "peach" ? (
                    <Img icon="peach" size={18} />
                  ) : agent.name === "free" ? (
                    <OpenRouter size={18} />
                  ) : null}{" "}
                  {t("Try {{name}} now", { name: agent.displayName })}{" "}
                  <ArrowRight size={14} />
                </Button>
              </Div>

              {agent.description && (
                <Div style={styles.agentModalDescription.style}>
                  <Span style={styles.capabilitiesLabel.style}>
                    {Object.entries(agent.capabilities).map(([key, value]) => {
                      return (
                        <Span
                          title={`${value ? "✅" : "❌"} ${key === "pdf" ? "PDF" : t(capitalizeFirstLetter(key))}`}
                          key={key}
                          style={styles.stateLabel.style}
                        >
                          {(key === "text" && (
                            <TextIcon
                              color={
                                value ? `var(--accent-6)` : `var(--shade-3)`
                              }
                              size={14}
                            />
                          )) ||
                            (key === "pdf" && (
                              <FileText
                                color={
                                  value ? `var(--accent-6)` : `var(--shade-3)`
                                }
                                size={14}
                              />
                            )) ||
                            (key === "webSearch" && (
                              <>
                                {value ? (
                                  <Button
                                    className="link"
                                    onClick={() => {
                                      setIsWebSearchEnabled(true)
                                      setSelectedAgent(agent)
                                      setIsAgentModalOpen(false)
                                    }}
                                    style={{
                                      fontSize: 14,
                                    }}
                                  >
                                    <Globe
                                      color={`var(--accent-6)`}
                                      size={14}
                                    />
                                  </Button>
                                ) : (
                                  <GlobeLock
                                    color={`var(--shade-3)`}
                                    size={14}
                                  />
                                )}
                              </>
                            )) ||
                            (key === "image" && (
                              <ImageIcon
                                color={
                                  value ? `var(--accent-6)` : `var(--shade-3)`
                                }
                                size={14}
                              />
                            )) ||
                            (key === "imageGeneration" && (
                              <>
                                {value ? (
                                  <Button
                                    className="link"
                                    onClick={() => {
                                      setIsImageGenerationEnabled(true)
                                      setSelectedAgent(agent)
                                      setIsAgentModalOpen(false)
                                    }}
                                    style={{
                                      fontSize: 14,
                                    }}
                                  >
                                    🎨
                                  </Button>
                                ) : (
                                  <Palette color={`var(--shade-3)`} size={14} />
                                )}
                              </>
                            )) ||
                            (key === "audio" && (
                              <AudioLines
                                color={
                                  value ? `var(--accent-6)` : `var(--shade-3)`
                                }
                                size={14}
                              />
                            )) ||
                            (key === "video" && (
                              <VideoIcon
                                color={
                                  value ? `var(--accent-6)` : `var(--shade-3)`
                                }
                                size={14}
                              />
                            ))}
                        </Span>
                      )
                    })}
                  </Span>

                  <>{t(agent.description)} </>
                </Div>
              )}
            </Div>
          ))}
          <Div
            style={{
              display: "flex",
              gap: "0.5rem",
              fontSize: "0.8rem",
              color: COLORS.blue,
              flexWrap: "wrap",
              alignItems: "center",
              marginTop: ".5rem",
              justifyContent: "center",
            }}
          >
            {showAgentDetails &&
              getFilteredAgents()?.map((agent) => (
                <Button
                  key={agent.name}
                  className={
                    agent.name !== selectedAgent?.name
                      ? "transparent"
                      : "inverted"
                  }
                  data-agent-name={agent.name}
                  style={{
                    ...((user || guest)?.favouriteAgent === agent.name
                      ? { borderColor: COLORS.orange }
                      : agent.name === selectedAgent?.name ||
                          showAgentDetails === agent.name
                        ? { borderColor: "var(--accent-4)" }
                        : undefined),
                  }}
                  onClick={() => {
                    setShowAgentDetails(agent.name)
                  }}
                >
                  {agent.name === "deepSeek" ? (
                    <DeepSeek color={COLORS.blue} size={18} />
                  ) : agent.name === "chatGPT" ? (
                    <OpenAI size={18} />
                  ) : agent.name === "claude" ? (
                    <Claude color={COLORS.orange} size={18} />
                  ) : agent.name === "gemini" ? (
                    <Gemini color={COLORS.purple} size={18} />
                  ) : agent.name === "flux" ? (
                    <Flux size={18} />
                  ) : agent.name === "perplexity" ? (
                    <Perplexity color={COLORS.blue} size={18} />
                  ) : agent.name === "sushi" ? (
                    <Img icon="sushi" size={18} />
                  ) : agent.name === "grok" ? (
                    <Grok size={18} />
                  ) : agent.name === "peach" ? (
                    <Img icon="peach" size={18} />
                  ) : agent.name === "free" ? (
                    <OpenRouter size={18} />
                  ) : null}{" "}
                  {agent.displayName}
                </Button>
              ))}
          </Div>
        </Div>
      )}
    </Div>
  )
}

"use client"

import type React from "react"
import { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import CharacterProfile from "./CharacterProfile"
import { useAppContext } from "./context/AppContext"
import {
  useApp,
  useAuth,
  useChat,
  useNavigationContext,
} from "./context/providers"
import { useStyles } from "./context/StylesContext"
import { useThreadPresence } from "./hooks/useThreadPresence"
import { useUserScroll } from "./hooks/useUserScroll"
import { useWebSocket } from "./hooks/useWebSocket"
import Img from "./Image"
import { CircleX, Loader } from "./icons"
import Loading from "./Loading"
import Message from "./Message"
import { useMessagesStyles } from "./Messages.styles"
import { Button, Div, useTheme, Video } from "./platform"
import type {
  aiAgent,
  characterProfile,
  guest,
  message,
  thread,
  threadSummary,
  user,
} from "./types"
import { isOwner } from "./utils"
import { ANALYTICS_EVENTS } from "./utils/analyticsEvents"

export default forwardRef<
  HTMLDivElement,
  {
    showEmptyState?: boolean
    emptyMessage?: string | React.ReactNode
    className?: string
    messages?: Array<{
      message: message & {
        isStreaming?: boolean
        isStreamingStop?: boolean
      }
      user?: user
      guest?: guest
      aiAgent?: aiAgent
      thread?: thread & {
        characterProfile?: characterProfile
        summary?: threadSummary
      }
    }>
    isLoading?: boolean
    isHome?: boolean
    onPlayAudio?: () => void
    nextPage?: number
    setIsLoadingMore?: (isLoadingMore: boolean) => void
    setUntil?: (until: number) => void
    until?: number
    id?: string
    onDelete?: ({ id }: { id: string }) => Promise<void>
    onToggleLike?: (liked: boolean | undefined) => void
    thread?: thread & {
      characterProfile?: characterProfile
    }
    onCharacterProfileUpdate?: () => void
    style?: React.CSSProperties
    isMobileDevice?: boolean
    Top?: React.ReactNode
  }
>(function Messages(
  {
    emptyMessage,
    className,
    showEmptyState,
    messages,
    setIsLoadingMore,
    setUntil,
    until,
    nextPage,
    id,
    onDelete,
    onToggleLike,
    onPlayAudio,
    thread,
    isHome,
    onCharacterProfileUpdate,
    style,
    isLoading,
    isMobileDevice,
    Top,
  },
  ref,
) {
  const styles = useMessagesStyles()
  const { utilities } = useStyles()
  // Split contexts for better organization
  const { t } = useAppContext()

  // Auth context
  const {
    characterProfilesEnabled,
    token,
    deviceId,
    user,
    guest,
    setShowCharacterProfiles,
    FRONTEND_URL,
    burn,
    app,
    chrry,
    accountApp,
    plausible,
    isPear,
    ...auth
  } = useAuth()

  // Chat context
  const { scrollToBottom, creditsLeft } = useChat()

  const threadId = auth.threadId || auth.threadIdRef.current

  const { typingUsers, onlineUsers } = useThreadPresence({
    threadId,
  })

  // Navigation context (router is the wrapper)
  const { router } = useNavigationContext()

  // App context
  const { appStatus, setAppStatus, suggestSaveApp } = useApp()

  // Theme context
  const { addHapticFeedback } = useTheme()

  const [isUpdating, setIsUpdating] = useState(false)

  const [loadingCharacterProfile, setLoadingCharacterProfile] = useState<
    characterProfile | undefined
  >()

  const [characterProfile, setCharacterProfile] = useState<
    characterProfile | undefined
  >(thread?.characterProfile)

  // Memoize deps to prevent reconnection loop
  const webSocketDeps = useMemo(() => [threadId], [threadId])

  useWebSocket<{
    type: string
    data: characterProfile
  }>({
    onMessage: async ({ type, data }) => {
      if (type === "character_tag_created") {
        if (data?.threadId !== threadId) return
        onCharacterProfileUpdate?.()

        setCharacterProfile(data)
        setLoadingCharacterProfile(undefined)

        plausible({
          name: ANALYTICS_EVENTS.CHARACTER_TAG_CREATED,
        })
      }
      if (type === "character_tag_creating") {
        onCharacterProfileUpdate?.()
        setLoadingCharacterProfile(data)
      }
    },
    token,
    deviceId,
    deps: webSocketDeps,
  })

  const { isUserScrolling, hasStoppedScrolling, resetScrollState } =
    useUserScroll()

  // Track if we've already scrolled for this character profile loading session
  const hasScrolledForLoadingRef = useRef(false)

  useEffect(() => {
    setCharacterProfile(thread?.characterProfile)
  }, [thread?.characterProfile])

  const sortedMessages = useMemo(() => {
    // ⚡ Bolt: Memoize sorted messages to prevent re-sorting on every render
    // and avoid mutating the messages prop.
    return [...(messages || [])].sort(
      (a, b) =>
        new Date(a.message.createdOn).getTime() -
        new Date(b.message.createdOn).getTime(),
    )
  }, [messages])

  // Optimize lookups with Sets
  const typingUserIds = useMemo(
    () => new Set(typingUsers.map((u) => u.userId).filter(Boolean)),
    [typingUsers],
  )
  const typingGuestIds = useMemo(
    () => new Set(typingUsers.map((u) => u.guestId).filter(Boolean)),
    [typingUsers],
  )
  const onlineUserIds = useMemo(
    () => new Set(onlineUsers.map((u) => u.userId).filter(Boolean)),
    [onlineUsers],
  )
  const onlineGuestIds = useMemo(
    () => new Set(onlineUsers.map((u) => u.guestId).filter(Boolean)),
    [onlineUsers],
  )

  const isStreaming = messages?.some(
    (message) => message.message.isStreaming === true,
  )

  const showLoadingCharacterProfile =
    !burn &&
    threadId &&
    !isStreaming &&
    characterProfilesEnabled &&
    loadingCharacterProfile?.threadId === threadId

  // Reset scroll tracking when loading starts
  useEffect(() => {
    if (showLoadingCharacterProfile) {
      hasScrolledForLoadingRef.current = false
    }
  }, [showLoadingCharacterProfile])

  // Only scroll once when loading starts, don't interrupt user scroll
  useEffect(() => {
    if (
      showLoadingCharacterProfile &&
      !hasScrolledForLoadingRef.current &&
      !isUserScrolling &&
      !hasStoppedScrolling
    ) {
      scrollToBottom()
      hasScrolledForLoadingRef.current = true
    }
  }, [showLoadingCharacterProfile, isUserScrolling, hasStoppedScrolling])

  if (!showEmptyState && messages?.length === 0) return null
  return (
    <Div
      style={{
        display: "flex",
        flexDirection: "column",
        marginTop: 20,
        justifyContent: "flex-end",
        // overflowY: "auto",
        ...style,
      }}
      id={id}
      ref={ref}
    >
      {nextPage && (
        <Div style={{ ...styles.loadMoreContainer.style }}>
          <Button
            className="transparent"
            style={{ ...utilities.transparent, ...utilities.xSmall }}
            onClick={() => {
              setIsLoadingMore?.(true)
              setUntil?.((until || 1) + 1)
            }}
          >
            {isLoading ? <Loading size={16} /> : <Loader size={16} />}
            {t("Load Older")}
          </Button>
        </Div>
      )}
      {messages?.length === 0 && showEmptyState && (
        <Div style={{ ...styles.emptyContainer.style }}>
          {emptyMessage || t("Nothing here yet")}
        </Div>
      )}
      <Div style={{ ...styles.messages.style, flex: 1 }}>
        {sortedMessages?.map((message) => {
          const isTyping = !!(
            (message.user?.id && typingUserIds.has(message.user.id)) ||
            (message.guest?.id && typingGuestIds.has(message.guest.id))
          )

          const isOnline = !!(
            (message.user?.id && onlineUserIds.has(message.user.id)) ||
            (message.guest?.id && onlineGuestIds.has(message.guest.id))
          )

          return (
            <Message
              isMobileDevice={isMobileDevice}
              onToggleLike={onToggleLike}
              onDelete={onDelete}
              onPlayAudio={onPlayAudio}
              key={message.message.id}
              message={message}
              isTyping={isTyping}
              isOnline={isOnline}
            />
          )
        })}
      </Div>
      <Div
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          marginTop: "25px",
          marginBottom: "10px",
          gap: 20,
        }}
      >
        {Top ? <Div>{Top}</Div> : null}
        {!burn && messages?.length ? (
          <>
            <Div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              {!characterProfilesEnabled &&
              !isStreaming &&
              messages?.some((message) => !!message.message.agentId) ? (
                <Button
                  data-testid={"enable-character-profiles-from-messages"}
                  disabled={isUpdating}
                  onClick={async () => {
                    setShowCharacterProfiles(true)
                  }}
                  className="inverted"
                  style={{ ...utilities.inverted.style }}
                >
                  {isUpdating ? (
                    <CircleX size={16} color="var(--accent-6)" />
                  ) : (
                    <Img app={app} size={18} />
                  )}
                  {t("Earn a Badge")}
                </Button>
              ) : null}
            </Div>

            {showLoadingCharacterProfile ? (
              <Div
                data-testid={"generating-cp"}
                style={{
                  ...styles.characterProfileContainer.style,
                  flexDirection: "row",
                }}
              >
                <Video
                  style={{ ...styles.video.style }}
                  src={`${FRONTEND_URL}/video/blob.mp4`}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                {t("Generating character tags...")}
              </Div>
            ) : characterProfile &&
              characterProfilesEnabled &&
              (isOwner(characterProfile, {
                userId: user?.id,
                guestId: guest?.id,
              }) ||
                characterProfile.visibility === "public") ? (
              <Div style={{ ...styles.characterProfileContainer.style }}>
                <Div style={{ ...styles.tags.style }}>
                  {characterProfile.tags?.join(", ")}
                </Div>
                <CharacterProfile
                  onCharacterProfileUpdate={() => {
                    onCharacterProfileUpdate?.()
                  }}
                  characterProfile={characterProfile}
                  showActions={true}
                />
              </Div>
            ) : null}
          </>
        ) : null}
      </Div>
    </Div>
  )
})

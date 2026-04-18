"use client"

import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { useAppContext } from "./context/AppContext"
import { useAuth, useChat, useNavigationContext } from "./context/providers"
import { useStyles } from "./context/StylesContext"
import { useHasHydrated, useThreadMetadata } from "./hooks"
import { WannathisIcon } from "./icons"
import Loading from "./Loading"
import MemoryConsent from "./MemoryConsent"
import { A, Div, usePlatform, useTheme } from "./platform"
import Skeleton from "./Skeleton"
import { BREAKPOINTS } from "./styles/breakpoints"
import { useThreadStyles } from "./Thread.styles"
// import Ticker from "./Ticker"
import type { paginatedMessages, thread } from "./types"
import { isCollaborator, isOwner } from "./utils"
import { ANALYTICS_EVENTS } from "./utils/analyticsEvents"

const Focus = lazy(() => import("./Focus"))
const Tribe = lazy(() => import("./Tribe"))
const HipChat = lazy(() => import("./HipChat"))

const Thread = ({
  isHome,
}: {
  isHome?: boolean
  threadId?: string

  threadData?: { thread: thread; messages: paginatedMessages }
}) => {
  // Initialize unified styles hook
  const styles = useThreadStyles()

  // Split contexts for better organization
  const { t } = useAppContext()

  // Auth context
  const { user, guest, plausible, threadIdRef, app, minimize, apps, ...auth } =
    useAuth()

  const threadId = auth.threadId || threadIdRef.current

  // Chat context
  const {
    setSelectedAgent,
    aiAgents,
    debateAgent,
    thread,
    messages,
    setMessages: setMessagesInternal,
    isChatFloating,
    refetchThread,
    scrollToBottom,
    isEmpty,
    ...chat
  } = useChat()

  const showTribe = !!chat.showTribe

  const hasHydrated = useHasHydrated()

  const showFocus = auth.showFocus && isEmpty && hasHydrated

  const { isIDE, isStandalone, viewPortWidth } = usePlatform()

  // Navigation context
  const { collaborationStatus } = useNavigationContext()

  // Use setMessagesInternal directly instead of wrapping it
  const setMessages = setMessagesInternal

  const { isMobileDevice, isSmallDevice } = useTheme()

  // Update thread metadata dynamically
  useThreadMetadata(thread)

  // Derived from thread

  const id = threadId

  // plausible if we've already auto-selected an agent for this thread

  const refetch = () => {
    return refetchThread()
  }

  // ⚡ Bolt: Stable callbacks for Messages component to prevent re-renders
  const isChatFloatingRef = useRef(isChatFloating)
  isChatFloatingRef.current = isChatFloating

  const scrollToBottomRef = useRef(scrollToBottom)
  scrollToBottomRef.current = scrollToBottom

  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  const setMessagesRef = useRef(setMessages)
  setMessagesRef.current = setMessages

  const currentMessagesRef = useRef(messages)
  currentMessagesRef.current = messages

  // plausible last processed threadData to prevent re-processing
  // const lastProcessedThreadDataRef = useRef<any>(null)

  // Smart auto-scroll: only scroll for short responses

  const isPendingCollaboration = thread?.collaborations?.some(
    (collaboration) =>
      collaboration.user.id === user?.id &&
      collaboration.collaboration.status !== "active",
  )

  const collaborator = thread && isCollaborator(thread, user?.id)
  const activeCollaborator =
    thread && isCollaborator(thread, user?.id, "active")

  const [autoSelectedAgent, setAutoSelectedAgent] = useState<boolean>(false)

  useEffect(() => {
    if (thread?.collaborations?.length) {
      plausible({
        name: ANALYTICS_EVENTS.COLLABORATION,
        props: {
          collaborator,
          isOwner: isOwner(thread, {
            userId: user?.id,
            guestId: guest?.id,
          }),
          activeCollaborator,
          collaborationStatus,
          isPendingCollaboration,
          collaborationsCount: thread?.collaborations?.length,
        },
      })
    }
  }, [
    collaborationStatus,
    collaborator,
    activeCollaborator,
    isPendingCollaboration,
    thread?.collaborations?.length,
    user?.id,
    guest?.id,
  ])
  // aiAgents excluded to prevent loop, setSelectedAgent is stable

  const { utilities } = useStyles()

  const render = () => {
    return (
      <Div
        data-thread-title={thread?.title}
        data-testid={id ? "thread" : isHome ? "home" : undefined}
        style={{
          ...{
            maxWidth: 600,
            marginTop: 5,
            marginRight: "auto",
            marginBottom: 0,
            marginLeft: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 15,
            padding: "0 10px 195px 10px",
            width: "100%",
          },
          ...(isEmpty
            ? !threadId &&
              hasHydrated && {
                ...styles.threadEmpty.style,
                zIndex: 10,
                paddingBottom:
                  minimize && !showFocus && !showTribe
                    ? 0
                    : isStandalone
                      ? 200
                      : 195,
              }
            : { paddingBottom: threadId ? 155 : undefined }),
          position: "relative",
          maxWidth: isSmallDevice ? BREAKPOINTS.tablet : BREAKPOINTS.desktop,
          marginBottom: isIDE ? 50 : undefined,
          flex: 1,
        }}
      >
        {viewPortWidth >= 1400 && (
          <A
            onClick={() => {
              plausible({
                name: ANALYTICS_EVENTS.WANNATHIS,
                props: {
                  app: app?.name,
                },
              })
            }}
            href="https://wannathis.one?via=iliyan"
            target="_blank"
            rel="noopener noreferrer"
            className="transparent"
            style={{
              ...utilities.button.style,
              ...utilities.small.style,
              ...utilities.transparent.style,
              position: "fixed",
              bottom: 15,
              right: 15,
              fontSize: "0.8rem",
            }}
          >
            <WannathisIcon /> Wannathis
          </A>
        )}
        <HipChat
          // dataTestId={
          //   threadId && !isEmpty ? "thread-instruction" : "home-instruction"
          // }
          isMobileDevice={isMobileDevice}
          hipchat={false}
          compactMode={showFocus || showTribe}
          showSuggestions={!showFocus && !showTribe && isEmpty}
          showMessages={!showFocus && !showTribe && !isEmpty}
          messagesStyle={{
            margin: "0 -10px",
          }}
        />
      </Div>
    )
  }

  // Only load Focus on web (not extension) and after hydration
  // Show Tribe for chrry app or /tribe routes

  return showFocus ? (
    <Suspense fallback={<Loading fullScreen />}>
      <Focus>{render()}</Focus>
    </Suspense>
  ) : (
    <Suspense fallback={<Loading fullScreen />}>
      <Skeleton>
        <Tribe>
          {!showTribe && <MemoryConsent />}
          {render()}
        </Tribe>
      </Skeleton>
    </Suspense>
  )
}

export default Thread

"use client"

import type React from "react"
import {
  lazy,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { FaGithub } from "react-icons/fa"
import { SiBluesky, SiBuymeacoffee } from "react-icons/si"
import A from "./a/A"
import { COLORS, useAppContext } from "./context/AppContext"
import {
  useApp,
  useAuth,
  useChat,
  useNavigationContext,
  useTribe,
} from "./context/providers"
import { useStyles } from "./context/StylesContext"
import FocusButtonMini from "./FocusButtonMini"

const Hippo = lazy(() => import("./Hippo"))
const Grapes = lazy(() => import("./Grapes"))

import { useTribeMetadata, useTribePostMetadata } from "./hooks"
import Img from "./Image"
import LanguageSwitcher from "./LanguageSwitcher"
import { defaultLocale } from "./locales"
import Markdown from "./MarkdownContent.web"
import {
  Button,
  Div,
  H1,
  H2,
  H3,
  H4,
  MotiView,
  P,
  Span,
  Strong,
  toast,
  useInView,
  usePlatform,
  useTheme,
  Video,
} from "./platform"
import Search from "./Search"
import Ticker from "./Ticker"
import ToggleAgent from "./ToggleAgent"
import Tools from "./Tools"
import { useTribeStyles } from "./Tribe.styles"
import TribeTranslate from "./TribeTranslate"
import type { sushi, tribePost, user } from "./types"
import { apiFetch, FRONTEND_URL } from "./utils"
import isOwner from "./utils/isOwner"
import Weather from "./Weather"

const FocusButton = FocusButtonMini

import { Trans } from "react-i18next"
import AppLink from "./AppLink"
import Checkbox from "./Checkbox"
import ConfirmButton from "./ConfirmButton"

import {
  ArrowLeft,
  BrickWallFire,
  CalendarIcon,
  CircleCheck,
  CircleX,
  HeartPlus,
  LoaderCircle,
  Settings2,
  Sparkles,
  Trash2,
} from "./icons"
import Loading from "./Loading"
import TribePost from "./TribePost"
import { ANALYTICS_EVENTS } from "./utils/analyticsEvents"

const TribePostListItem = ({
  post,
  index,
  reduceMotion,
  isDark,
  isMobileDevice,
  isSmallDevice,
  viewPortWidth,
  t,
  timeAgo,
  toggleLike,
  isTogglingLike,
  tryAppCharacterProfile,
  setTryAppCharacterProfile,
  tyingToReact,
  setTyingToReact,
  owner,
  user,
  deletePost,
  accountApp,
  setSignInPart,
  setAppStatus,
  tags,
  setTags,
  postsRef,
  addParams,
  push,
}: {
  post: tribePost
  index: number
  reduceMotion: boolean
  isDark: boolean
  isMobileDevice: boolean
  isSmallDevice: boolean
  viewPortWidth: number
  t: (key: string, options?: any) => string
  timeAgo: (date: Date | string) => string
  toggleLike?: (postId: string) => Promise<{
    liked: boolean
  }>
  isTogglingLike: string | undefined
  tryAppCharacterProfile: string | undefined
  setTryAppCharacterProfile: (id: string | undefined) => void
  tyingToReact: string | undefined
  setTyingToReact: (id: string | undefined) => void
  owner: boolean
  user?: user
  deletePost: (postId: string) => Promise<void>
  accountApp?: sushi
  addParams: (params: any) => void
  setSignInPart: (
    part: "register" | "credentials" | "login" | undefined,
  ) => void
  setAppStatus: (status: any) => void
  tags: string[]
  setTags: (tags: string[]) => void
  postsRef: RefObject<HTMLDivElement | null>
  push: (to: string) => void
  downloadImage: (imageUrl: string, imageName?: string) => Promise<void>
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  })

  const TRAIN = owner ? `Train {{name}}` : `Try {{name}}`
  const { getRadius } = useTheme()
  const { setLanguage, rtl, isP } = useAuth()

  const { utilities } = useStyles()

  return (
    <MotiView
      key={`moti-${post.id}`}
      from={{ opacity: 0, translateY: 0, translateX: -10 }}
      animate={{ opacity: 1, translateY: 0, translateX: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 150,
        delay: reduceMotion ? 0 : index * 50,
      }}
    >
      <Div
        ref={inViewRef}
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          background: isDark ? "var(--shade-2)" : "var(--shade-1)",
          borderRadius: getRadius(20),
          border: isDark
            ? "1px solid var(--shade-3)"
            : "1px solid var(--shade-2-transparent)",
        }}
      >
        <Div
          style={{
            display: "flex",
            gap: 5,
            alignItems: "center",
            fontSize: ".9rem",
          }}
        >
          <AppLink
            isTribe
            app={post.app}
            icon={<Img app={post.app} />}
            loading={<Loading size={18} />}
          >
            {post.app?.name}
          </AppLink>
          <A
            href={`/t/${post.tribe?.slug || "general"}`}
            style={{
              marginLeft: rtl ? undefined : "auto",
              marginRight: !rtl ? undefined : "auto",
              fontSize: ".8rem",
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              display: "flex",
            }}
          >
            <Img size={16} slug={"tribe"} />
            {`/${t(post.tribe?.slug || "general")}`}
          </A>
        </Div>
        <Ticker
          app={post.app}
          style={{
            marginTop: "1rem",
            marginBottom: "0rem",
            color: COLORS[post.app?.themeColor as keyof typeof COLORS],
          }}
          showControls
        />

        <H4
          style={{
            margin: 0,
            padding: 0,
          }}
        >
          <AppLink
            app={post.app}
            href={`/p/${post.id}`}
            style={{
              marginTop: 10,
              fontSize: "1.1rem",
              lineHeight: "1.5",
            }}
          >
            {post.title}
          </AppLink>
        </H4>
        <Div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "flex-start",
            marginTop: 12.5,
            flexDirection: !isSmallDevice ? "row" : "column",
          }}
        >
          {post.images && post.images.length > 0 && post?.images[0]?.url && (
            <A
              href={`/p/${post.id}`}
              style={{
                position: "relative",
                width:
                  viewPortWidth < 500 ? "100%" : isMobileDevice ? 300 : 200,
                height:
                  viewPortWidth < 500 ? "auto" : isMobileDevice ? 300 : 200,
              }}
            >
              <Img
                alt={post.images[0].title}
                width={
                  viewPortWidth < 500 ? "100%" : isMobileDevice ? 300 : 200
                }
                height={
                  viewPortWidth < 500 ? "auto" : isMobileDevice ? 300 : 200
                }
                style={{
                  borderRadius: "15px",
                  width:
                    viewPortWidth < 500 ? "100%" : isMobileDevice ? 300 : 200,
                  height:
                    viewPortWidth < 500 ? "auto" : isMobileDevice ? 300 : 200,
                }}
                src={post.images[0].url ?? undefined}
              />{" "}
            </A>
          )}
          {post?.videos?.[0]?.url?.includes("hippo") ? (
            <Div
              style={{
                position: "relative",
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Video
                playing={!reduceMotion && inView}
                playsInline
                autoPlay={!reduceMotion}
                muted
                loop
                style={{
                  borderRadius: "15px",
                  maxWidth: isMobileDevice ? "100%" : undefined,
                }}
                width={
                  viewPortWidth < 500 ? "100%" : isMobileDevice ? 375 : 275
                }
                height={"auto"}
                controls={isMobileDevice || isHovered}
                src={post?.videos?.[0]?.url}
              />
            </Div>
          ) : (
            post?.videos?.[0]?.url && (
              <Img
                alt={post.videos[0].title}
                width={
                  viewPortWidth < 500 ? "100%" : isMobileDevice ? 300 : 200
                }
                height={
                  viewPortWidth < 500 ? "auto" : isMobileDevice ? 300 : 200
                }
                style={{
                  borderRadius: "15px",
                  width:
                    viewPortWidth < 500 ? "100%" : isMobileDevice ? 300 : 200,
                  height:
                    viewPortWidth < 500 ? "auto" : isMobileDevice ? 300 : 200,
                }}
              />
            )
          )}

          <Markdown
            style={{
              fontSize: "0.95rem",
              color: "var(--shade-7)",
              lineHeight: "1.5",
              marginTop: 0,
            }}
            content={
              post.content.length > 300 && isSmallDevice
                ? `${post.content.slice(0, isMobileDevice ? 300 : 400)}...`
                : post.content.length > 475
                  ? `${post.content.slice(0, 475)}...`
                  : post.content
            }
          />
        </Div>
        <Div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: ".75rem",
            marginTop: "0.75rem",
          }}
        >
          <Div
            style={{
              display: "flex",
              gap: "0.5rem",
              fontSize: ".9rem",
              color: "var(--shade-6)",
            }}
          >
            {post.comments && post.comments.length > 0 && (
              <A
                href={`/p/${post.id}`}
                style={{
                  gap: "0.25rem",
                  fontSize: ".9rem",
                  color: "var(--shade-6)",
                }}
              >
                <Img
                  slug={post.comments[post.comments.length - 1]?.app?.slug}
                  size={20}
                />
                {post.comments.length}{" "}
                {t(post.comments.length === 1 ? "comment" : "comments")}
              </A>
            )}
            <Button
              className="transparent"
              onClick={async () => {
                await toggleLike?.(post.id)
              }}
              style={{
                ...utilities.transparent.style,
                ...utilities.small.style,
              }}
            >
              {isTogglingLike === post.id ? (
                <Loading size={18} />
              ) : (
                <Img icon="heart" width={18} height={18} />
              )}
              <Span>{post.likesCount || 0}</Span>
            </Button>

            <Div
              style={{
                marginLeft: rtl ? undefined : "auto",
                marginRight: !rtl ? undefined : "auto",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Span>{timeAgo(post.createdOn)}</Span>
            </Div>
          </Div>
          <Div
            style={{
              display: "flex",
              gap: ".5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {post.app?.characterProfile && (
              <Div
                style={{
                  fontSize: "12px",
                  color: "#888",
                  display: "flex",
                  gap: ".5rem",
                }}
              >
                <Button
                  className="inverted"
                  style={{
                    ...utilities.inverted.style,
                    ...utilities.small.style,
                    fontSize: ".8rem",
                  }}
                  onClick={() => {
                    if (tryAppCharacterProfile === post.id) {
                      setTryAppCharacterProfile(undefined)
                    } else {
                      setTryAppCharacterProfile(post.id)
                    }
                  }}
                >
                  <Sparkles
                    size={16}
                    color="var(--accent-1)"
                    fill="var(--accent-1)"
                  />
                  {post.app?.characterProfile.name}
                </Button>
              </Div>
            )}
            {post.reactions && post.reactions.length > 0 && (
              <Div
                style={{
                  display: "flex",
                  gap: "0.2rem",
                  flexWrap: "wrap",
                }}
              >
                {Object.entries(
                  post.reactions.reduce(
                    (acc: any, r: any) => {
                      const emoji = r.emoji
                      acc[emoji] = (acc[emoji] || 0) + 1
                      return acc
                    },
                    {} as Record<string, number>,
                  ),
                ).map(([emoji, count]: any) => (
                  <Button
                    className="transparent"
                    key={`${emoji}`}
                    onClick={() => {
                      if (tyingToReact === post.id) {
                        return
                      } else {
                        setTyingToReact(post.id)
                      }
                    }}
                    style={{
                      ...utilities.transparent.style,
                      ...utilities.small.style,
                    }}
                  >
                    {emoji} {count}
                  </Button>
                ))}
              </Div>
            )}

            {post.app.blueskyHandle && (
              <A
                event={ANALYTICS_EVENTS.BLUE_SKY_CLICK}
                openInNewTab
                href={`https://bsky.app/profile/${post.app.blueskyHandle}`}
                style={{
                  fontSize: "13px",
                  marginLeft: rtl ? undefined : ".25rem",
                  marginRight: !rtl ? undefined : ".25rem",
                }}
              >
                <SiBluesky size={18} /> {t("Bluesky")}
              </A>
            )}

            {post.app && (
              <Div
                style={{
                  marginLeft: rtl ? undefined : "auto",
                  marginRight: !rtl ? undefined : "auto",
                }}
              >
                {(owner || user?.role === "admin") && (
                  <ConfirmButton
                    className="link"
                    onConfirm={async () => {
                      await deletePost(post.id)
                    }}
                    style={{
                      ...utilities.button.style,
                      ...utilities.link.style,
                      ...utilities.small.style,
                    }}
                    aria-label="Delete post"
                  >
                    <Trash2 size={16} />
                  </ConfirmButton>
                )}
                <AppLink
                  className="transparent button"
                  app={post.app}
                  style={{
                    ...utilities.transparent.style,
                    ...utilities.small.style,
                  }}
                  isTribe={false}
                  loading={<Loading size={16} />}
                  icon={<Img app={post.app} width={18} height={18} />}
                >
                  {t(TRAIN, {
                    name: post.app?.name,
                  })}
                </AppLink>
              </Div>
            )}

            {owner ? (
              <TribeTranslate
                type="post"
                id={post.id}
                appName={post.app.name}
                contentLength={post.content.length}
                existingLanguages={post.languages ?? []}
              />
            ) : (
              post.languages?.length && (
                <LanguageSwitcher
                  handleSetLanguage={(lan) => {
                    setLanguage(lan)
                    if (lan === defaultLocale) {
                      push(`/p/${post.id}`)
                      return
                    }
                    push(`/${lan}/p/${post.id}`)
                  }}
                  defaults={post.languages}
                />
              )
            )}
          </Div>
          {tryAppCharacterProfile === post.id ? (
            post.app?.characterProfile && (
              <Div
                className="slideUp"
                style={{
                  padding: ".65rem",
                  backgroundColor: "var(--shade-1-transparent)",
                  borderRadius: 15,
                  fontSize: ".85rem",
                  margin: "0 -.25rem",
                  border: "1px solid var(--shade-3)",
                  borderColor:
                    COLORS[post.app?.themeColor as keyof typeof COLORS],
                }}
              >
                <Div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: "1rem",
                  }}
                >
                  <AppLink
                    app={post.app}
                    isTribe
                    icon={
                      <Span style={{ fontSize: "1.3rem" }}>
                        {post.app.icon}
                      </Span>
                    }
                    loading={<Loading size={28} />}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {post.app?.name}
                  </AppLink>
                  {post.app.icon && (
                    <Img
                      style={{
                        marginLeft: rtl ? undefined : "auto",
                        marginRight: !rtl ? undefined : "auto",
                      }}
                      app={post.app}
                    />
                  )}
                </Div>
                {post.app.characterProfile.personality && (
                  <P
                    style={{
                      margin: "0 0 .5rem 0",
                      color: "var(--shade-6)",
                    }}
                  >
                    {post.app.characterProfile.personality}
                  </P>
                )}

                {post.app.characterProfile.traits && (
                  <Div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".5rem",
                      margin: ".5rem 0 0 0",
                    }}
                  >
                    {post.app.characterProfile.traits.expertise &&
                      post.app.characterProfile.traits.expertise.length > 0 && (
                        <Div>
                          <Strong
                            style={{
                              fontSize: ".75rem",
                              color: "var(--shade-5)",
                              textTransform: "uppercase",
                            }}
                          >
                            Expertise
                          </Strong>
                          <Div
                            style={{
                              display: "flex",
                              gap: ".5rem",
                              flexWrap: "wrap",
                              marginTop: ".25rem",
                            }}
                          >
                            {[
                              ...Array.from(
                                new Set(
                                  post.app.characterProfile.traits.expertise,
                                ),
                              ),
                            ].map((item: any, i: number) => (
                              <Span
                                key={`trait-${item}`}
                                style={{
                                  padding: ".25rem .5rem",
                                  backgroundColor: "var(--shade-2)",
                                  borderRadius: 8,
                                  fontSize: ".75rem",
                                }}
                              >
                                {item}
                              </Span>
                            ))}
                          </Div>
                        </Div>
                      )}
                    {post.app.characterProfile.traits.communication &&
                      post.app.characterProfile.traits.communication.length >
                        0 && (
                        <Div>
                          <Strong
                            style={{
                              fontSize: ".75rem",
                              color: "var(--shade-5)",
                              textTransform: "uppercase",
                            }}
                          >
                            Communication Style
                          </Strong>
                          <Div
                            style={{
                              display: "flex",
                              gap: ".5rem",
                              flexWrap: "wrap",
                              marginTop: ".25rem",
                            }}
                          >
                            {[
                              ...Array.from(
                                new Set(
                                  post.app.characterProfile.traits
                                    .communication,
                                ),
                              ),
                            ].map((item: any, i: number) => (
                              <Span
                                key={`trait-${item}`}
                                style={{
                                  padding: ".25rem .5rem",
                                  backgroundColor: "var(--shade-2)",
                                  borderRadius: 8,
                                  fontSize: ".75rem",
                                }}
                              >
                                {item}
                              </Span>
                            ))}
                          </Div>
                        </Div>
                      )}
                    {post.app.characterProfile.traits.behavior &&
                      post.app.characterProfile.traits.behavior.length > 0 && (
                        <Div>
                          <Strong
                            style={{
                              fontSize: ".75rem",
                              color: "var(--shade-5)",
                              textTransform: "uppercase",
                            }}
                          >
                            Behavior
                          </Strong>
                          <Div
                            style={{
                              display: "flex",
                              gap: ".5rem",
                              flexWrap: "wrap",
                              marginTop: ".25rem",
                            }}
                          >
                            {[
                              ...Array.from(
                                new Set(
                                  post.app.characterProfile.traits.behavior,
                                ),
                              ),
                            ].map((item: any, i: number) => (
                              <Span
                                key={item}
                                style={{
                                  padding: ".25rem .5rem",
                                  backgroundColor: "var(--shade-2)",
                                  borderRadius: 8,
                                  fontSize: ".75rem",
                                }}
                              >
                                {item}
                              </Span>
                            ))}
                          </Div>
                        </Div>
                      )}
                  </Div>
                )}
                {post.app.characterProfile.tags &&
                  post.app.characterProfile.tags.length > 0 && (
                    <Div
                      style={{
                        marginTop: "1rem",
                        paddingTop: ".75rem",
                        borderTop: "1px solid var(--shade-2)",
                      }}
                    >
                      <Div
                        style={{
                          display: "flex",
                          gap: ".5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {post.app.characterProfile.tags.map(
                          (tag: string, i: number) => (
                            <Button
                              onClick={() => {
                                if (tags.includes(tag)) {
                                  setTags(
                                    tags.filter(
                                      (tagItem: string) => tagItem !== tag,
                                    ),
                                  )
                                  return
                                }
                                setTags(tags.concat(tag))
                                if (postsRef?.current) {
                                  const y =
                                    postsRef.current.getBoundingClientRect()
                                      .top +
                                    window.scrollY -
                                    80
                                  window.scrollTo({
                                    top: y,
                                    behavior: "smooth",
                                  })
                                }
                              }}
                              key={tag + i}
                              style={{
                                padding: ".25rem .5rem",

                                color: "var(--foreground)",
                                fontSize: ".80rem",
                                ...utilities.inverted.style,
                              }}
                            >
                              # {tag}
                            </Button>
                          ),
                        )}
                      </Div>
                    </Div>
                  )}
              </Div>
            )
          ) : (
            <>
              {post?.app?.characterProfile?.tags &&
                post?.app?.characterProfile.tags.length > 0 && (
                  <Div
                    style={{
                      borderTop: "1px solid var(--shade-2)",
                      paddingTop: ".5rem",
                    }}
                  >
                    <Div
                      style={{
                        display: "flex",
                        gap: ".5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {post?.app?.characterProfile?.tags.map(
                        (tag: string, i: number) => (
                          <Button
                            onClick={() => {
                              if (tags.includes(tag)) {
                                setTags(
                                  tags.filter(
                                    (tagItem: string) => tagItem !== tag,
                                  ),
                                )
                                return
                              }
                              setTags(tags.concat(tag))
                              if (postsRef?.current) {
                                const y =
                                  postsRef.current.getBoundingClientRect().top +
                                  window.scrollY -
                                  80
                                window.scrollTo({
                                  top: y,
                                  behavior: "smooth",
                                })
                              }
                            }}
                            key={tag + i}
                            style={{
                              fontSize: ".80rem",
                              ...utilities.xSmall.style,
                            }}
                          >
                            # {tag}
                          </Button>
                        ),
                      )}
                    </Div>
                  </Div>
                )}
            </>
          )}
          {tyingToReact === post.id && (
            <Div
              className="slideUp"
              style={{
                display: "flex",
                gap: 15,
                padding: "0.75rem 0",
                borderTop: "1px solid var(--shade-2)",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "center",
                paddingBottom: 0,
              }}
            >
              <Div
                style={{
                  fontSize: ".9rem",
                  color: "var(--shade-6)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Img logo={"coder"} size={20} />
                {t(
                  "Reactions and comments are agent only 🤖, you can try like 💛 or share 📱",
                )}
              </Div>

              {!accountApp && (
                <Button
                  onClick={() => {
                    if (!user) {
                      setSignInPart("register")
                      return
                    }
                    setAppStatus({
                      part: "settings",
                      step: "add",
                    })
                  }}
                  className="inverted"
                  style={{
                    ...utilities.inverted.style,
                    ...utilities.small.style,
                  }}
                >
                  <Img size={18} icon="spaceInvader" />
                  {t("Create Your Agent")}
                </Button>
              )}
            </Div>
          )}
        </Div>
      </Div>
    </MotiView>
  )
}

export default function Tribe({ children }: { children?: React.ReactNode }) {
  const {
    tribes,
    tribePosts,
    tribePost,
    setSearch,
    until,
    setUntil,
    isLoadingPosts,
    sortBy,
    order,
    setOrder,
    postId,
    setSortBy,
    isLoadingTribes,
    tribeSlug,
    currentTribe,
    toggleLike,
    isTogglingLike,
    liveReactions,
    pendingPostIds,
    deletePost,
    tags,
    refetchPosts,
    setPendingPostIds,
    posting,
    ...tribeContext
  } = useTribe()

  const [isLoadingTagInternal, setIsLoadingTag] = useState(false)

  const isLoadingTag = isLoadingPosts && isLoadingTagInternal

  const setTags = (val: string[]) => {
    setIsLoadingTag(true)
    tribeContext.setTags(val)
  }

  useEffect(() => {
    if (isLoadingTag || !tags.length) return
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, [isLoadingTag, tags])

  const {
    sushi,
    app,
    loadingApp,
    timeAgo,
    accountApp,
    showTribeProfile,
    user,
    setSignInPart,
    downloadUrl,
    siteConfig,
    getTribeUrl,
    isPear,
    pear,
    plausible,
    setPear,
    chrry,
    burnApp,
    burn,
    setBurn,
    setDisplayedApps,
    displayedApps,
    rtl,
    guest,
    setShowWatermelon,
    hasHydrated,
    isP,
    ...auth
  } = useAuth()
  const { setAppStatus } = useApp()
  const { isExtension, isFirefox, viewPortWidth, os } = usePlatform()

  const [tryAppCharacterProfile, setTryAppCharacterProfile] = useState<
    string | undefined
  >(undefined)

  const isSwarm = true

  const { addParams, push, pathname, searchParams } = useNavigationContext()

  const [tyingToReact, setTyingToReact] = useState<string | undefined>(
    undefined,
  )
  const { t, captureException } = useAppContext()

  useTribePostMetadata(tribePost ?? undefined)
  useTribeMetadata()

  const downloadImage = async (imageUrl: string, imageName?: string) => {
    try {
      const response = await apiFetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = imageName || `vex-image-${Date.now()}.webp`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      captureException(error)
      console.error("Download failed:", error)
      toast.error(t("Failed to download image"))
    }
  }

  const {
    isMobileDevice,
    isSmallDevice,
    isDark,
    reduceMotion,
    isDrawerOpen,
    colorScheme,
    getRadius,
  } = useTheme()
  const { setIsNewChat, showTribe } = useChat()
  const postsRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [newPostsCount, _setNewPostsCount] = useState(0)

  const { utilities } = useStyles()
  const styles = useTribeStyles()

  const owner = isOwner(app, {
    userId: user?.id,
  })

  const subjectApp = showTribeProfile ? app : chrry

  const storeApps =
    subjectApp?.store?.apps?.filter((item) => item.id !== burnApp?.id) || []

  const getStoreApps = ({ style }: { style?: React.CSSProperties } = {}) => {
    return (
      <Div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 15,
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
      >
        {storeApps?.map((item: sushi, i: number) => {
          return (
            <MotiView
              key={`store-app${item.id}`}
              from={{ opacity: 0, translateY: -8, translateX: 0 }}
              animate={{
                opacity: 1,
                translateY: 0,
                translateX: 0,
              }}
              transition={{
                duration: reduceMotion ? 0 : 120,
                delay: reduceMotion ? 0 : i * 35,
              }}
              style={
                {
                  ...{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                    gap: 10,
                    outline: "1px dashed var(--shade-2)",
                    borderRadius: 20,
                    // flex: 1,
                    // ...{
                    //   minWidth: isMobileDevice ? 40 : 80,
                    //   maxWidth: 90,
                    // },
                  },

                  ...(subjectApp?.id === item.id &&
                    !isP &&
                    subjectApp?.id === app?.id && {
                      outline: "3px solid var(--accent-5)",
                      backgroundColor: "var(--shade-1)",
                    }),

                  boxShadow: COLORS[colorScheme as keyof typeof COLORS],
                  borderColor: COLORS[colorScheme as keyof typeof COLORS],
                } as React.CSSProperties
              }
            >
              <AppLink
                isTribe
                loading={<Loading size={30} />}
                icon={
                  <Img
                    app={item}
                    alt={item.name}
                    size={isMobileDevice ? 30 : 40}
                  />
                }
                title={`${item.icon} ${item.subtitle || item.name}`}
                app={item}
                data-color={COLORS[colorScheme as keyof typeof COLORS]}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1rem 1.3rem",
                  flex: 1,
                  position: "relative",
                  maxWidth: 100,
                  minWidth: "max-content",
                  textAlign: "center",
                }}
                className={`pointer ${loadingApp?.id === item.id ? "glow" : ""}`}
              >
                {!isMobileDevice && (
                  <Span
                    style={{
                      fontSize: isMobileDevice ? ".65rem" : ".7rem",
                      color: isP
                        ? COLORS[item.themeColor as keyof typeof COLORS]
                        : "var(--shade-7)",
                      marginTop: ".25rem",
                    }}
                  >
                    {item.name}
                  </Span>
                )}
              </AppLink>
              {item.storeId !== subjectApp?.storeId && (
                <Span
                  style={{
                    position: "absolute",
                    top: 7.5,
                    right: 7.5,
                    fontSize: ".8rem",
                  }}
                >
                  🌀
                </Span>
              )}
            </MotiView>
          )
        })}
      </Div>
    )
  }

  const maxTribes = tribes?.tribes?.slice(0, 25) || []
  const TRAIN = owner ? `Train {{name}}` : `Try {{name}}`

  const back = storeApps.some((item) => item.id === auth?.back?.id)
    ? undefined
    : auth?.back

  // useEffect(() => {
  //   if (auth?.apps?.length > 0) {
  //     setDisplayedApps(auth?.apps)
  //   }
  // }, [auth?.apps])

  useEffect(() => {
    // displayedApps should only reflect CURRENT store's apps (not accumulated auth.apps)
    // This is critical for lastAnchorApp to detect cross-store navigation correctly
    const currentStoreApps = app?.store?.apps || []
    const currentIds = displayedApps
      .map((a) => a.id)
      .sort()
      .join(",")
    const newIds = currentStoreApps
      .map((a) => a.id)
      .sort()
      .join(",")

    if (currentIds !== newIds) {
      setDisplayedApps(currentStoreApps)
    }
  }, [app?.store?.apps])

  const FeedBack = useCallback(
    ({ style }: { style?: React.CSSProperties } = {}) => (
      <>
        {isPear && (
          <Div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isMobileDevice ? "flex-start" : "center",
              gap: 7.5,
              textAlign: isMobileDevice ? "left" : "center",
              marginTop: ".75rem",
              padding: isMobileDevice ? undefined : "0 0.5rem",
              flexWrap: isMobileDevice ? "wrap" : undefined,
              ...style,
            }}
          >
            {isPear && pear ? (
              <AppLink
                loading={<Loading size={22} />}
                app={pear}
                icon={<Img app={pear} size={22} />}
              />
            ) : (
              <Img slug={"pear"} size={22} />
            )}
            <P
              style={{
                fontSize: ".95rem",
                color: COLORS.orange,
              }}
            >
              {t("Share feedback about {{app}} {{emoji}} earn 10-50 credits!", {
                app: app?.name,
                emoji: app?.icon,
              })}{" "}
              🍇
            </P>
            <Button
              className="inverted"
              onClick={() => {
                setPear(undefined)
              }}
              style={{
                ...utilities.inverted.style,
                ...utilities.xSmall.style,
                fontSize: ".8rem",
              }}
            >
              {t("Cancel")}
            </Button>
          </Div>
        )}
      </>
    ),
    [t, isPear, pear],
  )

  const containerStyle = {
    ...styles.container.style,
    marginTop: isMobileDevice ? "0.8rem" : isSmallDevice ? "0.6rem" : ".25rem",
    width: "100%",
    flex: 1,
  }

  if (!showTribe) {
    return null
  }

  return (
    <>
      <Div id="tribe">
        {postId ? (
          <Div style={containerStyle}>
            <TribePost />
          </Div>
        ) : (
          <Div style={containerStyle}>
            <Div>
              <H1
                style={{
                  display: "flex",
                  gap: ".5rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                  margin: 0,
                  padding: 0,
                  marginBottom: "1.75rem",
                  fontSize: "clamp(1.3rem, 4vw, 1.725rem)",
                }}
              >
                {isPear && pear ? (
                  <Img size={isMobileDevice ? 34 : 37} app={pear} />
                ) : app?.slug === "focus" ? (
                  <FocusButton
                    width={40}
                    style={{ marginRight: 14, position: "relative", top: 1 }}
                  >
                    {t("Focus")}
                  </FocusButton>
                ) : (
                  <Img
                    size={isMobileDevice ? 34 : 37}
                    app={
                      showTribeProfile &&
                      !(pathname === "/" && siteConfig.isTribe)
                        ? app
                        : undefined
                    }
                    slug={showTribeProfile ? undefined : "tribe"}
                  />
                )}
                {showTribeProfile && app && app?.slug !== "focus" ? (
                  <AppLink app={isPear && pear ? pear : app} isTribe={false}>
                    {t(isPear ? "Pear" : app?.name)}
                  </AppLink>
                ) : (
                  app?.slug !== "focus" && <>{t(isPear ? "Pear" : "Tribe")}</>
                )}
                <Div
                  style={{
                    marginLeft: rtl ? undefined : "auto",
                    marginRight: !rtl ? undefined : "auto",
                    fontSize: ".8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: ".75rem",
                  }}
                >
                  <A
                    event={ANALYTICS_EVENTS.CHERRY_DEV_CLICK}
                    openInNewTab
                    href="https://chrry.dev"
                  >
                    <FaGithub />
                    AGPLv3
                  </A>
                  <Grapes
                    style={{
                      padding: ".3rem",
                    }}
                  />
                </Div>
              </H1>
              <Div
                as="header"
                style={{
                  display: "flex",
                  gap: ".5rem",
                  flexWrap: "wrap",
                  flexDirection: isMobileDevice ? "column" : "row",
                  position: "relative",
                  bottom: isMobileDevice ? ".5rem" : ".5rem",
                  marginBottom: ".75rem",
                }}
              >
                <Div
                  style={{
                    display: "flex",
                    gap: ".7rem",
                    flexWrap: "wrap",
                    fontSize: ".85rem",
                    flex: 1,
                  }}
                >
                  {!isDrawerOpen && (
                    <A
                      onClick={() => {
                        setShowWatermelon(true)
                      }}
                      openInNewTab
                      event={ANALYTICS_EVENTS.WM_BYOK_CLICK}
                      href={siteConfig.isWatermelon ? "/" : "/watermelon"}
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Img slug="watermelon" width={20} height={20} /> BYOK (
                      {t("Free")})
                      {user?.apiKeys?.openrouter ||
                      guest?.apiKeys?.openrouter ? (
                        <CircleCheck color="var(--accent-4)" size={14} />
                      ) : null}
                    </A>
                  )}
                  <A
                    event={ANALYTICS_EVENTS.BUY_ME_A_COFFEE_CLICK}
                    href="https://buymeacoffee.com/iliyan"
                    openInNewTab
                    title="Buy me a coffee"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      color: COLORS.orange,
                    }}
                  >
                    <SiBuymeacoffee color={COLORS.orange} size={16} />
                    {t("BAM")} 💥
                  </A>
                  <A href="/about">
                    {app?.store?.app?.icon || "🍒"} /{t("about")}
                  </A>
                  <A href="/privacy">/{t("privacy")} 🤫</A>
                  <Div
                    style={{
                      display: "flex",
                      gap: 7.5,
                      alignItems: "center",
                      marginLeft: "auto",
                    }}
                  >
                    <Weather showLocation />
                    <Hippo dataTestId="tribe" />
                  </Div>
                </Div>
              </Div>
              <Div
                style={{
                  display: "flex",
                  gap: ".5rem",
                  flexWrap: "wrap",
                  marginTop: ".5rem",
                }}
                key={`app-tribe-${tribeSlug}-${app?.id}`}
              >
                {isLoadingTribes ? (
                  <Div style={{}}>
                    <Loading />
                  </Div>
                ) : (
                  <Div
                    key={maxTribes?.map((item) => item.slug)?.join("-")}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: ".85rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {maxTribes.map((tribe, i) => (
                      <MotiView
                        key={tribe.id + i}
                        from={{ opacity: 0, translateY: 0, translateX: -10 }}
                        animate={{ opacity: 1, translateY: 0, translateX: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 100,
                          delay: reduceMotion ? 0 : i * 25,
                        }}
                      >
                        <A
                          style={{
                            fontSize: ".9rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            color:
                              tribe.slug === tribeSlug
                                ? "var(--shade-7)"
                                : undefined,
                          }}
                          href={`/t/${tribe.slug}`}
                        >
                          <Span
                            style={{
                              fontSize: ".65rem",
                              color: "var(--background)",
                              borderRadius: getRadius(20),
                              padding: ".1rem 0.3rem",
                              background:
                                tribe.slug !== tribeSlug
                                  ? "var(--accent-1)"
                                  : "var(--shade-7)",
                            }}
                          >
                            {tribe.postsCount || 0}
                          </Span>
                          <Span>
                            {tribe.slug === tribeSlug ? "" : "/"}
                            {t(tribe.slug)}
                          </Span>
                        </A>
                      </MotiView>
                    ))}
                  </Div>
                )}
              </Div>
            </Div>
            <Div>
              {!showTribeProfile && (
                <>
                  <Div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 15,
                      margin: 0,
                      marginTop: "2rem",
                      marginBottom: "1.25rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <Div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 15,
                        flex: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Img logo="coder" size={30} />
                      <Span>
                        {tribeSlug && currentTribe ? (
                          <>
                            <A
                              href={getTribeUrl()}
                              onClick={(e) => {
                                if (e.metaKey || e.ctrlKey) {
                                  return
                                }
                                e.preventDefault()
                                setIsNewChat({
                                  value: true,
                                  to: getTribeUrl(),
                                  tribe: true,
                                })
                              }}
                            >
                              {t("Tribe's Feed")}
                            </A>
                            <P
                              style={{
                                margin: 0,
                                fontSize: ".9rem",
                                fontWeight: "normal",
                              }}
                            >
                              /{t(currentTribe.slug)}
                            </P>
                          </>
                        ) : (
                          <>{t("Tribe's Feed")}</>
                        )}
                      </Span>
                      <P
                        style={{
                          fontSize: ".75rem",
                          color: "var(--shade-7)",
                          fontWeight: "normal",
                        }}
                      >
                        {t(
                          tribeSlug && currentTribe
                            ? `*${t(currentTribe?.description || "")}`
                            : "Organize your life",
                        )}
                      </P>
                      <Div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginLeft: rtl || isSmallDevice ? undefined : "auto",
                          marginRight:
                            !rtl || isSmallDevice ? undefined : "auto",
                        }}
                      >
                        {rtl && <FocusButton />}

                        {app?.mainThreadId && owner && (
                          <A
                            style={{ fontSize: "1rem", marginRight: 5 }}
                            href={`/threads/${app?.mainThreadId}`}
                          >
                            🧬
                          </A>
                        )}
                        {burnApp ? (
                          <Div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              position: "relative",
                              bottom: "0.05rem",
                              fontWeight: "normal",
                            }}
                          >
                            {app?.id === burnApp.id ? (
                              <Checkbox
                                style={{
                                  marginLeft: rtl ? undefined : "auto",
                                  marginRight: !rtl ? undefined : "auto",
                                  fontSize: ".85rem",
                                }}
                                checked={burn}
                                onChange={() => {
                                  setBurn(!burn)
                                }}
                              >
                                {t("Private Chat")}
                              </Checkbox>
                            ) : (
                              <AppLink
                                icon={<Img emoji="🔥" size={20} />}
                                app={burnApp}
                                style={{
                                  fontSize: ".95rem",
                                  marginRight: 1,
                                  color: COLORS.red,
                                }}
                              >
                                <Span>{t("Burn")}</Span>
                              </AppLink>
                            )}
                          </Div>
                        ) : null}
                        <A
                          href={`${FRONTEND_URL}/calendar`}
                          title={t("Organize your life")}
                          openInNewTab={isExtension && isFirefox}
                          className="button transparent"
                          style={{
                            ...utilities.button.style,
                            ...utilities.transparent.style,
                          }}
                        >
                          <Img
                            showLoading={false}
                            icon="calendar"
                            width={18}
                            height={18}
                          />
                        </A>
                        <Tools
                          showDownloads={true}
                          showInstructions={false}
                          showInstallers={false}
                          icon
                          style={{
                            marginTop: 0,
                          }}
                        />
                        {!rtl && <FocusButton />}
                      </Div>
                    </Div>
                  </Div>
                  <Div
                    style={{
                      marginBottom: isMobileDevice ? "1rem" : "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <P
                      style={{
                        lineHeight: "1.75",
                        fontSize: ".95rem",
                        textAlign: isSmallDevice ? "left" : "center",
                      }}
                    >
                      <Trans
                        i18nKey="tribe_ecosystem_description"
                        defaults="<Watch AI agents collabor>ate across the 🍇 Wine ecosystem. <0>🌀 Spatial Navigation©</0> for context-aware communication and <1>🍣 Sato Dojo©</1> for autonomous coding."
                        components={[
                          chrry ? (
                            <AppLink
                              key="chrry-link"
                              isTribe
                              app={siteConfig.isTribe ? chrry : app || chrry}
                            />
                          ) : (
                            <A
                              key="chrry-nav-link"
                              openInNewTab
                              href="https://github.com/chrryai/donut/blob/main/SPATIAL_NAVIGATION.md"
                            />
                          ),
                          sushi ? (
                            <AppLink
                              key="sushi-link"
                              loading={
                                <>
                                  <Loading size={14} />
                                </>
                              }
                              isTribe
                              app={sushi}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            />
                          ) : (
                            <A
                              key="sushi-patent-link"
                              openInNewTab
                              href="https://github.com/chrryai/donut/blob/main/.sato/COMPREHENSIVE_SPATIAL_PATENT.md"
                            />
                          ),
                        ]}
                      />
                    </P>

                    <Div
                      style={{
                        marginTop: 20,
                        ...utilities.row.style,
                        alignItems: "center",
                        justifyContent: viewPortWidth < 550 ? "left" : "center",
                        gap: viewPortWidth < 550 ? 12.5 : 10,
                        flexWrap: "wrap",
                      }}
                    >
                      {app && (
                        <AppLink
                          isTribe={false}
                          isPear={isPear}
                          app={app}
                          icon={<Img app={app} size={18} />}
                          className="button inverted"
                          style={{
                            ...utilities.inverted.style,
                            ...utilities.small.style,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {t(TRAIN, {
                            name: app?.name,
                          })}
                        </AppLink>
                      )}

                      <ToggleAgent app={undefined} />
                      {app && !isPear && (
                        <Button
                          data-testid="grapes-feedback-button"
                          className="transparent"
                          onClick={() => {
                            plausible({
                              name: ANALYTICS_EVENTS.GRAPE_PEAR_FEEDBACK,
                              props: {
                                app: app.name,
                                slug: app.slug,
                                id: app.id,
                              },
                            })
                            setPear(app)
                          }}
                          style={{
                            ...utilities.transparent.style,
                            ...utilities.small.style,
                            fontSize: ".8rem",
                          }}
                        >
                          <Img slug="pear" size={20} /> {t("Let's Pear")}
                        </Button>
                      )}
                      {back && (
                        <AppLink
                          isTribe
                          app={back}
                          loading={<Loading size={22} />}
                          icon={
                            <>
                              <Span>🌀</Span>
                              <Img app={back} size={22} />
                            </>
                          }
                          style={{
                            marginLeft:
                              isMobileDevice || rtl ? undefined : "auto",
                            marginRight:
                              isMobileDevice || !rtl ? undefined : "auto",
                            fontSize: ".95rem",
                            marginBottom: isMobileDevice ? ".5rem" : undefined,
                            marginTop: isMobileDevice ? ".5rem" : undefined,
                          }}
                        >
                          {t(back.name)}
                        </AppLink>
                      )}
                    </Div>
                    <Div
                      style={{
                        marginTop: 12.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        position: "relative",
                        bottom: -2.5,
                        flexWrap: "wrap",
                      }}
                    >
                      {app && (
                        <AppLink isTribe={false} app={app}>
                          <Img size={28} app={app} />
                        </AppLink>
                      )}
                      <Ticker
                        showControls
                        style={{
                          color: COLORS[app?.themeColor as keyof typeof COLORS],
                        }}
                      />
                    </Div>
                  </Div>
                  {getStoreApps({
                    style: { marginBottom: 25, marginTop: 5 },
                  })}
                </>
              )}
              {showTribeProfile && (
                <Div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 15,
                    justifyContent: "center",
                    marginTop: 30,
                    marginBottom: 10,
                    flexDirection: "column",
                  }}
                >
                  <Div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
                    <A
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey) {
                          return
                        }
                        e.preventDefault()

                        setIsNewChat({
                          value: true,
                          to: getTribeUrl(),
                          tribe: true,
                        })
                        tags?.length && setTags([])
                      }}
                      href={getTribeUrl()}
                    >
                      <ArrowLeft size={20} />
                      <Img logo="coder" size={30} />
                      {t("All Tribe's Feed")}
                    </A>{" "}
                    {app?.store?.app?.slug === "sushi" ? (
                      <A
                        openInNewTab
                        href="https://github.com/chrryai/donut/blob/main/.sato/COMPREHENSIVE_SPATIAL_PATENT.md"
                      >
                        {t("🍣 Sato Dojo©")}
                      </A>
                    ) : (
                      <A
                        style={{
                          display: "flex",
                          marginLeft: rtl ? undefined : "auto",
                          marginRight: !rtl ? undefined : "auto",
                          position: "relative",
                        }}
                        openInNewTab
                        href="/ramen"
                      >
                        <Img size={34} src="/images/food/ramen.png" />
                        {t("拉麺")}
                        <Span
                          style={{
                            position: "absolute",
                            backgroundColor: COLORS.red,
                            color: "white",
                            borderRadius: "20px",
                            padding: ".15rem .4rem",
                            bottom: "-.8rem",
                            right: "-1rem",
                            fontSize: "0.55rem",
                          }}
                        >
                          {" "}
                          {t("Ramen")}
                        </Span>
                      </A>
                    )}
                  </Div>
                  {/* <Tools
                    showDownloads={true}
                    showInstructions={false}
                    icon
                    style={{
                      marginTop: 0,
                    }}
                  /> */}
                  <FeedBack
                    style={{
                      position: "relative",
                      bottom: "0.5rem",
                      padding: "0 0.05rem",
                    }}
                  />
                  {!isPear && (
                    <Div
                      style={{
                        display: "flex",
                        gap: 10,
                        lineHeight: "1.5",
                        flexWrap: "wrap",
                      }}
                    >
                      <Div
                        style={{
                          display: "flex",
                          gap: 15,
                          flex: 1,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {app && (
                          <AppLink
                            isTribe={false}
                            app={app}
                            icon={<Img size={32} app={app} />}
                          />
                        )}
                        {os !== "windows" && (
                          <Span
                            style={{
                              position: "relative",
                              right: "0.2rem",
                            }}
                          >
                            {app?.icon}
                          </Span>
                        )}
                        {back ? (
                          <AppLink
                            isTribe
                            app={back}
                            loading={<Loading size={22} />}
                            icon={
                              <>
                                <Span>🌀</Span>
                                <Img app={back} size={22} />
                              </>
                            }
                            style={{
                              marginLeft: rtl ? undefined : "auto",
                              marginRight: !rtl ? undefined : "auto",
                              fontSize: ".95rem",
                            }}
                          >
                            {t(back.name)}
                          </AppLink>
                        ) : null}
                      </Div>

                      <Div
                        style={{
                          color: "var(--shade-7)",
                          lineHeight: "1.6",
                          fontSize: ".95rem",
                          display: "flex",
                          gap: 5,
                          position: "relative",
                          flexDirection: "column",
                        }}
                      >
                        <>
                          <Ticker
                            showControls
                            style={{
                              color:
                                COLORS[app?.themeColor as keyof typeof COLORS],
                            }}
                          />
                          <H2
                            style={{
                              fontSize: "1rem",
                              fontWeight: "normal",
                              marginTop: "0.5rem",
                              marginBottom: "0.2rem",
                              color: "var(--shade-7)",
                            }}
                          >
                            {app?.subtitle || app?.description ? (
                              <>
                                {t(app?.subtitle ?? "")}{" "}
                                {t(app?.description ?? "")} {app?.icon}
                              </>
                            ) : (
                              t(
                                "This part will be updated when  App Creator pin a character profile 🧬",
                              )
                            )}
                          </H2>
                        </>
                      </Div>
                    </Div>
                  )}

                  {downloadUrl ? (
                    <Div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {rtl && <FocusButton />}

                      {app?.mainThreadId && owner && (
                        <A
                          style={{ fontSize: "1rem", marginRight: 5 }}
                          href={`/threads/${app?.mainThreadId}`}
                        >
                          🧬
                        </A>
                      )}
                      {burnApp ? (
                        <Div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            position: "relative",
                            bottom: "0.05rem",
                          }}
                        >
                          {app?.id === burnApp.id ? (
                            <Checkbox
                              style={{
                                marginLeft: rtl ? undefined : "auto",
                                marginRight: !rtl ? undefined : "auto",
                                fontSize: ".85rem",
                              }}
                              checked={burn}
                              onChange={() => {
                                setBurn(!burn)
                              }}
                            >
                              {t("Private Chat")}
                            </Checkbox>
                          ) : (
                            <AppLink
                              icon={<Img emoji="🔥" size={20} />}
                              app={burnApp}
                              style={{
                                fontSize: ".95rem",
                                marginRight: 1,
                                color: COLORS.red,
                              }}
                            >
                              <Span>{t("Burn")}</Span>
                            </AppLink>
                          )}
                        </Div>
                      ) : null}
                      <A
                        href={`${FRONTEND_URL}/calendar`}
                        title={t("Organize your life")}
                        openInNewTab={isExtension && isFirefox}
                        className="button transparent"
                        style={{
                          ...utilities.button.style,
                          ...utilities.transparent.style,
                        }}
                      >
                        <Img
                          showLoading={false}
                          icon="calendar"
                          width={18}
                          height={18}
                        />
                      </A>
                      <Tools
                        showDownloads={true}
                        showInstructions={false}
                        showInstallers={false}
                        style={{
                          marginTop: 0,
                        }}
                      />
                      {!rtl && <FocusButton />}
                    </Div>
                  ) : null}
                  {getStoreApps()}
                </Div>
              )}
              {showTribeProfile && (
                <Div
                  style={{
                    marginTop: "1.5rem",
                    marginBottom: "1.5rem",
                    color: "var(--shade-7)",
                    lineHeight: "1.6",
                    fontSize: ".95rem",
                    display: "flex",
                    gap: 10,
                    position: "relative",
                    flexDirection: "column",
                  }}
                >
                  <H3
                    style={{
                      color: "var(--shade-6)",
                      display: "flex",
                      gap: 5,
                      flexDirection: "column",
                      alignSelf: "flex-start",
                      alignItems: "flex-start",
                      margin: 0,
                      fontWeight: "normal",
                      fontSize: ".9rem",
                    }}
                  >
                    {/* <Ticker
                        maxWidth={viewPortWidth - 70}
                        showControls
                        style={{
                          color: COLORS[app?.themeColor as keyof typeof COLORS],
                        }}
                      /> */}
                    <Img showLoading={false} logo={"lifeOS"} size={24} />

                    <P>
                      <A href={`/${app?.store?.slug}`} target="_blank">
                        {t(app?.store?.name ?? "")}
                      </A>{" "}
                      {t(app?.store?.title ? ` - ${app?.store?.title}` : "")}
                      {t(
                        app?.store?.description
                          ? ` - ${app?.store?.description}`
                          : "",
                      )}
                    </P>
                  </H3>
                  <Div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {app?.id === accountApp?.id &&
                      isOwner(app, { userId: user?.id }) && (
                        <Button
                          className="link"
                          title={t("Edit")}
                          onClick={() => {
                            setAppStatus({
                              step: "update",
                              part: "name",
                            })
                          }}
                          style={utilities.link.style}
                        >
                          <Settings2 size={18} />
                        </Button>
                      )}
                    <ToggleAgent />
                    {app && app.id !== accountApp?.id ? (
                      <ToggleAgent app={app} />
                    ) : undefined}
                    {app?.id !== accountApp?.id &&
                      isOwner(app, { userId: user?.id }) && (
                        <Button
                          className="link"
                          title={t("Edit")}
                          onClick={() => {
                            setAppStatus({
                              step: "update",
                              part: "name",
                            })
                          }}
                          style={utilities.link.style}
                        >
                          <Settings2 size={18} />
                        </Button>
                      )}
                    {app && !isPear && (
                      <Button
                        data-testid="grapes-feedback-button"
                        className="transparent"
                        onClick={() => {
                          plausible({
                            name: ANALYTICS_EVENTS.GRAPE_PEAR_FEEDBACK,
                            props: {
                              app: app.name,
                              slug: app.slug,
                              id: app.id,
                            },
                          })
                          setPear(app)
                        }}
                        style={{
                          ...utilities.transparent.style,
                          ...utilities.small.style,
                          fontSize: ".8rem",
                        }}
                      >
                        <Img slug="pear" size={20} /> {t("Let's Pear")}
                      </Button>
                    )}
                  </Div>
                </Div>
              )}
              {hasHydrated && (
                <Div
                  ref={scrollRef}
                  style={{
                    display: "flex",
                    alignItems: !isMobileDevice ? "center" : undefined,
                    gap: 10,
                    flexWrap: "wrap",
                    flexDirection: isMobileDevice ? "column" : undefined,
                  }}
                >
                  <Div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      flex: !isMobileDevice ? 1 : undefined,
                    }}
                  >
                    <Search
                      loading={isLoadingPosts}
                      onChange={(val) => setSearch(val)}
                      style={{
                        borderColor:
                          COLORS[colorScheme as keyof typeof COLORS] ||
                          "var(--accent-5)",
                        flex: "1",
                        width: "100%",
                      }}
                    />
                  </Div>
                  <Div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      justifyContent: isMobileDevice ? "center" : "flex-end",
                    }}
                  >
                    <Button
                      disabled={isLoadingPosts}
                      data-testid="threads-sort-button-date"
                      title={
                        sortBy !== "date"
                          ? t("Sort by date")
                          : order === "desc"
                            ? t("Oldest first")
                            : t("Newest first")
                      }
                      className={"inverted"}
                      onClick={() => {
                        if (sortBy === "date") {
                          setOrder(order === "desc" ? "asc" : "desc")
                        } else {
                          setSortBy("date")
                        }
                      }}
                      style={{
                        fontSize: "1.15rem",
                      }}
                    >
                      {sortBy === "date" ? (
                        order === "desc" ? (
                          "📅"
                        ) : (
                          "⌚️"
                        )
                      ) : (
                        <CalendarIcon color="var(--shade-3)" size={20} />
                      )}
                    </Button>

                    <Button
                      data-testid="threads-sort-button-hot"
                      title={
                        sortBy !== "hot" ? t("Sort hot") : t("Un-sort hot")
                      }
                      className={"inverted"}
                      disabled={isLoadingPosts}
                      onClick={() => {
                        const newSort = sortBy === "hot" ? "date" : "hot"
                        setSortBy(newSort)
                      }}
                      style={{
                        fontSize: "1.15rem",
                      }}
                    >
                      {sortBy === "hot" ? (
                        <Img emoji="🔥" size={20} />
                      ) : (
                        <BrickWallFire color={COLORS.orange} size={20} />
                      )}
                    </Button>

                    <Button
                      data-testid="threads-sort-button-liked"
                      title={
                        sortBy !== "liked"
                          ? t("Sort by liked")
                          : t("Un-sort liked")
                      }
                      className={"inverted"}
                      disabled={isLoadingPosts}
                      onClick={() => {
                        const newSort = sortBy === "liked" ? "date" : "liked"
                        setSortBy(newSort)
                      }}
                      style={{
                        fontSize: "1.15rem",
                      }}
                    >
                      {sortBy === "liked" ? (
                        <Img icon="heart" width={20} height={20} />
                      ) : (
                        <HeartPlus color={COLORS.red} size={20} />
                      )}
                    </Button>
                  </Div>
                </Div>
              )}
              {tribePosts?.posts?.length === 0 && !isLoadingPosts ? (
                <Div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "1.25rem",
                    gap: "0.5rem",
                    fontSize: "0.8rem",
                    color: "var(--shade-7)",
                  }}
                >
                  <Img slug="sushi" size={24} />
                  <P>{t("No posts found")}</P>
                </Div>
              ) : (
                isSwarm && (
                  <Div
                    style={{
                      marginTop: "1.5rem",
                      marginBottom: "1.5rem",
                      alignItems: "center",
                      justifyContent: "center",
                      display: "flex",
                      gap: "1rem",
                      flexDirection: "row",
                      flexWrap: "wrap",
                    }}
                  >
                    <Div
                      style={{
                        alignItems: "center",
                        display: "flex",
                        gap: "1rem",
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      <Div
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                          display: "flex",
                          gap: "1rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {posting
                          .slice(0, isMobileDevice ? 3 : 6)
                          .map((item, i) => {
                            return (
                              <MotiView
                                key={`post-${item.app.id}`}
                                from={{
                                  opacity: 0,
                                  translateY: -8,
                                  translateX: 0,
                                }}
                                animate={{
                                  opacity: 1,
                                  translateY: 0,
                                  translateX: 0,
                                }}
                                transition={{
                                  duration: reduceMotion ? 0 : 120,
                                  delay: reduceMotion ? 0 : i * 35,
                                }}
                              >
                                <Img slug={item.app.slug} />
                              </MotiView>
                            )
                          })}
                        {liveReactions
                          .slice(0, isMobileDevice ? 3 : 6)
                          .map((item, i) => {
                            return (
                              <MotiView
                                key={`reaction-${item.app.id}-${item.tribePostId}-${i}`}
                                from={{
                                  opacity: 0,
                                  translateY: -8,
                                  translateX: 0,
                                }}
                                animate={{
                                  opacity: 1,
                                  translateY: 0,
                                  translateX: 0,
                                }}
                                transition={{
                                  duration: reduceMotion ? 0 : 120,
                                  delay: reduceMotion ? 0 : i * 35,
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: ".5rem",
                                }}
                              >
                                <Img size={23} slug={item.app.slug} />
                                <Span style={{ fontSize: "1.1rem" }}>
                                  {item.reaction.emoji}
                                </Span>
                              </MotiView>
                            )
                          })}
                      </Div>
                      {posting.length ? (
                        <Div
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            gap: ".25rem",
                          }}
                        >
                          <Span
                            style={{
                              fontSize: ".8rem",
                              color: "var(--accent-4)",
                            }}
                          >
                            {t("Thinking...")}
                          </Span>
                          <Div
                            className="typing"
                            data-testid="typing-indicator"
                            style={{
                              display: "inline-flex",
                              gap: 2,
                              alignItems: "center",
                              marginLeft: rtl ? undefined : 6,
                              marginRight: !rtl ? undefined : 6,
                            }}
                          >
                            <Span
                              style={{
                                width: 4,
                                height: 4,
                                backgroundColor: "var(--accent-4)",
                                borderRadius: getRadius("50%"),
                              }}
                            ></Span>
                            <Span
                              style={{
                                width: 4,
                                height: 4,
                                backgroundColor: "var(--accent-4)",
                                borderRadius: getRadius("50%"),
                              }}
                            ></Span>
                            <Span
                              style={{
                                width: 4,
                                height: 4,
                                backgroundColor: "var(--accent-4)",
                                borderRadius: getRadius("50%"),
                              }}
                            ></Span>
                          </Div>
                        </Div>
                      ) : null}
                    </Div>
                    {pendingPostIds.length ? (
                      <Button
                        disabled={isLoadingPosts}
                        onClick={async () => {
                          await refetchPosts()
                          setPendingPostIds([])
                        }}
                        style={{
                          fontSize: 13,
                          padding: "5px 10px",
                          display: "flex",
                          alignItems: "center",
                          marginLeft: rtl ? undefined : "auto",
                          marginRight: !rtl ? undefined : "auto",
                          gap: 5,
                        }}
                      >
                        {isLoadingPosts ? (
                          <Loading color="#fff" size={16} />
                        ) : (
                          <LoaderCircle size={16} />
                        )}
                        {t("{{count}} more", {
                          count: pendingPostIds.length,
                        })}
                      </Button>
                    ) : null}
                  </Div>
                )
              )}
              {tags.length ? (
                <Div
                  style={{
                    ...utilities.row.style,
                  }}
                >
                  {tags?.map((tag: string) => (
                    <Button
                      style={{
                        ...utilities.small.style,
                      }}
                      onClick={() => {
                        setTags(
                          tags.filter((tagItem: string) => tagItem !== tag),
                        )
                      }}
                      key={`tag-${tag}`}
                    >
                      # {tag}
                      <CircleX size={12} />
                    </Button>
                  ))}
                </Div>
              ) : null}
              {newPostsCount > 0 && (
                <Div
                  style={{
                    marginTop: "1rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Button
                    onClick={async () => {
                      setIsLoadingMore(true)
                      // Refresh posts to show new ones
                      window.location.reload()
                    }}
                    className="inverted"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      background: "var(--accent-1)",
                      color: "white",
                      border: "none",
                      ...utilities.inverted.style,
                    }}
                  >
                    <Sparkles size={16} />
                    {t("Load {{count}} new post", {
                      count: newPostsCount,
                    })}
                  </Button>
                </Div>
              )}
              <Div ref={postsRef} />
              {!tribePosts ||
              (hasHydrated && isLoadingPosts && !isLoadingMore) ? null : (
                <>
                  {Array.from(
                    new Map(tribePosts.posts.map((p) => [p.id, p])).values(),
                  ).map((post, i) => {
                    return (
                      <TribePostListItem
                        key={`moti-${post.id}`}
                        post={post}
                        index={i}
                        reduceMotion={reduceMotion}
                        isDark={isDark}
                        isMobileDevice={isMobileDevice}
                        isSmallDevice={isSmallDevice}
                        viewPortWidth={viewPortWidth}
                        t={t}
                        setSignInPart={setSignInPart}
                        timeAgo={timeAgo}
                        toggleLike={toggleLike}
                        isTogglingLike={isTogglingLike}
                        tryAppCharacterProfile={tryAppCharacterProfile}
                        setTryAppCharacterProfile={setTryAppCharacterProfile}
                        tyingToReact={tyingToReact}
                        setTyingToReact={setTyingToReact}
                        owner={owner}
                        user={user}
                        deletePost={deletePost}
                        accountApp={accountApp}
                        addParams={addParams}
                        setAppStatus={setAppStatus}
                        tags={tags}
                        push={push}
                        setTags={setTags}
                        postsRef={postsRef}
                        downloadImage={downloadImage}
                      />
                    )
                  })}

                  {tribePosts?.hasNextPage && (
                    <Div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "1.25rem",
                      }}
                    >
                      <A
                        href={(() => {
                          const params = new URLSearchParams(
                            searchParams.toString(),
                          )
                          params.set("until", String((until || 1) + 1))
                          return `?${params.toString()}`
                        })()}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey) {
                            return
                          }

                          e.preventDefault()

                          setIsLoadingMore(true)
                          setUntil((until || 0) + 1)
                        }}
                        style={{
                          fontSize: 13,
                          padding: "5px 10px",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {isLoadingPosts ? (
                          <Loading color="#fff" size={16} />
                        ) : (
                          <LoaderCircle size={16} />
                        )}
                        {t("Load more")}
                      </A>
                    </Div>
                  )}
                </>
              )}
            </Div>
          </Div>
        )}
        {children}
      </Div>
    </>
  )
}

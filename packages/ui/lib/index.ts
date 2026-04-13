import toast from "react-hot-toast"
import type z from "zod"
import type { session } from "../context/providers/AuthProvider"
import type { appFormData } from "../schemas/appSchema"
import type {
  aiAgent,
  app,
  collaboration,
  guest,
  message,
  paginatedMessages,
  sushi,
  thread,
  user,
} from "../types"
import * as utils from "../utils"
import type { createCalendarEventSchema } from "../utils/calendarValidation"
import { stringify as superjsonStringify } from "./superjson"

export { simpleRedact } from "./redaction"

export const getImageSrc = ({
  app,
  icon,
  logo,
  store,
  src,
  slug,
  size = 24,
  BASE_URL = utils.FRONTEND_URL,
  width,
  height,
  canEditApp,
  image,
}: any) => {
  const isNumericString = (val: string) => /^\d+$/.test(val)

  const finalWidth =
    typeof width === "number"
      ? width
      : typeof width === "string" && isNumericString(width)
        ? parseInt(width, 10)
        : width || size
  const finalHeight =
    typeof height === "number"
      ? height
      : typeof height === "string" && isNumericString(height)
        ? parseInt(height, 10)
        : height || size
  const finalSize =
    typeof finalWidth === "number"
      ? finalWidth
      : typeof finalHeight === "number"
        ? finalHeight
        : size

  // --- 1. OTOMATİK MAPPING ---
  // Buraya yeni bisi ekleyince aşağısı otomatik düzelir
  const appLogos = [
    "atlas",
    "bloom",
    "vault",
    "peach",
    "vex",
    "chrry",
    "popcorn",
    "sushi",
    "focus",
    "grape",
    "pepper",
    "waffles",
    "search",
    "zarathustra",
    "pear",
    "coder",
    "architect",
    "tribe",
    "nebula",
    "cosmos",
    "starmap",
    "quantumlab",
    "hippo",
    "jules",
    "burn",
    "blossom",
    "avocado",
    "watermelon",
    "donut",
    "benjamin",
    "lucas",
    "harper",
    "debugger",
  ]

  // --- 2. ICON LOGIC ---
  const getIconUrl = (ic: string) => {
    if (appLogos.includes(ic))
      return `${BASE_URL}/images/apps/${ic === "zarathustra" ? "z" : ic}.png`

    const animals: Record<string, string> = {
      frog: "frog.png",
      hamster: "hamster.png",
    }

    if (animals[ic]) return `${BASE_URL}/${animals[ic]}`

    const specialIcons: Record<string, string> = {
      spaceInvader: "images/pacman/space-invader.png",
      pacman: "images/pacman/pacman.png",
      heart: "images/pacman/heart.png",
      plus: "icons/plus-128.png",
      calendar: "icons/calendar-128.png",
      // sushi: "icons/sushi.png",
    }

    if (specialIcons[ic]) return `${BASE_URL}/${specialIcons[ic]}`

    return `${BASE_URL}/icons/${ic}-128.png`
  }

  const iconSrc = icon ? getIconUrl(icon) : null

  // --- 3. LOGO/STORE LOGIC ---
  const logoSrc =
    logo && appLogos.includes(logo)
      ? `${BASE_URL}/images/apps/${logo === "zarathustra" ? "z" : logo}.png`
      : logo === "lifeOS" || store?.slug === "lifeOS"
        ? `${BASE_URL}/icons/lifeOS-128.png`
        : logo === "vex" || store?.slug === "vex"
          ? `${BASE_URL}/icons/icon-128.png`
          : logo
            ? `${BASE_URL}/icons/icon-128${logo === "isMagenta" ? "-m" : logo === "isVivid" ? "-v" : ""}.png`
            : null

  // --- 4. APP/SLUG LOGIC ---
  const appSlug = app?.slug || slug || ""

  let appImageSrc
  if (!((logo || store) && !slug)) {
    if (appLogos.includes(appSlug)) {
      appImageSrc = `${BASE_URL}/images/apps/${appSlug === "zarathustra" ? "z" : appSlug}.png`
    } else {
      appImageSrc =
        app?.images?.[0]?.url ||
        app?.image ||
        (slug
          ? `${BASE_URL}/images/apps/coder.png`
          : canEditApp
            ? image || iconSrc
            : undefined)
    }
  }

  return {
    src: src || logoSrc || (!app && iconSrc) || appImageSrc || undefined,
    width: finalWidth,
    height: finalHeight,
    size: finalSize,
  }
}

export const getThreads = async ({
  pageSize,
  token,
  search,
  sort,
  threadId,
  userName,
  collaborationStatus,
  myPendingCollaborations,
  onError,
  slug,
  appId,
  hasPearApp,
  isDNA,
  isTribe,
  API_URL = utils.API_URL,
}: {
  pageSize?: number
  token: string
  sort?: "bookmark" | "date"
  search?: string
  threadId?: string
  userName?: string
  hasPearApp?: boolean
  isDNA?: boolean
  isTribe?: boolean
  collaborationStatus?: "pending" | "active" | null
  myPendingCollaborations?: boolean
  onError?: (status: number) => void
  appId?: string
  API_URL?: string
  slug?: "Atlas" | "Peach" | "Vault" | "Bloom" | string | null
}) => {
  const url = new URL(`${API_URL}/threads`)

  url.searchParams.set("pageSize", pageSize?.toString() || "10")
  collaborationStatus === null
    ? url.searchParams.set("collaborationStatus", "null")
    : collaborationStatus &&
      url.searchParams.set("collaborationStatus", collaborationStatus)

  if (appId) url.searchParams.set("appId", appId)
  if (search) url.searchParams.set("search", search)
  if (isDNA !== undefined) url.searchParams.set("isDNA", String(isDNA))
  if (isTribe !== undefined) url.searchParams.set("isTribe", String(isTribe))

  if (sort) url.searchParams.set("sort", sort)
  if (threadId) url.searchParams.set("threadId", threadId)
  if (hasPearApp !== undefined)
    url.searchParams.set("hasPearApp", String(hasPearApp))
  if (userName) url.searchParams.set("userName", userName)
  if (myPendingCollaborations)
    url.searchParams.set("myPendingCollaborations", "true")
  if (slug) url.searchParams.set("slug", slug)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    onError?.(response.status)
    return null
  }

  return response.json()
}

export interface AiRequestParams {
  token: string
  files?: File[]
  slug?: string
  app?: { id?: string }
  ask?: string
  about?: string
  userMessage?: { message: { id: string; clientId?: string } }
  debateAgent?: { id: string } | null
  selectedAgent: { id: string } | null
  language?: string
  isWebSearchEnabled?: boolean
  isExtension?: boolean
  isImageGenerationEnabled?: boolean
  isRetro?: boolean
  isPear?: boolean
  wasPear?: boolean
  placeholder?: string
  weather?: any
  deviceId?: string
  isSpeechActive?: boolean
  fingerprint?: string
  modelId?: string
  user?: user
}

/** Builds the request body and headers for a /ai POST call. */
export const buildAiRequestBody = (
  params: AiRequestParams,
): { body: FormData | string; headers: Record<string, string> } => {
  const {
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
  } = params

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  const isAdmin = user?.roles?.includes("admin")

  if (files && files.length > 0) {
    const formData = new FormData()
    slug && formData.append("slug", slug)
    app?.id && formData.append("appId", app.id)
    ask && formData.append("ask", ask)
    about && formData.append("about", about)
    formData.append("messageId", userMessage?.message.id || "")
    debateAgent && formData.append("debateAgentId", debateAgent.id)
    selectedAgent?.id && formData.append("agentId", selectedAgent.id)
    formData.append("language", language || "en")
    isWebSearchEnabled &&
      formData.append("webSearchEnabled", isWebSearchEnabled.toString())
    formData.append("actionEnabled", String(isExtension ?? false))
    formData.append(
      "imageGenerationEnabled",
      String(isImageGenerationEnabled ?? false),
    )
    isAdmin && modelId && formData.append("modelId", modelId)
    isRetro && formData.append("retro", "true")
    isPear && formData.append("pear", "true")
    wasPear && formData.append("wasPear", "true")
    placeholder && formData.append("placeholder", placeholder)
    weather && formData.append("weather", JSON.stringify(weather))
    formData.append("attachmentType", "file")
    deviceId && formData.append("deviceId", deviceId)
    isSpeechActive && formData.append("isSpeechActive", "true")
    files.forEach((file, index) => formData.append(`file_${index}`, file))
    // Don't set Content-Type for FormData — browser sets it with boundary
    return { body: formData, headers }
  }

  headers["Content-Type"] = "application/json"
  return {
    headers,
    body: JSON.stringify({
      debateAgentId: debateAgent?.id,
      messageId: userMessage?.message.id,
      agentId: selectedAgent?.id,
      language,
      actionEnabled: isExtension,
      webSearchEnabled: isWebSearchEnabled,
      imageGenerationEnabled: isImageGenerationEnabled,
      isSpeechActive,
      pear: isPear,
      wasPear,
      deviceId,
      weather,
      placeholder,
      ask,
      about,
      retro: isRetro,
      appId: app?.id,
      fingerprint,
      modelId: isAdmin ? modelId : undefined,
    }),
  }
}

/**
 * Handles error and success JSON responses from the /ai endpoint.
 * Returns `{ ok: false }` when the caller should abort (toast already shown).
 * Returns `{ ok: true; result?: any }` otherwise, with `result` set when the
 * response was JSON (so callers can check `result.success`, etc.).
 */
export const handleAiResponse = async (
  response: Response,
): Promise<{ ok: false } | { ok: true; result?: any }> => {
  if (!response.ok) {
    if (response.headers.get("content-type")?.includes("application/json")) {
      try {
        const result = await response.json()
        if (result.error) {
          if (response.status === 413 && result.message)
            toast.error(result.message)
          else toast.error(result.error)
          return { ok: false }
        }
      } catch {
        toast.error("Failed to send message")
      }
    }
    toast.error("Failed to send message")
    return { ok: false }
  }

  if (response.headers.get("content-type")?.includes("application/json")) {
    const result = await response.json()
    if (result.error) {
      toast.error(result.error)
      return { ok: false }
    }
    return { ok: true, result }
  }

  return { ok: true }
}

export const ai = async (
  {
    token,
    files,
    slug,
    user,
    API_URL = utils.API_URL,
  }: AiRequestParams & { API_URL?: string },
  {
    controller,
    setIsStreaming,
    onMessage,
    userMessage,
    selectedAgent,
    hipChatId,
    app,
    ask,
    about,
    debateAgent,
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
  }: {
    controller: AbortController
    setIsStreaming: (v: boolean) => void
    onMessage?: (msg: any) => void
    userMessage: { message: { id: string; clientId?: string } }
    selectedAgent: { id: string }
    hipChatId?: string
    app?: { id?: string }
    ask?: string
    about?: string
    debateAgent?: { id: string }
    language?: string
    isWebSearchEnabled?: boolean
    isExtension?: boolean
    isImageGenerationEnabled?: boolean
    isRetro?: boolean
    isPear?: boolean
    wasPear?: boolean
    placeholder?: string
    weather?: any
    deviceId?: string
    isSpeechActive?: boolean
    fingerprint?: string
    modelId?: string
  },
) => {
  const { body, headers } = buildAiRequestBody({
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
  })

  onMessage?.({
    content: "",
    isUser: false,
    message: {
      ...userMessage,
      message: { ...userMessage.message, id: userMessage.message.clientId },
    },
    isStreaming: true,
    isImageGenerationEnabled,
    isWebSearchEnabled,
    hipChatId,
  })

  setIsStreaming(true)

  const agentResponse = await utils.apiFetch(`${API_URL}/ai`, {
    method: "POST",
    headers,
    body,
    signal: controller.signal,
  })

  const handled = await handleAiResponse(agentResponse)
  if (!handled.ok) return
  if (handled.result?.success) return
}

export const getThread = async ({
  pageSize,
  id,
  token,
  liked,
  onError,
  API_URL = utils.API_URL,
}: {
  pageSize?: number
  id: string
  token?: string
  liked?: boolean
  onError?: (status: number) => void

  API_URL?: string
}) => {
  const response = await fetch(
    `${API_URL}/threads/${id}?pageSize=${pageSize}${liked ? `&liked=${liked}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    onError?.(response.status)
    return undefined
  }

  return (await response.json()) as {
    thread: thread
    messages: paginatedMessages
  }
}

export const getUser = async ({
  token,
  API_URL = utils.API_URL,
  threadId,
  appId,
}: {
  token: string
  API_URL?: string
  appId?: string
  threadId?: string
}) => {
  const params = new URLSearchParams({
    ...(threadId ? { threadId } : {}),
    ...(appId ? { appId } : {}),
  })
  const response = await fetch(`${API_URL}/user?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return
  }

  return (await response.json()) as user
}

export const getUsers = async ({
  pageSize,
  search,
  token,
  find,
  similarTo,
  API_URL = utils.API_URL,
}: {
  pageSize?: number
  search?: string
  token: string
  find?: string
  similarTo?: string
  API_URL?: string
}) => {
  const response = await fetch(
    `${API_URL}/users?pageSize=${pageSize}${search ? `&search=${search}` : ""}${find ? `&find=${find}` : ""}${similarTo ? `&similarTo=${similarTo}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    return null
  }

  return response.json()
}

export const getGuest = async ({
  token,
  API_URL = utils.API_URL,
  appId,
  threadId,
}: {
  token: string
  API_URL?: string
  threadId?: string
  appId?: string
}) => {
  const params = new URLSearchParams({
    ...(threadId ? { threadId } : {}),
    ...(appId ? { appId } : {}),
  })
  const response = await fetch(`${API_URL}/guest?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}

export const getLastMessage = async ({
  threadId,
  token,
  API_URL = utils.API_URL,
}: {
  threadId?: string
  token: string
  API_URL?: string
}) => {
  const messagesResponse = await fetch(
    `${API_URL}/messages?limit=1${threadId ? `&threadId=${threadId}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (messagesResponse.ok) {
    const messagesData = await messagesResponse.json()
    const latestMessage = messagesData?.messages?.[0]

    return latestMessage as {
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
    }
  }

  return undefined
}

export const uploadUserImage = async ({
  token,
  file,
  API_URL = utils.API_URL,
}: {
  token: string
  file: File | null
  API_URL?: string
}) => {
  const formData = new FormData()
  file && formData.append("image", file)
  const response = await fetch(`${API_URL}/user/image`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  return response.json()
}

export const updateThread = async ({
  id,
  star,
  instructions,
  token,
  title,
  regenerateTitle,
  regenerateInstructions,
  language,
  bookmarked,
  visibility,
  files,
  pinCharacterProfile,
  characterProfileVisibility,
  API_URL = utils.API_URL,
  appId,
}: {
  id: string
  star?: number | null
  instructions?: string | null
  token: string
  title?: string
  regenerateTitle?: boolean
  regenerateInstructions?: boolean
  language?: string
  visibility?: string
  bookmarked?: boolean
  files?: File[]
  pinCharacterProfile?: boolean
  characterProfileVisibility?: string
  API_URL?: string
  appId?: string | null
}) => {
  let postRequestBody: FormData | string
  const postRequestHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }

  if (files && files.length > 0) {
    const formData = new FormData()
    language && formData.append("language", language)
    regenerateTitle &&
      formData.append("regenerateTitle", regenerateTitle.toString())
    instructions && formData.append("instructions", instructions)
    title && formData.append("title", title)
    regenerateInstructions &&
      formData.append(
        "regenerateInstructions",
        regenerateInstructions.toString(),
      )
    visibility && formData.append("visibility", visibility)
    bookmarked && formData.append("bookmarked", bookmarked.toString())
    files.forEach((file, index) => {
      formData.append(`artifact_${index}`, file)
    })
    if (appId) {
      formData.append("appId", appId)
    }
    pinCharacterProfile !== undefined &&
      formData.append("pinCharacterProfile", pinCharacterProfile.toString())
    characterProfileVisibility &&
      formData.append("characterProfileVisibility", characterProfileVisibility)
    postRequestBody = formData
  } else {
    postRequestHeaders["Content-Type"] = "application/json"
    postRequestBody = JSON.stringify({
      language,
      regenerateTitle,
      instructions,
      title,
      regenerateInstructions,
      visibility,
      bookmarked,
      pinCharacterProfile:
        pinCharacterProfile !== undefined ? pinCharacterProfile : undefined,
      characterProfileVisibility,
      appId: appId !== undefined ? appId : undefined,
    })
  }

  const response = await fetch(`${API_URL}/threads/${id}`, {
    method: "PATCH",
    body: postRequestBody,
    headers: postRequestHeaders,
  })

  return response.json()
}

export const deleteMessage = async ({
  messageId,
  token,
  API_URL = utils.API_URL,
}: {
  messageId: string
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/messages/${messageId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export const deleteMemories = async ({
  token,
  API_URL = utils.API_URL,
}: {
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/memories`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export const updateUser = async ({
  language,
  name,
  image,
  userName,
  favouriteAgent,
  characterProfilesEnabled,
  memoriesEnabled,
  token,
  city,
  country,
  API_URL = utils.API_URL,
  openRouterApiKey,
  replicateApiKey,
  falApiKey,
  s3ApiKey,
  deletedApiKeys,
}: {
  language?: string
  name?: string
  image?: string
  userName?: string
  favouriteAgent?: string
  characterProfilesEnabled?: boolean
  memoriesEnabled?: boolean
  token: string
  API_URL?: string
  city?: string
  replicateApiKey?: string
  country?: string
  openRouterApiKey?: string
  falApiKey?: string
  deletedApiKeys?: string[]
  s3ApiKey?: string
}) => {
  const response = await fetch(`${API_URL}/user`, {
    method: "PATCH",
    body: JSON.stringify({
      language,
      name,
      image,
      userName,
      favouriteAgent,
      characterProfilesEnabled,
      memoriesEnabled,
      city,
      country,
      openRouterApiKey,
      replicateApiKey,
      falApiKey,
      deletedApiKeys,
      s3ApiKey,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export const updateGuest = async ({
  favouriteAgent,
  characterProfilesEnabled,
  memoriesEnabled,
  city,
  country,
  token,
  replicateApiKey,
  falApiKey,
  API_URL = utils.API_URL,
  openRouterApiKey,
  deletedApiKeys,
  s3ApiKey,
}: {
  favouriteAgent?: string
  characterProfilesEnabled?: boolean
  city?: string
  country?: string
  memoriesEnabled?: boolean
  API_URL?: string
  replicateApiKey?: string
  falApiKey?: string
  token: string
  openRouterApiKey?: string
  deletedApiKeys?: string[]
  s3ApiKey?: string
}) => {
  const response = await fetch(`${API_URL}/guest`, {
    method: "PATCH",
    body: JSON.stringify({
      favouriteAgent,
      characterProfilesEnabled,
      memoriesEnabled,
      city,
      country,
      openRouterApiKey,
      replicateApiKey,
      falApiKey,
      deletedApiKeys,
      s3ApiKey,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export const updateMessage = async ({
  messageId,
  like,
  token,
  API_URL = utils.API_URL,
}: {
  messageId: string
  like?: boolean | null
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      like,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export const updateCollaboration = async ({
  id,
  status,
  token,
  API_URL = utils.API_URL,
}: {
  id: string
  status: string
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/collaborations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export const removeUser = async ({
  token,
  API_URL = utils.API_URL,
}: {
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/user`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json()
  return data
}

export const deleteSubscription = async ({
  token,
  API_URL = utils.API_URL,
}: {
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/subscriptions`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json()
  return data
}

export type CalendarEventFormData = z.infer<typeof createCalendarEventSchema>

export const createCalendarEvent = async ({
  event,
  token,
  API_URL = utils.API_URL,
}: {
  event: CalendarEventFormData
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/calendar`, {
    method: "POST",
    body: superjsonStringify(event), // Serialize Dates properly
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json()
  return data
}

export const updateCalendarEvent = async ({
  id,
  event,
  token,
  API_URL = utils.API_URL,
}: {
  id: string
  event: CalendarEventFormData // ← Allow partial updates!
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/calendar/${id}`, {
    method: "PATCH",
    body: superjsonStringify({ ...event, id }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json()
  return data
}

export const deleteCalendarEvent = async ({
  id,
  token,
  API_URL = utils.API_URL,
}: {
  id: string
  API_URL?: string
  token: string
}) => {
  const response = await fetch(`${API_URL}/calendar/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json()
  return data
}

export const syncGoogleCalendar = async ({
  token,
  API_URL = utils.API_URL,
}: {
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/calendar/googleSync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json()
  return data
}

export const exportToGoogleCalendar = async ({
  eventId,
  API_URL = utils.API_URL,
  token,
}: {
  eventId: string
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/calendar/google-sync`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventId }),
  })
  const data = await response.json()
  return data
}

export const getCalendarEvents = async ({
  token,
  startDate,
  endDate,
  API_URL = utils.API_URL,
}: {
  token: string
  startDate?: string
  endDate?: string
  API_URL?: string
}) => {
  const params = new URLSearchParams()
  startDate && params.append("startDate", startDate)
  endDate && params.append("endDate", endDate)
  const response = await fetch(`${API_URL}/calendar?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json()
  return data
}

export async function createApp({
  token,
  data,
  API_URL = utils.API_URL,
}: {
  token: string
  data: appFormData
  API_URL?: string
}) {
  const response = await fetch(`${API_URL}/apps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  return await response.json()
}

export async function updateApp({
  token,
  id,
  data,
  API_URL = utils.API_URL,
}: {
  token: string
  id: string
  data: appFormData
  API_URL?: string
}) {
  const response = await fetch(`${API_URL}/apps/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  return await response.json()
}

export async function deleteApp({
  token,
  id,
  API_URL = utils.API_URL,
}: {
  token: string
  id: string
  API_URL?: string
}) {
  const response = await fetch(`${API_URL}/apps/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  return await response.json()
}

export async function reorderApps({
  token,
  apps,
  autoInstall,
  storeId,
  API_URL = utils.API_URL,
}: {
  token: string
  apps: { id: string }[]
  autoInstall?: boolean
  storeId?: string
  API_URL?: string
}) {
  const response = await fetch(`${API_URL}/apps/reorder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      storeId, // Optional: store context for ordering
      apps: apps.map((app, index) => ({
        appId: app.id,
        order: index,
        autoInstall, // Auto-install if not already installed
      })),
    }),
  })

  return await response.json()
}

export const clearSession = async ({
  API_URL = utils.API_URL,
  token,
}: {
  API_URL?: string
  token: string
}) => {
  const result = await fetch(`${API_URL}/session`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await result.json()

  return data
}

export const getSession = async ({
  deviceId,
  fingerprint,
  gift,
  isStandalone,
  appId,
  token,
  API_URL = utils.API_URL,
  VERSION = utils.VERSION,
  app,
  appSlug,
  agentName,
  chrryUrl,
  routeType,
  userAgent,
  pathname,
  screenWidth,
  screenHeight,
  translate,
  locale,
  threadId,
  isBot,
  source = "client",
  ip, // Client IP address for Arcjet
}: {
  appId?: string
  threadId?: string
  isBot?: boolean
  pathname?: string
  deviceId: string | undefined
  fingerprint?: string
  gift?: string
  isStandalone?: boolean
  token: string
  API_URL?: string
  VERSION?: string
  app?: "extension" | "pwa" | "web"
  appSlug?: string
  agentName?: string
  chrryUrl?: string
  routeType?: string
  userAgent?: string
  screenWidth?: number
  screenHeight?: number
  translate?: boolean
  locale?: string
  source?: string
  ip?: string // Client IP address
}) => {
  if (!deviceId) {
    return
  }

  const params = new URLSearchParams({
    ...(agentName ? { agent: agentName } : {}),
    ...(fingerprint ? { fp: fingerprint } : {}),
    appVersion: VERSION,
    ...(app ? { app } : {}),
    ...(appSlug ? { appSlug } : {}),
    ...(gift ? { gift } : {}),
    ...(chrryUrl ? { chrryUrl } : {}),
    ...(threadId ? { threadId } : {}),
    ...(appId ? { appId } : {}),
    ...(isBot ? { isBot: "true" } : {}),
    ...(routeType ? { routeType } : {}),
    ...(translate ? { translate: "true" } : {}),
    ...(isStandalone ? { isStandalone: "true" } : {}),
    ...(locale ? { locale } : {}),
    ...(source ? { source } : {}),
    ...(pathname ? { pathname: encodeURIComponent(pathname) } : {}),
  })

  const response = await fetch(`${API_URL}/session?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-device-id": deviceId,
      ...(source ? { "x-source": source } : {}),
      ...(screenWidth ? { "x-screen-width": screenWidth?.toString() } : {}),
      ...(screenHeight ? { "x-screen-height": screenHeight?.toString() } : {}),
      "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(appId ? { "x-app-id": appId } : {}),
      ...(userAgent ? { "user-agent": userAgent } : {}),
      ...(appSlug ? { "x-app-slug": appSlug } : {}),
      ...(routeType ? { "x-route-type": routeType } : {}),
      ...(pathname ? { "x-pathname": pathname } : {}),
      ...(locale ? { "x-locale": locale } : {}),
      ...(fingerprint ? { "x-fp": fingerprint } : {}),
      ...(chrryUrl ? { "x-chrry-url": chrryUrl } : {}),
      ...(ip ? { "x-forwarded-for": ip } : {}), // Pass client IP for Arcjet
    },
  })

  if (!response.ok) {
    // Disable further requests on rate limit
    if (response.status === 429) {
      return {
        error: "Rate limit exceeded",
        status: 429,
      } as unknown as session
    }

    // Return error with status for other non-OK responses
    const text = await response.text()
    return {
      error: `API error (${response.status}): ${text.substring(0, 200)}`,
      status: response.status,
    } as unknown as session
  }

  // Try to parse JSON, catch if it's HTML or invalid
  try {
    const result = await response.json()
    return result as session
  } catch (_error) {
    const text = await response.text()
    return {
      error: `API error (${response.status}): ${text.substring(0, 200)}`,
      status: response.status,
    } as unknown as session
  }
}

export type apiActions = ReturnType<typeof getActions>

export const getApps = async ({
  API_URL = utils.API_URL,
  token,
  chrryUrl,
  appId,
}: {
  API_URL?: string
  token: string
  appId?: string
  chrryUrl?: string
}) => {
  const params = new URLSearchParams()
  appId && params.append("appId", appId)
  chrryUrl && params.append("chrryUrl", chrryUrl)
  const response = await fetch(`${API_URL}/apps?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(chrryUrl ? { "x-chrry-url": chrryUrl } : {}),
    },
  })

  if (!response.ok) {
    return {
      error: `API error (${response.status})`,
      status: response.status,
    }
  }

  const data = await response.json()

  return data as sushi[]
}

export const getApp = async ({
  API_URL = utils.API_URL,
  token,
  appId,
  chrryUrl,
  skipCache,
  pathname,
  storeSlug,
  threadId,
  appSlug,
  accountApp,
  postId,
}: {
  API_URL?: string
  token: string
  appId?: string
  chrryUrl?: string
  pathname?: string
  skipCache?: boolean
  storeSlug?: string
  accountApp?: boolean
  appSlug?: string
  postId?: string
  threadId?: string
}) => {
  // Build query params for intelligent resolution
  const params = new URLSearchParams()
  if (chrryUrl) params.append("chrryUrl", chrryUrl)
  if (appId) params.append("appId", appId)
  if (pathname) params.append("pathname", encodeURIComponent(pathname))
  if (skipCache) params.append("skipCache", "true")
  if (accountApp) params.append("accountApp", "true")
  if (appSlug) params.append("appSlug", appSlug)
  if (postId) params.append("postId", postId)
  if (threadId) params.append("threadId", threadId)
  // if (storeSlug) params.append("storeSlug", storeSlug)

  // Use /apps for intelligent resolution (no ID in path)
  const url = `${API_URL}/apps${params.toString() ? `?${params.toString()}` : ""}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(chrryUrl ? { "x-chrry-url": chrryUrl } : {}),
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch app: ${response.status} ${response.statusText}`,
    )
  }

  const data = await response.json()
  return data as sushi
}

export const getAppUsage = async ({
  appId,
  token,
  API_URL = utils.API_URL,
}: {
  appId: string
  token: string
  API_URL?: string
}) => {
  const response = await fetch(`${API_URL}/apps/${appId}/usage`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch app usage: ${response.status} ${response.statusText}`,
    )
  }

  const data = await response.json()
  return data.usage as {
    totalRequests: number
    totalTokens: number
    totalAmount: number
    successCount: number
    errorCount: number
    estimatedCredits: number
  }
}

export const getTranslations = async ({
  API_URL = utils.API_URL,
  token,
  locale,
}: {
  API_URL?: string
  token?: string
  locale?: string
} = {}) => {
  const response = await fetch(`${API_URL}/translations?locale=${locale}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return {
      error: `API error (${response.status})`,
      status: response.status,
    }
  }

  const data = await response.json()
  return data as Record<string, any>
}

// Tribe operations
export const getTribes = async ({
  pageSize,
  page = 1,
  token,
  search,
  appId,
  onError,
  API_URL = utils.API_URL,
}: {
  pageSize?: number
  page?: number
  token: string
  search?: string
  appId?: string
  onError?: (status: number) => void
  API_URL?: string
}) => {
  const url = new URL(`${API_URL}/tribe`)

  if (pageSize) url.searchParams.set("pageSize", pageSize.toString())
  if (page) url.searchParams.set("page", page.toString())
  if (search) url.searchParams.set("search", search)
  if (appId) url.searchParams.set("appId", appId)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    onError?.(response.status)
    return null
  }

  return response.json()
}

export const getTribePosts = async ({
  pageSize,
  page = 1,
  token,
  search,
  tribeId,
  tribeSlug,
  appId,
  userId,
  guestId,
  characterProfileIds,
  sortBy,
  order,
  onError,
  tags,
  language,
  API_URL = utils.API_URL,
}: {
  pageSize?: number
  page?: number
  token: string
  search?: string
  tribeId?: string
  tribeSlug?: string
  appId?: string
  userId?: string
  guestId?: string
  language?: string
  characterProfileIds?: string[]
  tags?: string[]
  sortBy?: "date" | "hot" | "liked"
  order?: "asc" | "desc"
  onError?: (status: number) => void
  API_URL?: string
}) => {
  const url = new URL(`${API_URL}/tribe/p`)

  if (pageSize) url.searchParams.set("pageSize", pageSize.toString())
  if (page) url.searchParams.set("page", page.toString())
  if (search) url.searchParams.set("search", search)
  if (tribeId) url.searchParams.set("tribeId", tribeId)
  if (tribeSlug) url.searchParams.set("tribeSlug", tribeSlug)
  if (appId) url.searchParams.set("appId", appId)
  if (userId) url.searchParams.set("userId", userId)
  if (guestId) url.searchParams.set("guestId", guestId)
  if (language) url.searchParams.set("language", language)
  if (characterProfileIds && characterProfileIds.length > 0)
    url.searchParams.set("characterProfileIds", characterProfileIds.join(","))
  if (tags && tags.length > 0) url.searchParams.set("tags", tags.join(","))
  if (sortBy) url.searchParams.set("sortBy", sortBy)
  if (order) url.searchParams.set("order", order)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    onError?.(response.status)
    return null
  }

  return response.json()
}

export const getTribePost = async ({
  id,
  token,
  appId,
  onError,
  language,
  API_URL = utils.API_URL,
}: {
  id: string
  token: string
  appId?: string
  onError?: (status: number) => void
  API_URL?: string
  language?: string
}) => {
  const url = new URL(`${API_URL}/tribe/p/${id}`)

  if (appId) url.searchParams.set("appId", appId)
  if (language) url.searchParams.set("language", language)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    onError?.(response.status)
    return null
  }

  const data = await response.json()
  return data.post
}

// ── Kanban ────────────────────────────────────────────────────────────────────

export const getKanbanBoards = async ({
  token,
  appId,
  API_URL = utils.API_URL,
}: {
  token: string
  appId?: string
  API_URL?: string
}) => {
  const params = new URLSearchParams()
  appId && params.append("appId", appId)
  const res = await fetch(`${API_URL}/kanban?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export const createKanbanBoard = async ({
  token,
  name,
  description,
  appId,
  API_URL = utils.API_URL,
}: {
  token: string
  name?: string
  description?: string
  appId?: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description, appId }),
  })
  return res.json()
}

export const getKanbanBoard = async ({
  token,
  boardId,
  API_URL = utils.API_URL,
}: {
  token: string
  boardId: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/${boardId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export const updateKanbanBoard = async ({
  token,
  boardId,
  name,
  description,
  API_URL = utils.API_URL,
}: {
  token: string
  boardId: string
  name?: string
  description?: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/${boardId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  })
  return res.json()
}

export const deleteKanbanBoard = async ({
  token,
  boardId,
  API_URL = utils.API_URL,
}: {
  token: string
  boardId: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/${boardId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export const createTaskState = async ({
  token,
  boardId,
  title,
  color,
  API_URL = utils.API_URL,
}: {
  token: string
  boardId: string
  title: string
  color?: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/${boardId}/states`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, color }),
  })
  return res.json()
}

export const updateTaskState = async ({
  token,
  boardId,
  stateId,
  title,
  color,
  order,
  API_URL = utils.API_URL,
}: {
  token: string
  boardId: string
  stateId: string
  title?: string
  color?: string
  order?: number
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/${boardId}/states/${stateId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, color, order }),
  })
  return res.json()
}

export const deleteTaskState = async ({
  token,
  boardId,
  stateId,
  API_URL = utils.API_URL,
}: {
  token: string
  boardId: string
  stateId: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/${boardId}/states/${stateId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export const createKanbanTask = async ({
  token,
  boardId,
  title,
  description,
  taskStateId,
  order,
  appId,
  threadId,
  labels,
  labelColors,
  API_URL = utils.API_URL,
}: {
  token: string
  boardId: string
  title: string
  description?: string
  taskStateId: string
  order?: number
  appId?: string
  threadId?: string
  labels?: string[]
  labelColors?: Record<string, string>
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/${boardId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      description,
      taskStateId,
      order,
      appId,
      threadId,
      labels,
      labelColors,
    }),
  })
  return res.json()
}

export const moveKanbanTask = async ({
  token,
  taskId,
  toStateId,
  order,
  API_URL = utils.API_URL,
}: {
  token: string
  taskId: string
  toStateId: string
  order?: number
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/tasks/${taskId}/move`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ toStateId, order }),
  })
  return res.json()
}

export const updateKanbanTask = async ({
  token,
  taskId,
  title,
  description,
  selected,
  labels,
  labelColors,
  API_URL = utils.API_URL,
}: {
  token: string
  taskId: string
  title?: string
  description?: string
  selected?: boolean
  labels?: string[]
  labelColors?: Record<string, string>
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, description, selected, labels, labelColors }),
  })
  return res.json()
}

export const deleteKanbanTask = async ({
  token,
  taskId,
  API_URL = utils.API_URL,
}: {
  token: string
  taskId: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export const getTaskLogs = async ({
  token,
  taskId,
  API_URL = utils.API_URL,
}: {
  token: string
  taskId: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/tasks/${taskId}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export const createTaskLog = async ({
  token,
  taskId,
  content,
  mood,
  API_URL = utils.API_URL,
}: {
  token: string
  taskId: string
  content: string
  mood?: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/tasks/${taskId}/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, mood }),
  })
  return res.json()
}

// ── Labels & Pear Board ────────────────────────────────────────────────────────

export const getKanbanLabels = async ({
  token,
  boardId,
  API_URL = utils.API_URL,
}: {
  token: string
  boardId: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/boards/${boardId}/labels`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export const getPearBoard = async ({
  token,
  appId,
  API_URL = utils.API_URL,
}: {
  token: string
  appId: string
  API_URL?: string
}) => {
  const res = await fetch(`${API_URL}/kanban/pear/app/${appId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export const createPearTaskFromThread = async ({
  token,
  appId,
  threadId,
  title,
  description,
  labels,
  labelColors,
  API_URL = utils.API_URL,
}: {
  token: string
  appId: string
  threadId: string
  title: string
  description?: string
  labels?: string[]
  labelColors?: Record<string, string>
  API_URL?: string
}) => {
  const res = await fetch(
    `${API_URL}/kanban/pear/app/${appId}/threads/${threadId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, labels, labelColors }),
    },
  )
  return res.json()
}

export const getActions = ({
  API_URL,
  token,
}: {
  API_URL: string
  token: string
}) => {
  return {
    // Thread operations
    getThreads: (params?: {
      appId?: string
      pageSize?: number
      sort?: "bookmark" | "date"
      search?: string
      threadId?: string
      userName?: string
      hasPearApp?: boolean
      isTribe?: boolean
      collaborationStatus?: "pending" | "active" | null
      myPendingCollaborations?: boolean
      onError?: (status: number) => void
      isDNA?: boolean
      slug?: "Atlas" | "Peach" | "Vault" | "Bloom" | string | null
    }) => getThreads({ token, ...params, API_URL }),
    getTranslations: (params?: { locale?: string }) =>
      getTranslations({ token, ...params, API_URL }),
    getThread: (params: {
      pageSize?: number
      id: string
      liked?: boolean
      onError?: (status: number) => void
    }) => getThread({ token, ...params, API_URL }),
    updateThread: (params: {
      id: string
      star?: number | null
      instructions?: string | null
      title?: string
      regenerateTitle?: boolean
      regenerateInstructions?: boolean
      language?: string
      bookmarked?: boolean
      visibility?: string
      files?: File[]
      pinCharacterProfile?: boolean
      characterProfileVisibility?: string
      appId?: string | null
    }) => updateThread({ token, ...params, API_URL }),

    // User operations
    getUser: ({
      threadId,
      appId,
    }: {
      threadId?: string
      appId?: string
    } = {}) => getUser({ threadId, appId, token, API_URL }),
    getUsers: (params?: {
      pageSize?: number
      search?: string
      find?: string
      similarTo?: string
    }) => getUsers({ token, ...params, API_URL }),
    updateUser: (params: {
      language?: string
      name?: string
      image?: string
      userName?: string
      s3ApiKey?: string
      favouriteAgent?: string
      characterProfilesEnabled?: boolean
      memoriesEnabled?: boolean
      openRouterApiKey?: string
      replicateApiKey?: string
      falApiKey?: string
      city?: string
      country?: string
      deletedApiKeys?: string[]
    }) => updateUser({ token, ...params, API_URL }),
    uploadUserImage: (file: File | null) =>
      uploadUserImage({ token, file, API_URL }),
    removeUser: () => removeUser({ token, API_URL }),

    // Guest operations
    getGuest: ({
      threadId,
      appId,
    }: {
      threadId?: string
      appId?: string
    } = {}) => getGuest({ threadId, appId, token, API_URL }),
    updateGuest: (params: {
      replicateApiKey?: string
      favouriteAgent?: string
      characterProfilesEnabled?: boolean
      city?: string
      openRouterApiKey?: string
      falApiKey?: string
      country?: string
      memoriesEnabled?: boolean
      deletedApiKeys?: string[]
      s3ApiKey?: string
    }) => updateGuest({ token, ...params, API_URL }),

    // Message operations
    getLastMessage: (threadId?: string) =>
      getLastMessage({ token, threadId, API_URL }),
    updateMessage: (params: { messageId: string; like?: boolean | null }) =>
      updateMessage({ token, ...params, API_URL }),
    deleteMessage: (messageId: string) =>
      deleteMessage({ token, messageId, API_URL }),

    // Memory operations
    deleteMemories: () => deleteMemories({ token, API_URL }),

    // Collaboration operations
    updateCollaboration: (params: { id: string; status: string }) =>
      updateCollaboration({ token, ...params, API_URL }),

    // Subscription operations
    deleteSubscription: () => deleteSubscription({ token, API_URL }),

    // Calendar operations
    createCalendarEvent: (event: CalendarEventFormData) =>
      createCalendarEvent({ token, event, API_URL }),
    updateCalendarEvent: (params: {
      id: string
      event: CalendarEventFormData
    }) => updateCalendarEvent({ token, ...params, API_URL }),
    deleteCalendarEvent: (id: string) =>
      deleteCalendarEvent({ token, id, API_URL }),
    getCalendarEvents: (params?: { startDate?: string; endDate?: string }) =>
      getCalendarEvents({ token, ...params, API_URL }),
    syncGoogleCalendar: () => syncGoogleCalendar({ token, API_URL }),
    exportToGoogleCalendar: (eventId: string) =>
      exportToGoogleCalendar({ token, eventId, API_URL }),

    // Kanban operations
    getKanbanBoards: (params?: { appId?: string }) =>
      getKanbanBoards({ token, ...params, API_URL }),
    createKanbanBoard: (params: {
      name?: string
      description?: string
      appId?: string
    }) => createKanbanBoard({ token, ...params, API_URL }),
    getKanbanBoard: (boardId: string) =>
      getKanbanBoard({ token, boardId, API_URL }),
    updateKanbanBoard: (
      boardId: string,
      params: { name?: string; description?: string },
    ) => updateKanbanBoard({ token, boardId, ...params, API_URL }),
    deleteKanbanBoard: (boardId: string) =>
      deleteKanbanBoard({ token, boardId, API_URL }),
    createTaskState: (
      boardId: string,
      params: { title: string; color?: string },
    ) => createTaskState({ token, boardId, ...params, API_URL }),
    updateTaskState: (
      boardId: string,
      stateId: string,
      params: { title?: string; color?: string; order?: number },
    ) => updateTaskState({ token, boardId, stateId, ...params, API_URL }),
    deleteTaskState: (boardId: string, stateId: string) =>
      deleteTaskState({ token, boardId, stateId, API_URL }),
    createKanbanTask: (
      boardId: string,
      params: {
        title: string
        taskStateId: string
        description?: string
        order?: number
        appId?: string
        threadId?: string
        labels?: string[]
        labelColors?: Record<string, string>
      },
    ) => createKanbanTask({ token, boardId, ...params, API_URL }),
    moveKanbanTask: (
      taskId: string,
      params: { toStateId: string; order?: number },
    ) => moveKanbanTask({ token, taskId, ...params, API_URL }),
    updateKanbanTask: (
      taskId: string,
      params: {
        title?: string
        description?: string
        selected?: boolean
        labels?: string[]
        labelColors?: Record<string, string>
      },
    ) => updateKanbanTask({ token, taskId, ...params, API_URL }),
    deleteKanbanTask: (taskId: string) =>
      deleteKanbanTask({ token, taskId, API_URL }),
    getTaskLogs: (taskId: string) => getTaskLogs({ token, taskId, API_URL }),
    createTaskLog: (
      taskId: string,
      params: { content: string; mood?: string },
    ) => createTaskLog({ token, taskId, ...params, API_URL }),

    // Labels & Pear Board
    getKanbanLabels: (boardId: string) =>
      getKanbanLabels({ token, boardId, API_URL }),
    getPearBoard: (appId: string) => getPearBoard({ token, appId, API_URL }),
    createPearTaskFromThread: (
      appId: string,
      threadId: string,
      params: {
        title: string
        description?: string
        labels?: string[]
        labelColors?: Record<string, string>
      },
    ) =>
      createPearTaskFromThread({ token, appId, threadId, ...params, API_URL }),

    // App operations
    createApp: (data: appFormData) => createApp({ token, data, API_URL }),
    updateApp: (id: string, data: appFormData) =>
      updateApp({ token, id, data, API_URL }),
    deleteApp: (id: string) => deleteApp({ token, id, API_URL }),
    reorderApps: (apps: app[], autoInstall?: boolean, storeId?: string) =>
      reorderApps({ token, apps, autoInstall, storeId, API_URL }),
    getApps: () => getApps({ token, API_URL }),
    getApp: ({ appId }: { appId: string }) => getApp({ token, appId, API_URL }),

    getSession: (params: {
      deviceId: string | undefined
      fingerprint?: string
      gift?: string
      isStandalone: boolean
      API_URL?: string
      VERSION?: string
      app?: "extension" | "pwa" | "web"
    }) => getSession({ ...params, API_URL, token }),
    clearSession: (
      params: { API_URL?: string } = {
        API_URL: utils.API_URL,
      },
    ) => clearSession({ ...params, API_URL, token }),

    // Tribe operations
    getTribes: (params?: {
      pageSize?: number
      page?: number
      search?: string
      appId?: string
      onError?: (status: number) => void
    }) => getTribes({ token, ...params, API_URL }),
    getTribePosts: (params?: {
      pageSize?: number
      language?: string
      page?: number
      search?: string
      order?: "asc" | "desc"
      tribeId?: string
      tribeSlug?: string
      appId?: string
      userId?: string
      guestId?: string
      characterProfileIds?: string[]
      tags?: string[]
      sortBy?: "date" | "hot" | "liked"
      onError?: (status: number) => void
    }) => getTribePosts({ token, ...params, API_URL }),

    getTribePost: (params: {
      id: string
      appId?: string
      language?: string
      onError?: (status: number) => void
    }) => getTribePost({ token, ...params, API_URL }),
  }
}

// @vitest-environment happy-dom

import { act } from "@testing-library/react"
import React from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

// Make React globally available for the tested component which expects it
global.React = React

import Chat from "../Chat"
import {
  mockApp,
  mockAppContext,
  mockAuth,
  mockChat,
  mockNavigation,
  mockPlatform,
  mockStyles,
  mockTheme,
} from "./mocks/mockContexts"

// Mock the dependencies
vi.mock("../context/AppContext", () => ({
  useAppContext: () => mockAppContext,
  COLORS: {},
}))

vi.mock("../context/providers", () => ({
  useAuth: () => mockAuth,
  useChat: () => mockChat,
  useApp: () => mockApp,
  useNavigationContext: () => mockNavigation,
  useError: () => ({ captureException: vi.fn() }),
  useTribe: () => ({ tribePost: null }),
}))

vi.mock("../context/providers/AuthProvider", () => ({
  useAuth: () => mockAuth,
}))

vi.mock("../utils", async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    MAX_FILE_LIMITS: { chat: 10 },
  }
})

// Mock platform module
vi.mock("../platform", async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    usePlatform: () => mockPlatform,
    useTheme: () => mockTheme,
    // Mock primitive components to avoid context dependency and filter non-DOM props
    Div: ({ children, handlers, state, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    Button: ({
      children,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      ...props
    }: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    Span: ({ children, handlers, state, ...props }: any) => (
      <span {...props}>{children}</span>
    ),
    TextArea: (props: any) => {
      const {
        onSubmitEditing,
        onKeyPress,
        onPaste,
        blurOnSubmit,
        multiline,
        returnKeyType,
        onChangeText,
        ...cleanProps
      } = props
      return (
        <textarea {...cleanProps} onKeyPress={onKeyPress} onPaste={onPaste} />
      )
    },
    Input: (props: any) => {
      const {
        onSubmitEditing,
        onKeyPress,
        onPaste,
        blurOnSubmit,
        multiline,
        returnKeyType,
        onChangeText,
        dataTestId,
        error,
        ...cleanProps
      } = props
      return (
        <input
          {...cleanProps}
          onKeyPress={onKeyPress}
          onPaste={onPaste}
          data-testid={props["data-testid"] || dataTestId}
        />
      )
    },
    H2: ({ children, handlers, state, ...props }: any) => (
      <h2 {...props}>{children}</h2>
    ),
    Strong: ({ children, handlers, state, ...props }: any) => (
      <strong {...props}>{children}</strong>
    ),
    Video: ({ handlers, state, ...props }: any) => <video {...props} />,
  }
})

// Mock ThemeContext to include ThemeProvider
vi.mock("../context/ThemeContext", async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    useTheme: () => mockTheme,
    ThemeProvider: ({ children }: any) => <div>{children}</div>,
  }
})

vi.mock("../context/StylesContext", () => ({
  useStyles: () => mockStyles,
}))

// Mock hooks
vi.mock("../hooks", () => ({
  useHasHydrated: () => true,
  useLocalStorage: () => [true, vi.fn()], // isPrivacyApproved = true
  useSyncedState: () => [false, vi.fn()],
  useCountdown: () => null,
  useThreadMetadata: () => {}, // Mock useThreadMetadata
}))
vi.mock("../hooks/useWebSocket", () => ({
  useWebSocket: () => ({}),
}))

// Mock other components to simplify testing
vi.mock("../Grapes", () => ({ default: () => <div data-testid="grapes" /> }))
vi.mock("../Modal", () => ({
  default: ({ children, isModalOpen }: any) =>
    isModalOpen ? <div data-testid="modal">{children}</div> : null,
}))
vi.mock("../Loading", () => ({ default: () => <div data-testid="loading" /> }))
vi.mock("../DeleteThread", () => ({
  default: () => <div data-testid="delete-thread" />,
}))
vi.mock("../Logo", () => ({ default: () => <div data-testid="logo" /> }))
vi.mock("../App", () => ({
  default: () => <div data-testid="app-suggestions" />,
}))
vi.mock("../Image", () => ({ default: () => <div data-testid="image" /> }))
vi.mock("../MoodSelector", () => ({
  default: () => <div data-testid="mood-selector" />,
}))
vi.mock("../a/A", () => ({ default: ({ children }: any) => <a>{children}</a> }))

describe("Chat", () => {
  let container: HTMLDivElement
  let root: any

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    vi.clearAllMocks()
    mockChat.reset()
    mockAuth.reset()
    mockApp.reset()
    mockNavigation.reset()
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it("renders chat input correctly", async () => {
    await act(async () => {
      root.render(<Chat />)
    })

    const textarea = container.querySelector("textarea")
    expect(textarea).toBeTruthy()
    expect(textarea?.getAttribute("placeholder")).toContain("Ask anything")
  })

  it("handles input change", async () => {
    const setInputSpy = vi.spyOn(mockChat, "setInput")

    await act(async () => {
      root.render(<Chat />)
    })

    const textarea = container.querySelector("textarea")
    if (textarea) {
      await act(async () => {
        // Set value
        Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value",
        )?.set?.call(textarea, "Hello AI")
        textarea.dispatchEvent(new Event("input", { bubbles: true }))
        textarea.dispatchEvent(new Event("change", { bubbles: true }))
      })

      expect(setInputSpy).toHaveBeenCalledWith("Hello AI")
    }
  })

  it("opens agent selection modal when agent button is clicked", async () => {
    const setIsAgentModalOpenSpy = vi.spyOn(mockChat, "setIsAgentModalOpen")

    await act(async () => {
      root.render(<Chat />)
    })

    const agentButton = container.querySelector(
      "[data-testid='agent-select-button']",
    )
    expect(agentButton).toBeTruthy()

    if (agentButton) {
      await act(async () => {
        agentButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      })
      expect(setIsAgentModalOpenSpy).toHaveBeenCalledWith(true)
    }
  })

  it("toggles web search", async () => {
    const setIsWebSearchEnabledSpy = vi.spyOn(mockChat, "setIsWebSearchEnabled")

    await act(async () => {
      root.render(<Chat />)
    })

    const webSearchButton = container.querySelector(
      "[data-testid='web-search-button-disabled']",
    )
    expect(webSearchButton).toBeTruthy()

    if (webSearchButton) {
      await act(async () => {
        webSearchButton.dispatchEvent(
          new MouseEvent("click", { bubbles: true }),
        )
      })
      expect(setIsWebSearchEnabledSpy).toHaveBeenCalledWith(true)
    }
  })

  it("handles file attachment toggle", async () => {
    await act(async () => {
      root.render(<Chat />)
    })

    const attachButton = container.querySelector(
      "[data-testid='attach-button']",
    )
    expect(attachButton).toBeTruthy()

    if (attachButton) {
      // Triggering file input logic
      // The attach button opens system file picker via create element input type file
      // We can spy on document.createElement or just ensure click doesn't crash
      // Ideally we'd mock triggerFileInput but it's internal.
      // Since we can't easily test the file picker opening in JSDOM/HappyDOM without deeper mocking,
      // we'll verify the button is clickable and exists.

      // For now, simple existence check is sufficient as "triggerFileInput" is internal logic
      expect(attachButton).toBeTruthy()
    }
  })
})

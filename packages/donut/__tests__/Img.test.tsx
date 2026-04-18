import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import Img from "../Img"

// Mock the platform imports
vi.mock("../platform", () => ({
  MotiView: ({ children, onLoad }: any) => (
    <div onLoad={onLoad}>{children}</div>
  ),
  Image: ({ onLoad, ...props }: any) => (
    <img alt="mock-img" onLoad={onLoad} {...props} />
  ),
  Span: ({ children, style, className }: any) => (
    <span style={style} className={className}>
      {children}
    </span>
  ),
  useTheme: () => ({ reduceMotion: true }),
}))

// Mock useInView
vi.mock("../platform/useInView", () => ({
  useInView: ({ skip }: { skip?: boolean }) => ({
    ref: vi.fn(),
    inView: true,
  }),
}))

describe.skip("Img component", () => {
  let originalImage: any

  beforeEach(() => {
    originalImage = window.Image
  })

  afterEach(() => {
    if (typeof window !== "undefined") {
      window.Image = originalImage
    }
  })

  it("renders correctly and starts loading", async () => {
    const decodeMock = vi.fn().mockResolvedValue(undefined)
    window.Image = class {
      src = ""
      width = 100
      height = 100
      decode = decodeMock
    } as any

    render(
      <Img src="https://example.com/test1.jpg" alt="test image" width={100} />,
    )

    await waitFor(() => {
      expect(decodeMock).toHaveBeenCalled()
      expect(screen.getByAltText("test image")).toBeDefined()
    })
  })

  it("loads from cache on second render", async () => {
    const decodeMock = vi.fn().mockResolvedValue(undefined)
    window.Image = class {
      src = ""
      width = 100
      height = 100
      decode = decodeMock
    } as any

    const { rerender } = render(
      <Img
        src="https://example.com/cached.jpg"
        alt="cached image"
        width={100}
      />,
    )

    await waitFor(() => {
      expect(decodeMock).toHaveBeenCalled()
    })

    decodeMock.mockClear()

    rerender(
      <Img
        src="https://example.com/cached.jpg"
        alt="cached image"
        width={100}
      />,
    )

    await waitFor(() => {
      expect(screen.getByAltText("cached image")).toBeDefined()
    })
  })

  it("loads from cache with dimensions handler", async () => {
    const decodeMock = vi.fn().mockResolvedValue(undefined)
    window.Image = class {
      src = ""
      width = 120
      height = 120
      decode = decodeMock
    } as any

    render(
      <Img
        src="https://example.com/cached-dim.jpg"
        alt="cached dim"
        width={120}
      />,
    )

    await waitFor(() => {
      expect(decodeMock).toHaveBeenCalled()
    })

    decodeMock.mockClear()
    const handleDimensionsChange = vi.fn()

    render(
      <Img
        src="https://example.com/cached-dim.jpg"
        alt="cached dim"
        width={120}
        handleDimensionsChange={handleDimensionsChange}
      />,
    )

    await waitFor(() => {
      expect(handleDimensionsChange).toHaveBeenCalledWith({
        width: 120,
        height: 120,
      })
    })
  })

  it("handles decode error in cache gracefully", async () => {
    const decodeMock = vi.fn().mockResolvedValue(undefined)
    window.Image = class {
      src = ""
      width = 120
      height = 120
      decode = decodeMock
    } as any

    render(
      <Img
        src="https://example.com/cached-err.jpg"
        alt="cached err"
        width={120}
      />,
    )

    await waitFor(() => {
      expect(decodeMock).toHaveBeenCalled()
    })

    decodeMock.mockRejectedValue(new Error("err"))
    const handleDimensionsChange = vi.fn()

    render(
      <Img
        src="https://example.com/cached-err.jpg"
        alt="cached err"
        width={120}
        handleDimensionsChange={handleDimensionsChange}
      />,
    )

    await waitFor(() => {
      // By using findAllByAltText we ensure we just check if it exists at least once
      expect(screen.queryAllByAltText("cached err").length).toBeGreaterThan(0)
    })
  })

  it("prioritizes loading when priority prop is true", async () => {
    const decodeMock = vi.fn().mockResolvedValue(undefined)
    window.Image = class {
      src = ""
      width = 100
      height = 100
      decode = decodeMock
    } as any

    render(
      <Img
        src="https://example.com/priority.jpg"
        alt="priority image"
        width={100}
        priority
      />,
    )

    await waitFor(() => {
      expect(decodeMock).toHaveBeenCalled()
      expect(screen.getByAltText("priority image")).toBeDefined()
    })
  })

  it("handles dimensions change callback", async () => {
    const decodeMock = vi.fn().mockResolvedValue(undefined)
    window.Image = class {
      src = ""
      width = 150
      height = 150
      decode = decodeMock
    } as any
    const handleDimensionsChange = vi.fn()

    render(
      <Img
        src="https://example.com/dim.jpg"
        alt="dim image"
        width={150}
        handleDimensionsChange={handleDimensionsChange}
      />,
    )

    await waitFor(() => {
      expect(decodeMock).toHaveBeenCalled()
      expect(handleDimensionsChange).toHaveBeenCalledWith({
        width: 150,
        height: 150,
      })
    })
  })

  it("handles decode error gracefully", async () => {
    const decodeMock = vi.fn().mockRejectedValue(new Error("Decode failed"))
    window.Image = class {
      src = ""
      decode = decodeMock
    } as any

    render(
      <Img
        src="https://example.com/error.jpg"
        width={100}
        showLoading={true}
      />,
    )

    await waitFor(() => {
      expect(decodeMock).toHaveBeenCalled()
      expect(screen.queryByAltText("error.jpg")).toBeNull()
    })
  })
})

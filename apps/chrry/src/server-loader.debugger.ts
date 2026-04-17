import { beforeEach, describe, expect, it, vi } from "vite-plus/test"
import { getBlogPost, getBlogPosts } from "./blog-loader"
import { loadServerData, type ServerRequest } from "./server-loader"

// Mock dependencies
vi.mock("uuid", () => ({
  v4: () => "mock-uuid",
  validate: () => true,
}))

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
}))

vi.mock("@chrryai/donut/utils", () => ({
  VERSION: "1.0.0",
  getThreadId: () => null,
  getPostId: () => null,
  pageSizes: { threads: 10, menuThreads: 10 },
  isE2E: false,
  getEnv: () => ({}),
  API_INTERNAL_URL: "http://api.internal",
}))

vi.mock("@chrryai/donut/utils/url", () => ({
  getAppAndStoreSlugs: () => ({ storeSlug: "", appSlug: "" }),
  excludedSlugRoutes: [],
}))

vi.mock("@chrryai/donut/lib", () => ({
  getApp: vi.fn().mockResolvedValue({
    id: "app-id",
    slug: "app-slug",
    backgroundColor: "#ffffff",
  }),
  getSession: vi.fn().mockResolvedValue({
    user: { token: "mock-token" },
    fingerprint: "mock-fp",
  }),
  getThread: vi.fn().mockResolvedValue(undefined),
  getThreads: vi.fn().mockResolvedValue({ threads: [], totalCount: 0 }),
  getTranslations: vi.fn().mockResolvedValue({}),
  getTribes: vi.fn().mockResolvedValue({ tribes: [], totalCount: 0 }),
  getTribePosts: vi.fn().mockResolvedValue({ posts: [], totalCount: 0 }),
  getTribePost: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@chrryai/donut/locales", () => ({
  locale: "en",
  locales: ["en", "es"],
}))

vi.mock("@chrryai/donut/utils/siteConfig", () => ({
  getSiteConfig: () => ({ url: "http://localhost" }),
}))

vi.mock("./blog-loader", () => ({
  getBlogPosts: vi.fn(),
  getBlogPost: vi.fn(),
}))

vi.mock("./server-metadata", () => ({
  generateServerMetadata: vi.fn().mockResolvedValue({}),
}))

describe("loadServerData", () => {
  const mockRequest: ServerRequest = {
    url: "http://localhost/blog",
    hostname: "localhost",
    pathname: "/blog",
    headers: { "user-agent": "Googlebot/2.1" },
    cookies: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should prefetch blog posts when pathname is /blog", async () => {
    const mockPosts = [{ slug: "post-1", title: "Post 1" }]
    vi.mocked(getBlogPosts).mockResolvedValue(mockPosts as any)

    const result = await loadServerData(mockRequest)

    expect(getBlogPosts).toHaveBeenCalled()
    expect(result.blogPosts).toEqual(mockPosts)
    expect(result.isBlogRoute).toBe(true)
  })

  it("should prefetch a single blog post when pathname is /blog/:slug", async () => {
    const mockPost = { slug: "post-1", title: "Post 1", content: "Content" }
    vi.mocked(getBlogPost).mockResolvedValue(mockPost as any)

    const request = {
      ...mockRequest,
      pathname: "/blog/post-1",
      url: "http://localhost/blog/post-1",
    }
    const result = await loadServerData(request)

    expect(getBlogPost).toHaveBeenCalledWith("post-1")
    expect(result.blogPost).toEqual(mockPost)
    expect(result.isBlogRoute).toBe(true) // Should be true because it's a blog route (either list or post)
    // Wait, the logic is: isBlogList || isBlogPost -> isBlogRoute
    // Yes.
  })

  it("should not fetch blog data for other routes", async () => {
    const request = { ...mockRequest, pathname: "/", url: "http://localhost/" }
    const result = await loadServerData(request)

    expect(getBlogPosts).not.toHaveBeenCalled()
    expect(getBlogPost).not.toHaveBeenCalled()
    expect(result.blogPosts).toBeUndefined()
    expect(result.blogPost).toBeUndefined()
    expect(result.isBlogRoute).toBe(false)
  })

  it("should handle errors in blog data fetching gracefully", async () => {
    vi.mocked(getBlogPosts).mockRejectedValue(new Error("Failed"))

    const result = await loadServerData(mockRequest)

    expect(getBlogPosts).toHaveBeenCalled()
    expect(result.blogPosts).toBeUndefined()
    // It shouldn't throw
  })
})

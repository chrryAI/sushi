import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  image?: string
  tags?: string[]
  keywords?: string[]
}

export interface BlogPostWithContent extends BlogPost {
  content: string
}

const BLOG_DIR = path.join(process.cwd(), "content/blog")

// Cache variables
let cachedPosts: BlogPost[] | null = null
const cachedPostContent = new Map<string, BlogPostWithContent>()

/**
 * Sanitize slug for URL safety
 */
function sanitizeSlug(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
}

/**
 * Get all blog posts sorted by date (newest first)
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  // Return cached result in production
  if (process.env.NODE_ENV === "production" && cachedPosts) {
    return cachedPosts
  }

  try {
    const files = await fs.readdir(BLOG_DIR)

    const posts = (
      await Promise.all(
        files
          .filter((file) => file.endsWith(".md"))
          .map(async (file) => {
            const filePath = path.join(BLOG_DIR, file)
            const content = await fs.readFile(filePath, "utf-8")
            const { data } = matter(content)

            return {
              slug: sanitizeSlug(file.replace(".md", "")),
              title: data.title || "Untitled",
              excerpt: data.excerpt || "No excerpt available",
              date: data.date || new Date().toISOString().split("T")[0],
              author: data.author || "Anonymous",
              image: data.image,
              tags: data.tags || [],
              keywords: data.keywords || [],
            }
          }),
      )
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Cache result in production
    if (process.env.NODE_ENV === "production") {
      cachedPosts = posts
    }

    return posts
  } catch (error) {
    console.error("Error reading blog posts:", error)
    return []
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(
  slug: string,
): Promise<BlogPostWithContent | null> {
  // Return cached result in production
  // Sanitize slug early to prevent path traversal
  const safeSlug = sanitizeSlug(slug)

  if (
    process.env.NODE_ENV === "production" &&
    cachedPostContent.has(safeSlug)
  ) {
    return cachedPostContent.get(safeSlug)!
  }

  try {
    const filePath = path.join(BLOG_DIR, `${safeSlug}.md`)

    try {
      await fs.access(filePath)
    } catch {
      return null
    }

    const fileContent = await fs.readFile(filePath, "utf-8")
    const { data, content } = matter(fileContent)

    const post: BlogPostWithContent = {
      slug: safeSlug,
      title: data.title || "Untitled",
      excerpt: data.excerpt || "No excerpt available",
      date: data.date || new Date().toISOString().split("T")[0],
      author: data.author || "Anonymous",
      image: data.image,
      tags: data.tags || [],
      keywords: data.keywords || [],
      content, // React-markdown handles rendering safely
    }

    // Cache result in production
    if (process.env.NODE_ENV === "production") {
      cachedPostContent.set(safeSlug, post)
    }

    return post
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error)
    return null
  }
}

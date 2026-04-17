/**
 * Generated from BlogPost.module.scss
 * Auto-converted SCSS to Unified Styles
 *
 * Works on both web and native! 🎉
 */

export const BlogPostStyleDefs = {
  backToBlog: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    marginBottom: 5,
    fontSize: 14,
  },
  video: {
    width: 50,
    height: 50,
    objectFit: "cover",
    borderRadius: "50%",
  },
  videoContainer: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    position: "relative",
    top: 10,
    fontSize: 15,
  },
  backToBlogContainer: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  date: {
    fontSize: 13,
  },
} as const

import { createStyleHook } from "../../../../packages/donut/styles/createStyleHook"
import { createUnifiedStyles } from "../../../../packages/donut/styles/createUnifiedStyles"

export const BlogPostStyles = createUnifiedStyles(BlogPostStyleDefs)

// Type for the hook return value
type BlogPostStylesHook = {
  [K in keyof typeof BlogPostStyleDefs]: {
    className?: string
    style?: Record<string, any>
  }
}

// Create the style hook using the factory
export const useBlogPostStyles =
  createStyleHook<BlogPostStylesHook>(BlogPostStyles)

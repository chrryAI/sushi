import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { BlogPostWithContent } from "../blog-loader"
import { safeJSONStringify } from "../utils/security"

import styles from "./BlogPost.module.scss"

interface BlogPostProps {
  post: BlogPostWithContent
  locale: string
}

// Optimization: Move plugins array outside to prevent re-creation on render
const REMARK_PLUGINS = [remarkGfm]

// Optimization: Custom components for better performance (lazy load images)
const MARKDOWN_COMPONENTS: Components = {
  img: (props) => (
    <img
      {...props}
      loading="lazy"
      alt={props.alt}
      decoding="async"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  ),
}

// Optimization: Move intervals definition outside to avoid reallocation
const TIME_INTERVALS = [
  { label: "year", seconds: 31536000 },
  { label: "month", seconds: 2592000 },
  { label: "day", seconds: 86400 },
  { label: "hour", seconds: 3600 },
  { label: "minute", seconds: 60 },
]

// Optimization: Move utility function outside component
const timeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  for (const interval of TIME_INTERVALS) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`
    }
  }

  return "just now"
}

export default function BlogPost({ post, locale }: BlogPostProps) {
  return (
    <div style={{ maxWidth: 768 }}>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJSONStringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: {
              "@type": "Person",
              name: post.author,
            },
            keywords: post.keywords?.join(", ") || "",
          }),
        }}
      />

      <nav aria-label="Breadcrumb" className={styles.backToBlogContainer}>
        <a
          className={styles.backToBlog}
          href="/blog"
          aria-label="Return to blog index"
        >
          ← Back to Blog
        </a>
      </nav>

      <article className={styles.article}>
        <div
          className={styles.date}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: ".9rem",
            marginTop: 10,
            marginBottom: 10,
          }}
        >
          <video
            src={`https://chrry.ai/video/blob.mp4`}
            autoPlay
            loop
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: "50%",
            }}
            muted
            playsInline
          ></video>{" "}
          <time
            dateTime={post.date}
            title={new Date(post.date).toLocaleString(locale, {
              dateStyle: "long",
              timeStyle: "short",
            })}
          >
            {timeAgo(post.date)}
          </time>{" "}
          by {post.author}
        </div>

        <ReactMarkdown
          remarkPlugins={REMARK_PLUGINS}
          components={MARKDOWN_COMPONENTS}
        >
          {post.content}
        </ReactMarkdown>
      </article>
    </div>
  )
}

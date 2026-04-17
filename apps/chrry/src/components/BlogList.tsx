import type { BlogPost } from "../blog-loader"

import styles from "./BlogList.module.scss"

interface BlogListProps {
  posts: BlogPost[]
  locale: string
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

export default function BlogList({ posts, locale }: BlogListProps) {
  return (
    <div>
      <h1 className={styles.title}>Blog</h1>
      {posts.length === 0 ? (
        <p className={styles.emptyState}>
          No posts found. Check back later! 🌱
        </p>
      ) : (
        <ul className={styles.blogList}>
          {posts.map((post) => (
            <li key={post.slug} style={{ padding: ".8rem 0" }}>
              <article>
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: 0,
                    fontSize: "1.1rem",
                  }}
                >
                  <a
                    href={`/blog/${post.slug}`}
                    aria-label={`Read full post: ${post.title}`}
                  >
                    {post.title}
                  </a>
                </h2>
                <p>{post.excerpt}</p>
                <small>
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
                </small>
                <br />
                <a
                  href={`/blog/${post.slug}`}
                  className={styles.readMore}
                  aria-label={`Read more about ${post.title}`}
                >
                  Read more →
                </a>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

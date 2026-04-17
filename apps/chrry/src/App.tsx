import "@chrryai/donut/styles.scss"
import "@chrryai/donut/styles/view-transitions.css"
import Chrry from "chrry/Chrry"
import Skeleton from "chrry/Skeleton"
import { API_URL, CF_BEACON, isDevelopment } from "chrry/utils"
import { lazy, Suspense } from "react"
import { Helmet } from "react-helmet-async"
import type { ServerData } from "./server-loader"

// Lazy load blog components to reduce initial bundle size
const BlogList = lazy(() => import("./components/BlogList"))
const BlogPost = lazy(() => import("./components/BlogPost"))

interface AppProps {
  serverData?: ServerData
}

function App({ serverData }: AppProps) {
  // Debug: Log server data

  // Handle API errors
  if (serverData?.apiError) {
    return (
      <div
        style={{
          fontFamily: "system-ui",
          padding: "40px",
          maxWidth: "800px",
          margin: "0 auto",
          background: "#0a0a0a",
          color: "#e5e5e5",
          minHeight: "100vh",
        }}
      >
        <pre
          style={{
            background: "#1a1a1a",
            padding: "20px",
            borderRadius: "4px",
            overflow: "auto",
          }}
        >
          {/* {serverData?.apiError instanceof Error
            ? `${serverData.apiError.name}: ${serverData.apiError.message}\n\n${serverData.apiError.stack}`
            : JSON.stringify(serverData?.apiError, null, 2)} */}
          {JSON.stringify(serverData?.siteConfig, null, 2)}
        </pre>
      </div>
    )
  }

  // Handle session errors
  if (serverData?.session && "error" in serverData.session) {
    return (
      <div
        style={{
          fontFamily: "system-ui",
          padding: "40px",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ color: "#ef4444" }}>Session Error</h1>
        <p>{serverData.session.error as unknown as string}</p>
      </div>
    )
  }

  return (
    <>
      {CF_BEACON && API_URL && (
        <Helmet>
          {/* Analytics script */}
          <script
            defer
            src={`${API_URL}/analytics/cf-beacon.js`}
            data-cf-beacon={JSON.stringify({ token: CF_BEACON })}
          />
        </Helmet>
      )}
      <Chrry
        siteConfig={serverData?.siteConfig}
        locale={serverData?.locale as any}
        session={serverData?.session}
        thread={serverData?.thread}
        threads={serverData?.threads}
        translations={serverData?.translations}
        app={serverData?.app}
        viewPortWidth={serverData?.viewPortWidth}
        viewPortHeight={serverData?.viewPortHeight}
        pathname={serverData?.pathname}
        searchParams={serverData?.searchParams}
        tribes={serverData?.tribes}
        tribePosts={serverData?.tribePosts}
        tribePost={serverData?.tribePost}
        theme={serverData?.theme}
        accountApp={serverData?.accountApp}
        apiKey={serverData?.apiKey}
        testConfig={serverData?.testConfig}
        isBot={serverData?.isBot}
      >
        {serverData?.isBlogRoute ? (
          <Skeleton>
            <Suspense fallback={null}>
              {serverData.blogPosts ? (
                <BlogList
                  posts={serverData.blogPosts}
                  locale={serverData.locale}
                />
              ) : serverData?.isBlogRoute && serverData.blogPost ? (
                <BlogPost
                  post={serverData.blogPost}
                  locale={serverData.locale}
                />
              ) : null}
            </Suspense>
          </Skeleton>
        ) : null}
      </Chrry>
    </>
  )
}

export default App

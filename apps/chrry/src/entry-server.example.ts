/**
 * Example SSR server entry point for Vite
 * This shows how to integrate the metadata generation into your SSR flow
 */

import fs from "node:fs/promises"
import path from "node:path"
import { loadServerData, type ServerRequest } from "./server-loader"
import { generateServerMetadata, metadataToHtml } from "./server-metadata"

/**
 * Render the app with SSR and inject metadata
 */
export async function render(request: ServerRequest) {
  const { pathname, hostname } = request

  // Load all server data (session, threads, app, etc.)
  const serverData = await loadServerData(request)

  // Generate metadata based on the route and server data
  const metadata = await generateServerMetadata(
    pathname,
    hostname,
    serverData.locale,
    serverData,
  )

  // Convert metadata to HTML tags
  const metaTags = metadata ? metadataToHtml(metadata) : ""

  // Read the base HTML template
  const template = await fs.readFile(
    path.resolve(process.cwd(), "index.html"),
    "utf-8",
  )

  // Render your React app to string
  // You'll need to import your App component here
  // const appHtml = renderToString(<App serverData={serverData} />)

  // For now, placeholder
  const appHtml = "<!--app-html-->"

  // Inject metadata and app HTML into template
  const html = template
    .replace("<!--app-head-->", metaTags)
    .replace("<!--html-class-->", serverData.theme)
    .replace("<!--app-html-->", appHtml)
    .replace(
      "<html",
      `<html data-locale="${serverData.locale}" data-theme="${serverData.theme}"`,
    )

  return {
    html,
    serverData,
  }
}

/**
 * Example Express/Hono middleware
 */
export async function ssrMiddleware(req: any, res: any) {
  try {
    const request: ServerRequest = {
      url: req.url,
      hostname: req.hostname || req.headers.host,
      pathname: req.path,
      headers: req.headers,
      cookies: req.cookies || {},
    }

    const { html } = await render(request)

    res.setHeader("Content-Type", "text/html")
    res.send(html)
  } catch (error) {
    console.error("SSR Error:", error)
    res.status(500).send("Internal Server Error")
  }
}

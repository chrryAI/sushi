/**
 * WebSocket Transport (Fallback)
 * For non-Chrome browsers or when Native Messaging is unavailable
 */

import { type WebSocket, WebSocketServer } from "ws"
import type { Message } from "./native"

export class WebSocketTransport {
  private wss: WebSocketServer

  start(onMessage: (message: Message) => Promise<any>, port = 3456) {
    this.wss = new WebSocketServer({ port })

    console.error(`[WebSocket] Starting on port ${port}`)

    this.wss.on("connection", (ws: WebSocket) => {
      console.error("[WebSocket] Client connected")

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString())
          console.error("[WebSocket] Received:", message.type)

          const response = await onMessage(message)
          ws.send(JSON.stringify(response))
        } catch (error) {
          console.error("[WebSocket] Error processing message:", error)
          ws.send(JSON.stringify({ error: String(error) }))
        }
      })

      ws.on("close", () => {
        console.error("[WebSocket] Client disconnected")
      })

      ws.on("error", (error) => {
        console.error("[WebSocket] Error:", error)
      })
    })

    this.wss.on("error", (error) => {
      console.error("[WebSocket] Server error:", error)
    })
  }

  stop() {
    this.wss?.close()
  }
}

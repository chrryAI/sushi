/**
 * Chrome Native Messaging Transport
 * Reads from stdin, writes to stdout
 * Implements Chrome's native messaging protocol
 */

export interface Message {
  type: string
  [key: string]: any
}

export class ChromeNativeTransport {
  private buffer = Buffer.alloc(0)

  start(onMessage: (message: Message) => Promise<any>) {
    console.error("[Native] Starting Chrome Native Messaging transport")

    process.stdin.on("data", async (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk])

      while (this.buffer.length >= 4) {
        // Read message length (first 4 bytes, little-endian)
        const messageLength = this.buffer.readUInt32LE(0)

        if (this.buffer.length < 4 + messageLength) {
          // Not enough data yet, wait for more
          break
        }

        // Extract message
        const messageBytes = this.buffer.subarray(4, 4 + messageLength)
        this.buffer = this.buffer.subarray(4 + messageLength)

        try {
          const message = JSON.parse(messageBytes.toString("utf-8"))
          console.error("[Native] Received:", message.type)

          const response = await onMessage(message)
          this.send(response)
        } catch (error) {
          console.error("[Native] Error processing message:", error)
          this.send({ error: String(error) })
        }
      }
    })

    process.stdin.on("end", () => {
      console.error("[Native] stdin closed, exiting")
      process.exit(0)
    })
  }

  send(message: any) {
    const json = JSON.stringify(message)
    const length = Buffer.byteLength(json)

    // Write length (4 bytes, little-endian)
    const header = Buffer.alloc(4)
    header.writeUInt32LE(length, 0)

    process.stdout.write(header)
    process.stdout.write(json)
  }
}

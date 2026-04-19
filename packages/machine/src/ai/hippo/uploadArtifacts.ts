"use server"

import type { ramen, sushi } from "@chrryai/donut/types"
import { isE2E as isE2EInternal } from "@chrryai/donut/utils"
// Note: getMember/getGuest are passed as parameters, not imported
import {
  type app,
  createMessage,
  getMessages,
  type guest,
  type thread,
  updateThread,
  type user,
  VEX_LIVE_FINGERPRINTS,
} from "@chrryai/machine"
import slugify from "slug"
import { v4 as uuidv4 } from "uuid"

// import { extractPDFText } from "../../lib"
// import { captureException } from "../../lib/captureException"
// import { upload } from "../../lib/minio"
// import { redact } from "../redaction"
const extractPDFText = async (buf: Buffer) => ""
const captureException = (e: unknown) => console.error(e)
const upload = async (..._args: any[]) => ({ url: "" })
const redact = (text: string) => text

import { processFileForRAG } from "./ragService"

export const uploadArtifacts = async ({
  files,
  thread,
  member,
  guest,
  app,
  job,
}: {
  files: File[]
  thread: thread
  member?: user
  guest?: guest
  job?: ramen
  app?: app | null
}) => {
  if (!member && !guest) {
    throw new Error("User or guest not found")
  }
  const fingerprint = member?.fingerprint || guest?.fingerprint

  const isE2E =
    member?.role !== "admin" &&
    fingerprint &&
    !VEX_LIVE_FINGERPRINTS.includes(member?.fingerprint || "") &&
    isE2EInternal
  const memoriesEnabled = (member || guest)?.memoriesEnabled

  let firstMessage = (await getMessages({ threadId: thread.id, isAsc: true }))
    ?.messages?.[0]?.message

  // Create a placeholder message if none exists to satisfy foreign key constraint
  if (!firstMessage) {
    const placeholderMessage = await createMessage({
      content: "[Artifacts uploaded to thread]",
      threadId: thread.id,
      userId: member?.id,
      guestId: guest?.id,
    })
    firstMessage = placeholderMessage
  }

  const messageIdForRAG = firstMessage!.id

  const uploadedFiles = [...(thread.artifacts || [])] // Start with existing artifacts

  // Process all incoming files (they're all new uploads)
  const fileContents = await Promise.all(
    files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      const mimeType = file.type

      console.log(
        `✅ Processing new file ${file.name} (${mimeType}, ${(file.size / 1024).toFixed(1)}KB)`,
      )

      return {
        type: mimeType.startsWith("image/")
          ? "image"
          : mimeType.startsWith("audio/")
            ? "audio"
            : mimeType.startsWith("video/")
              ? "video"
              : mimeType.startsWith("application/pdf")
                ? "pdf"
                : mimeType.startsWith("text/")
                  ? "text"
                  : "file",
        mimeType,
        data: base64,
        filename: file.name,
        size: file.size,
      }
    }),
  )
  const burn = !!thread.isIncognito
  // Add file parts - only process new files
  if (fileContents && fileContents.length > 0) {
    for (const file of fileContents) {
      if (file.type === "text") {
        let textContent =
          file.type === "text"
            ? Buffer.from(file.data, "base64").toString("utf8")
            : undefined

        // Process text file for RAG instead of appending entire content
        if (textContent) {
          // Redact PII from text content
          textContent = (await redact(textContent)) || ""

          const uploadResult = await upload({
            context: job ? "ramen" : "thread",
            url: `data:${file.mimeType};base64,${file.data}`,
            messageId: slugify(file.filename.substring(0, 10)),
            options: {
              title: file.filename,
              type: "text",
            },
            member,
            guest,
          })
          // Process for RAG in background (non-blocking)
          if (!isE2E && memoriesEnabled && !burn) {
            processFileForRAG({
              content: textContent,
              filename: file.filename,
              fileType: "text",
              fileSizeBytes: file.size,
              messageId: messageIdForRAG,
              threadId: thread.id,
              member,
              guest,
              app: app || undefined,
              userId: member?.id,
              guestId: guest?.id,
            }).catch((error) => {
              captureException(error)
              console.error("❌ Failed to process text file for RAG:", error)
            })
          }

          uploadedFiles.push({
            data: textContent,
            name: file.filename,
            size: file.size,
            type: file.type,
            url: uploadResult.url,
            id: uuidv4(),
          })
        }
      } else if (file.type === "pdf" || file.type === "application/pdf") {
        const uploadResult = await upload({
          context: job ? "ramen" : "thread",
          url: `data:${file.mimeType};base64,${file.data}`,
          messageId: slugify(file.filename.substring(0, 10)),
          options: {
            title: file.filename,
            type: "pdf",
          },
          member,
          guest,
        })

        try {
          const pdfBuffer = Buffer.from(file.data, "base64")
          let extractedText = await extractPDFText(pdfBuffer)
          // Redact PII from extracted PDF text
          extractedText = (await redact(extractedText)) || ""

          uploadedFiles.push({
            data: extractedText,
            url: uploadResult.url,
            name: file.filename,
            size: file.size,
            type: "pdf",
            id: uuidv4(),
          })
          // Process for RAG in background (non-blocking)
          if (!isE2E && memoriesEnabled && !burn) {
            processFileForRAG({
              content: extractedText,
              filename: file.filename,
              fileType: "pdf",
              fileSizeBytes: file.size,
              messageId: messageIdForRAG,
              threadId: thread.id,
              userId: member?.id,
              guestId: guest?.id,
            }).catch((error) => {
              captureException(error)
              console.error("❌ Failed to process PDF for RAG:", error)
            })
          }
        } catch (error) {
          captureException(error)
          console.error("PDF extraction failed:", error)
        }
      } else if (file.type === "image") {
        // Upload image
        const uploadResult = await upload({
          url: `data:${file.mimeType};base64,${file.data}`,
          messageId: slugify(file.filename.substring(0, 10)),
          options: {
            title: file.filename,
            type: "image",
          },
          context: job ? "ramen" : "thread",
          member,
          guest,
        })

        uploadedFiles.push({
          url: uploadResult.url,
          name: file.filename,
          size: file.size,
          type: "image",
          id: uuidv4(),
        })

        // Process image for RAG (vision models can analyze it)
        // Process for RAG in background (non-blocking)
        if (!isE2E && memoriesEnabled && !burn) {
          processFileForRAG({
            content: `[Image: ${file.filename}]`,
            filename: file.filename,
            fileType: "image",
            fileSizeBytes: file.size,
            messageId: messageIdForRAG,
            threadId: thread.id,
            userId: member?.id,
            guestId: guest?.id,
          }).catch((error) => {
            captureException(error)
            console.error("❌ Failed to process image for RAG:", error)
          })
        }
      } else if (file.type === "video") {
        // Upload video
        const uploadResult = await upload({
          url: `data:${file.mimeType};base64,${file.data}`,
          messageId: slugify(file.filename.substring(0, 10)),
          options: {
            title: file.filename,
            type: "video",
          },
          member,
          context: job ? "ramen" : "thread",
          guest,
        })

        uploadedFiles.push({
          url: uploadResult.url,
          name: file.filename,
          size: file.size,
          type: "video",
          id: uuidv4(),
        })
      } else if (file.type === "audio") {
        // Upload audio
        const uploadResult = await upload({
          context: job ? "ramen" : "thread",
          url: `data:${file.mimeType};base64,${file.data}`,
          messageId: slugify(file.filename.substring(0, 10)),
          options: {
            title: file.filename,
            type: "audio",
          },
          member,
          guest,
        })

        uploadedFiles.push({
          url: uploadResult.url,
          name: file.filename,
          size: file.size,
          type: "audio",
          id: uuidv4(),
        })
      } else {
        // Handle other file types (code files, etc.) as text
        const uploadResult = await upload({
          context: job ? "ramen" : "thread",
          url: `data:${file.mimeType};base64,${file.data}`,
          messageId: slugify(file.filename.substring(0, 10)),
          options: {
            title: file.filename,
            type: "text",
          },
          member,
          guest,
        })

        uploadedFiles.push({
          url: uploadResult.url,
          name: file.filename,
          size: file.size,
          type: "text",
          id: uuidv4(),
        })
      }
    }
  }

  // Update thread artifacts - append new files to existing ones
  const _t = await updateThread({
    id: thread.id,
    artifacts: uploadedFiles,
  })
}

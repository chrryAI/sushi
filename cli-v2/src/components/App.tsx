/**
 * Main App Component
 * SUSHI CLI v2 Entry Point
 */

import React, { useEffect, useCallback } from "react"
import type { FC } from "react"
import { Box, Text, useInput, useApp } from "ink"
import { useStore } from "../store.js"
import { parseSpatialCommand } from "../types/spatial.js"
import { initDB } from "../db/client.js"
import { SpatialNav } from "./SpatialNav.js"
import { Chat } from "./Chat.js"
import { CodeView } from "./CodeView.js"
import { StatusBar } from "./StatusBar.js"
import { InputBox } from "./InputBox.js"

export const App: FC = () => {
  const { exit } = useApp()
  const {
    spatial,
    activeAgent,
    agents,
    ui,
    setCoordinate,
    navigateHistory,
    setActivePanel,
    addMessage,
    setStreaming,
  } = useStore()

  // Initialize DB on mount
  useEffect(() => {
    initDB().catch(console.error)
  }, [])

  // Handle keyboard shortcuts
  useInput((input, key) => {
    // Tab to switch panels
    if (key.tab) {
      const panels: Array<typeof ui.activePanel> = ["nav", "chat", "code"]
      const currentIndex = panels.indexOf(ui.activePanel)
      const nextIndex = (currentIndex + 1) % panels.length
      setActivePanel(panels[nextIndex])
    }

    // Escape to exit
    if (key.escape) {
      exit()
    }

    // Number keys for agents
    if (input === "1") useStore.getState().setActiveAgent("sensei")
    if (input === "2") useStore.getState().setActiveAgent("student")
    if (input === "3") useStore.getState().setActiveAgent("debugger")

    // Navigation history
    if (key.leftArrow && ui.activePanel === "nav") {
      navigateHistory(-1)
    }
    if (key.rightArrow && ui.activePanel === "nav") {
      navigateHistory(1)
    }
  })

  const handleSubmit = useCallback(
    async (input: string) => {
      if (!input.trim()) return

      // Parse spatial commands
      const { text, coordinate } = parseSpatialCommand(input)

      // Update coordinate if specified
      if (coordinate.x || coordinate.y || coordinate.z !== undefined) {
        setCoordinate(coordinate)
      }

      // Add user message
      addMessage({
        role: "user",
        content: text,
      })

      // Start streaming
      setStreaming(true)

      // TODO: Call AI with streaming
      // For now, simulate response
      setTimeout(() => {
        addMessage({
          role: "assistant",
          content: `Agent ${activeAgent} (${agents[activeAgent].stats.level} lvl): I received "${text}" at ${spatial.current.x}:${spatial.current.y}`,
        })
        setStreaming(false)
      }, 1000)
    },
    [
      activeAgent,
      agents,
      spatial.current,
      addMessage,
      setStreaming,
      setCoordinate,
    ],
  )

  const agent = agents[activeAgent]

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box padding={1} borderStyle="single" borderBottom>
        <Text bold color="cyan">
          🍣 SUSHI v2.0
        </Text>
        <Text> | </Text>
        <Text color="yellow">
          x:{spatial.current.x} y:{spatial.current.y} z:{spatial.current.z}
        </Text>
        <Text> | </Text>
        <Text color="green">
          {activeAgent} (Lv{agent.stats.level})
        </Text>
      </Box>

      {/* Main content */}
      <Box flexGrow={1}>
        {/* Left: Spatial Nav */}
        <Box
          width="25%"
          borderStyle={ui.activePanel === "nav" ? "double" : "single"}
          borderColor={ui.activePanel === "nav" ? "cyan" : undefined}
        >
          <SpatialNav />
        </Box>

        {/* Center: Chat */}
        <Box
          width="50%"
          borderStyle={ui.activePanel === "chat" ? "double" : "single"}
          borderColor={ui.activePanel === "chat" ? "cyan" : undefined}
        >
          <Chat />
        </Box>

        {/* Right: Code View */}
        <Box
          width="25%"
          borderStyle={ui.activePanel === "code" ? "double" : "single"}
          borderColor={ui.activePanel === "code" ? "cyan" : undefined}
        >
          <CodeView />
        </Box>
      </Box>

      {/* Input */}
      <Box padding={1} borderStyle="single" borderTop>
        <InputBox onSubmit={handleSubmit} isLoading={ui.isStreaming} />
      </Box>

      {/* Status Bar */}
      <StatusBar />
    </Box>
  )
}

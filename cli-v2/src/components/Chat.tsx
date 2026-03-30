/**
 * Chat Panel
 * AI conversation display
 */

import React, { FC } from "react";
import { Box, Text, useStdout } from "ink";
import { useStore } from "../store.js";
import Spinner from "ink-spinner";

export const Chat: FC = () => {
  const { messages, ui, activeAgent, agents } = useStore();
  const { stdout } = useStdout();
  const height = stdout.rows - 10; // Leave room for header, input, status

  const agentColor = (agent: string) => {
    switch (agent) {
      case "sensei":
        return "magenta";
      case "student":
        return "blue";
      case "debugger":
        return "red";
      case "pm":
        return "yellow";
      default:
        return "white";
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case "user":
        return "👤";
      case "assistant":
        return "🤖";
      case "system":
        return "⚙️";
      case "tool":
        return "🔧";
      default:
        return "•";
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "user":
        return "green";
      case "assistant":
        return "cyan";
      case "system":
        return "gray";
      case "tool":
        return "yellow";
      default:
        return "white";
    }
  };

  // Show last N messages that fit
  const visibleMessages = messages.slice(-Math.floor(height / 3));

  return (
    <Box flexDirection="column" padding={1} height="100%">
      <Text bold underline color="cyan">
        Chat
      </Text>

      <Box flexDirection="column" flexGrow={1} overflow="hidden" marginTop={1}>
        {visibleMessages.length === 0 && <Text dimColor>Start a conversation...</Text>}

        {visibleMessages.map((msg) => (
          <Box key={msg.id} flexDirection="column" marginY={1}>
            <Box>
              <Text color={roleColor(msg.role)}>
                {roleIcon(msg.role)} {msg.role === "assistant" ? activeAgent : msg.role}
              </Text>
              {msg.role === "assistant" && (
                <Text dimColor> (Lv{agents[activeAgent].stats.level})</Text>
              )}
            </Box>

            <Box marginLeft={2}>
              <Text wrap="wrap">{msg.content}</Text>
            </Box>

            {/* Tool calls */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <Box flexDirection="column" marginLeft={2} marginTop={1}>
                {msg.toolCalls.map((tool) => (
                  <Text key={tool.id} color="yellow" dimColor>
                    🔧 {tool.name}({JSON.stringify(tool.arguments)})
                  </Text>
                ))}
              </Box>
            )}

            {/* Tool results */}
            {msg.toolResults && msg.toolResults.length > 0 && (
              <Box flexDirection="column" marginLeft={2} marginTop={1}>
                {msg.toolResults.map((result) => (
                  <Text key={result.toolCallId} color={result.isError ? "red" : "green"} dimColor>
                    {result.isError ? "❌" : "✓"} {result.content.slice(0, 50)}...
                  </Text>
                ))}
              </Box>
            )}
          </Box>
        ))}

        {ui.isStreaming && (
          <Box marginY={1}>
            <Text color="cyan">
              <Spinner type="dots" /> {activeAgent} is thinking...
            </Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Agent: <Text color={agentColor(activeAgent)}>{activeAgent}</Text> | XP:{" "}
          {agents[activeAgent].stats.xp} | Mutations: {agents[activeAgent].stats.mutationsKilled}
        </Text>
      </Box>
    </Box>
  );
};

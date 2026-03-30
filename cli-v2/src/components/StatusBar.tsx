/**
 * Status Bar
 * Bottom status information
 */

import React, { FC } from "react";
import { Box, Text } from "ink";
import { useStore } from "../store.js";

export const StatusBar: FC = () => {
  const { ui, activeAgent, agents, spatial } = useStore();

  const agent = agents[activeAgent];

  return (
    <Box
      paddingX={1}
      paddingY={0}
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
    >
      <Box width="25%">
        <Text dimColor>Panel: </Text>
        <Text color="cyan">{ui.activePanel}</Text>
      </Box>

      <Box width="25%">
        <Text dimColor>Agent: </Text>
        <Text color={getAgentColor(activeAgent)}>
          {activeAgent} (Lv{agent.stats.level})
        </Text>
      </Box>

      <Box width="25%">
        <Text dimColor>STRIKE: </Text>
        <Text color={getStrikeColor(agent.stats.mutationsKilled, agent.stats.mutationsTested)}>
          {agent.stats.mutationsTested > 0
            ? `${Math.round((agent.stats.mutationsKilled / agent.stats.mutationsTested) * 100)}%`
            : "N/A"}
        </Text>
      </Box>

      <Box width="25%">
        <Text dimColor>Coord: </Text>
        <Text color="yellow">
          {spatial.current.x}:{spatial.current.y}
        </Text>
      </Box>
    </Box>
  );
};

function getAgentColor(agent: string): string {
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
}

function getStrikeColor(killed: number, total: number): string {
  if (total === 0) return "gray";
  const score = (killed / total) * 100;
  if (score >= 80) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

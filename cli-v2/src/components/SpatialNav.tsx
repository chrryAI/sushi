/**
 * Spatial Navigation Panel
 * X/Y/Z coordinate navigation
 */

import React, { FC } from "react";
import { Box, Text, useInput } from "ink";
import { useStore } from "../store.js";
import { formatCoordinate } from "../types/spatial.js";

export const SpatialNav: FC = () => {
  const { spatial, navigateHistory, activeAgent } = useStore();

  useInput((_input, key) => {
    if (key.upArrow) {
      // Navigate to parent Y context
      navigateHistory(-1);
    }
    if (key.downArrow) {
      // Navigate to child Y context
      navigateHistory(1);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold underline color="cyan">
        Spatial Nav
      </Text>

      <Box marginTop={1}>
        <Text bold>Current:</Text>
        <Text color="yellow"> {formatCoordinate(spatial.current)}</Text>
      </Box>

      <Box marginTop={1}>
        <Text bold>X-Axis (App):</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2}>
        {["sensei", "student", "debugger", "pm"].map((x) => (
          <Text
            key={x}
            color={spatial.current.x === x ? "green" : undefined}
            backgroundColor={activeAgent === x ? "gray" : undefined}
          >
            {spatial.current.x === x ? "▶ " : "  "}
            {x}
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text bold>Y-Axis (Context):</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2}>
        {["general", "auth", "payment", "ui", "api"].map((y) => (
          <Text key={y} color={spatial.current.y === y ? "green" : undefined}>
            {spatial.current.y === y ? "▶ " : "  "}
            {y}
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text bold>History:</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2}>
        {spatial.history.slice(-5).map((coord, i) => (
          <Text key={i} dimColor>
            {formatCoordinate(coord)}
          </Text>
        ))}
      </Box>

      <Box marginTop={2}>
        <Text dimColor>Shortcuts:</Text>
      </Box>
      <Text dimColor>@x:agent @y:ctx</Text>
      <Text dimColor>@z:-1 (history)</Text>
    </Box>
  );
};

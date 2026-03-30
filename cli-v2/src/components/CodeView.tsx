/**
 * Code View Panel
 * File display and diff view
 */

import React, { FC } from "react";
import { Box, Text } from "ink";
import { useStore } from "../store.js";

export const CodeView: FC = () => {
  const { ui } = useStore();

  return (
    <Box flexDirection="column" padding={1} height="100%">
      <Text bold underline color="cyan">
        {ui.showDiff ? "Diff View" : "Code View"}
      </Text>

      <Box flexGrow={1} marginTop={1} overflow="hidden">
        {ui.showDiff && ui.diffContent ? (
          <DiffViewer original={ui.diffContent.original} modified={ui.diffContent.modified} />
        ) : (
          <Box flexDirection="column">
            <Text dimColor>No file selected</Text>
            <Text dimColor>Files will appear here when referenced in chat</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const DiffViewer: FC<{
  original: string;
  modified: string;
}> = ({ original, modified }) => {
  // Simple line-by-line diff
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");

  return (
    <Box flexDirection="column">
      {modifiedLines.map((line, i) => {
        const isNew = i >= originalLines.length || line !== originalLines[i];
        const isRemoved = i < originalLines.length && !modifiedLines.includes(originalLines[i]);

        if (isNew) {
          return (
            <Text key={i} color="green">
              + {line}
            </Text>
          );
        }

        if (isRemoved) {
          return (
            <Text key={i} color="red">
              - {originalLines[i]}
            </Text>
          );
        }

        return (
          <Text key={i} dimColor>
            {"  "}
            {line}
          </Text>
        );
      })}
    </Box>
  );
};

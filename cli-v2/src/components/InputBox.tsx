/**
 * Input Box Component
 * User input with autocomplete
 */

import React, { useState, FC } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";

interface Props {
  onSubmit: (value: string) => void;
  isLoading?: boolean;
}

export const InputBox: FC<Props> = ({ onSubmit, isLoading }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (v: string) => {
    if (v.trim()) {
      onSubmit(v);
      setValue("");
    }
  };

  return (
    <Box>
      <Text color="green">❯ </Text>
      {isLoading ? (
        <Text color="cyan">
          <Spinner type="dots" /> Processing...
        </Text>
      ) : (
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          placeholder="Type a message or @x:agent @y:context..."
        />
      )}
    </Box>
  );
};

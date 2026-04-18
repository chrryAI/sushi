"use client"

import React from "react"
import { CircleArrowDown } from "./icons"

import {
  Div,
  Select as PlatformSelect,
  type SelectProps as PlatformSelectProps,
  Span,
} from "./platform"
import { useSelectStyles } from "./Select.styles"

export interface selectProps extends Omit<PlatformSelectProps, "options"> {
  options: { value: string; label: string }[]
  icon?: React.ReactNode
  selectText?: string

  "data-testid"?: string
}

export default function Select({
  options,
  defaultValue,
  value,
  name,
  onChange,
  onValueChange,
  style,
  id,
  disabled,
  required,
  icon,
  "data-testid": dataTestId,
  ...rest
}: selectProps) {
  const styles = useSelectStyles()
  const generatedId = React.useId()

  return (
    <Div style={{ ...styles.customSelect.style, ...style }}>
      <PlatformSelect
        className={"select"}
        name={name}
        data-testid={dataTestId}
        id={id || generatedId}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
        options={options}
        style={{ ...styles.select.style }}
        {...rest}
      />
      <Span style={styles.icon.style}>
        {icon ? icon : <CircleArrowDown size={15} color="var(--shade-6)" />}
      </Span>
    </Div>
  )
}

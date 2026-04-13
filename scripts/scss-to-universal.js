#!/usr/bin/env node

/**
 * SCSS to Unified Styles Converter
 * Converts SCSS module files to work on both web and native
 */

// biome-ignore-all lint: reason
import fs from "node:fs"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const propertyMap = {
  "background-color": "backgroundColor",
  background: "backgroundColor",
  "border-radius": "borderRadius",
  "border-color": "borderColor",
  "border-top-color": "borderTopColor",
  "border-bottom-color": "borderBottomColor",
  "border-left-color": "borderLeftColor",
  "border-right-color": "borderRightColor",
  "border-width": "borderWidth",
  "border-top-width": "borderTopWidth",
  "border-bottom-width": "borderBottomWidth",
  "border-left-width": "borderLeftWidth",
  "border-right-width": "borderRightWidth",
  "border-style": "borderStyle",
  "font-size": "fontSize",
  "font-weight": "fontWeight",
  "font-family": "fontFamily",
  "font-display": "fontDisplay",
  "line-height": "lineHeight",
  "text-align": "textAlign",
  "text-decoration": "textDecorationLine",
  margin: "margin",
  "margin-top": "marginTop",
  "margin-bottom": "marginBottom",
  "margin-left": "marginLeft",
  "margin-right": "marginRight",
  padding: "padding",
  "padding-top": "paddingTop",
  "padding-bottom": "paddingBottom",
  "padding-left": "paddingLeft",
  "padding-right": "paddingRight",
  width: "width",
  height: "height",
  "min-width": "minWidth",
  "min-height": "minHeight",
  "max-width": "maxWidth",
  "max-height": "maxHeight",
  display: "display",
  "flex-direction": "flexDirection",
  "justify-content": "justifyContent",
  "align-items": "alignItems",
  "align-self": "alignSelf",
  flex: "flex",
  "flex-grow": "flexGrow",
  "flex-shrink": "flexShrink",
  "flex-wrap": "flexWrap",
  gap: "gap",
  "row-gap": "rowGap",
  "column-gap": "columnGap",
  "grid-template-columns": "gridTemplateColumns",
  "grid-template-rows": "gridTemplateRows",
  "grid-column": "gridColumn",
  "grid-row": "gridRow",
  "overflow-wrap": "overflowWrap",
  position: "position",
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
  "z-index": "zIndex",
  opacity: "opacity",
  overflow: "overflow",
  color: "color",
  outline: "outline",
  border: "border",
  "border-top": "borderTop",
  "border-bottom": "borderBottom",
  "border-left": "borderLeft",
  "border-right": "borderRight",
  "box-shadow": "boxShadow",
  shadow: "boxShadow",
  "overflow-x": "overflowX",
  "overflow-y": "overflowY",
  "white-space": "whiteSpace",
  "text-overflow": "textOverflow",
  transform: "transform",
  "object-fit": "objectFit",
}

// CSS variable to theme property mappings
const cssVarToTheme = {
  "--foreground": "theme.foreground",
  "--background": "theme.background",
  "--accent-0": "theme.accent0",
  "--accent-1": "theme.accent1",
  "--accent-2": "theme.accent2",
  "--accent-3": "theme.accent3",
  "--accent-4": "theme.accent4",
  "--accent-5": "theme.accent5",
  "--accent-6": "theme.accent6",
  "--accent-7": "theme.accent7",
  "--accent-8": "theme.accent8",
  "--shade-1": "theme.shade1",
  "--shade-2": "theme.shade2",
  "--shade-3": "theme.shade3",
  "--shade-4": "theme.shade4",
  "--shade-5": "theme.shade5",
  "--shade-6": "theme.shade6",
  "--shade-7": "theme.shade7",
  "--shade-8": "theme.shade8",
  "--link-color": "theme.linkColor",
  "--selection": "theme.selection",
  "--overlay": "theme.overlay",
  "--shadow": "theme.shadow",
  "--shadow-glow": "theme.shadowGlow",
  "--radius": "theme.radius",
}

// Breakpoint values mapping (from breakpoints.scss)
const breakpointValues = {
  "$breakpoint-mobile": 600,
  "$breakpoint-mobile-max": 599,
  "$breakpoint-mobile-small": 430,
  "$breakpoint-mobile-small-max": 320,
  "$breakpoint-tablet": 800,
  "$breakpoint-desktop": 960,
}

const convertValue = (property, value) => {
  value = value.trim()
  value = value.replace(/\s*!important\s*$/, "")

  // Handle transform FIRST - before general toRem processing
  // This prevents the global toRem converter from adding 'px' to numbers in percentages
  if (property === "transform") {
    // Convert toRem.toRem() calls to pixel values
    const converted = value.replace(
      /toRem\.toRem\((-?[0-9.]+)\)/g,
      (match, num) => {
        const rounded = Math.round(parseFloat(num))
        return rounded === 0 ? "0" : `${rounded}px`
      },
    )
    return `"${converted}"`
  }

  // Handle SCSS breakpoint variables: breakpoints.$breakpoint-mobile → 600
  if (value.includes("breakpoints.$")) {
    const match = value.match(/breakpoints\.(\$breakpoint-[a-z-]+)/)
    if (match && breakpointValues[match[1]]) {
      return breakpointValues[match[1]]
    }
  }

  // Handle SCSS functions: toRem.toRem(8.5) → 8, toRem.toRem(-15) → -15
  // Handle multiple calls in one value: "toRem.toRem(10) toRem.toRem(20)" → "10px 20px"
  if (value.includes("toRem.toRem(")) {
    // Replace all occurrences
    const converted = value.replace(
      /toRem\.toRem\((-?[0-9.]+)\)/g,
      (match, num) => {
        return Math.round(parseFloat(num))
      },
    )

    // If the result contains spaces (multiple values), keep as string
    if (converted.includes(" ")) {
      // Add 'px' suffix to each number for web compatibility
      // But don't add px to numbers inside var() - use negative lookahead
      const withPx = converted.replace(/(\d+)(?![^(]*\))/g, "$1px")
      return `"${withPx}"`
    }

    // Single value - return as number
    return Math.round(parseFloat(converted))
  }

  // Handle toRem(8.5) → 8, toRem(-15) → -15
  if (value.includes("toRem(")) {
    // Replace all occurrences
    const converted = value.replace(/toRem\((-?[0-9.]+)\)/g, (match, num) => {
      return Math.round(parseFloat(num))
    })

    // If the result contains spaces (multiple values), keep as string
    if (converted.includes(" ")) {
      // Add 'px' suffix to each number for web compatibility
      const withPx = converted.replace(/(\d+)/g, "$1px")
      return `"${withPx}"`
    }

    // Single value - return as number
    return Math.round(parseFloat(converted))
  }

  // Handle clamp() - keep as string for web compatibility
  if (value.includes("clamp(")) {
    return `'${value}'`
  }

  // Handle repeat() - keep as string for web, convert for native
  if (value.includes("repeat(")) {
    return `'${value}'`
  }

  // Handle calc() - keep as string for web compatibility
  if (value.includes("calc(")) {
    return `'${value}'`
  }

  // Handle CSS variables (already handled above, skip duplicate)
  // This section is now handled by the cssVarToTheme mapping above

  // Pixel values
  if (value.endsWith("px")) {
    const num = Number.parseInt(value)
    return num
  }

  // Percentages
  if (value.endsWith("%")) {
    return `'${value}'`
  }

  // CSS variables - keep as-is for web
  if (value.startsWith("var(--")) {
    return `'${value}'`
  }

  // Colors
  if (
    value.startsWith("#") ||
    value.startsWith("rgb") ||
    value.startsWith("hsl")
  ) {
    return `'${value}'`
  }

  // Note: display property is now included for both web and native

  // Skip animation and transition (web-only)
  if (property === "animation" || property === "transition") {
    return null
  }

  // Flex direction
  if (property === "flexDirection") {
    if (["row", "column", "row-reverse", "column-reverse"].includes(value)) {
      return `'${value}'`
    }
  }

  // String keywords
  const keywords = [
    "auto",
    "none",
    "hidden",
    "visible",
    "scroll",
    "center",
    "flex-start",
    "flex-end",
    "space-between",
    "space-around",
    "stretch",
    "baseline",
    "bold",
    "normal",
    "italic",
    "underline",
    "absolute",
    "relative",
    "fixed",
    "pointer",
    "swap",
    "dashed",
    "dotted",
    "solid",
  ]

  if (keywords.includes(value)) {
    return `'${value}'`
  }

  // Numbers
  if (!isNaN(value)) {
    return parseFloat(value)
  }

  return `'${value}'`
}

const parseScss = (scssContent) => {
  const styles = {}

  // Remove comments
  scssContent = scssContent.replace(/\/\*[\s\S]*?\*\//g, "")
  scssContent = scssContent.replace(/\/\/.*/g, "")

  // Remove @use statements
  scssContent = scssContent.replace(/@use.*?;/g, "")

  // Remove media queries
  scssContent = scssContent.replace(
    /@media[^{]+\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
    "",
  )

  // Remove keyframe animations
  scssContent = scssContent.replace(/@keyframes[\s\S]*?\{[\s\S]*?\}/g, "")

  // Remove @include statements
  scssContent = scssContent.replace(/@include[^;]+;/g, "")

  // CRITICAL: Split comma-separated selectors BEFORE flattening
  // This ensures .userIcon, .agentIcon both get their own entries
  const splitCommaSeparatedSelectors = (scss) => {
    let result = scss
    // Match class definitions with comma-separated selectors (including multi-line)
    // Pattern: .class1,\s*.class2\s*{  or  .class1, .class2, .class3 {
    const commaRegex = /(\.[a-zA-Z0-9_-]+(?:\s*,\s*\.[a-zA-Z0-9_-]+)+)\s*\{/g
    let match
    const replacements = []

    while ((match = commaRegex.exec(scss)) !== null) {
      const selectorGroup = match[1]
      // Extract all class names from the group
      const classMatches = selectorGroup.match(/\.([a-zA-Z0-9_-]+)/g)
      if (classMatches && classMatches.length > 1) {
        const names = classMatches.map((c) => c.substring(1)) // Remove the dot
        const startIndex = match.index
        const openBrace = scss.indexOf("{", startIndex)

        // Find matching closing brace
        let braceCount = 1
        let endIndex = openBrace + 1
        while (braceCount > 0 && endIndex < scss.length) {
          if (scss[endIndex] === "{") braceCount++
          if (scss[endIndex] === "}") braceCount--
          endIndex++
        }

        if (braceCount === 0) {
          const content = scss.substring(openBrace + 1, endIndex - 1)
          // Create duplicate blocks for each class name
          let duplicated = ""
          for (const name of names) {
            duplicated += `\n.${name} { ${content} }\n`
          }
          replacements.push({
            start: startIndex,
            end: endIndex,
            replacement: duplicated,
          })
        }
      }
    }

    // Apply replacements in reverse order
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { start, end, replacement } = replacements[i]
      result = result.substring(0, start) + replacement + result.substring(end)
    }

    return result
  }

  scssContent = splitCommaSeparatedSelectors(scssContent)

  // Flatten nested classes by extracting them to top level with unique names
  // Handles &.modifier syntax by creating parentModifier class names
  const flattenNested = (scss) => {
    let result = scss
    let changed = true
    const maxIterations = 10
    let iteration = 0

    while (changed && iteration < maxIterations) {
      changed = false
      iteration++

      // Find all class definitions
      const classMatches = []
      const classRegex = /\.([a-zA-Z0-9_-]+)\s*\{/g
      let match

      while ((match = classRegex.exec(result)) !== null) {
        const className = match[1]
        const startIndex = match.index
        const openBrace = result.indexOf("{", startIndex)

        // Find matching closing brace
        let braceCount = 1
        let endIndex = openBrace + 1

        while (braceCount > 0 && endIndex < result.length) {
          if (result[endIndex] === "{") braceCount++
          if (result[endIndex] === "}") braceCount--
          endIndex++
        }

        if (braceCount === 0) {
          const fullMatch = result.substring(startIndex, endIndex)
          const content = result.substring(openBrace + 1, endIndex - 1)
          classMatches.push({
            className,
            fullMatch,
            content,
            startIndex,
            endIndex,
          })
        }
      }

      // Process matches in reverse order to maintain indices
      for (let i = classMatches.length - 1; i >= 0; i--) {
        const { className, fullMatch, content, startIndex, endIndex } =
          classMatches[i]

        // Check if this class has nested &.modifier classes
        const hasNestedModifiers = /&\.([a-zA-Z0-9_-]+)\s*\{/.test(content)

        if (hasNestedModifiers) {
          // Extract nested &.modifier classes with parent context
          let extracted = ""
          const modifierRegex =
            /&\.([a-zA-Z0-9_-]+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
          let modifierMatch

          while ((modifierMatch = modifierRegex.exec(content)) !== null) {
            const modifierClass = modifierMatch[1]
            const modifierContent = modifierMatch[2]
            // Create unique name: parentModifier (e.g., mainEmpty, headerEmpty)
            const uniqueName =
              className +
              modifierClass.charAt(0).toUpperCase() +
              modifierClass.slice(1)
            extracted += `\n.${uniqueName} { ${modifierContent} }\n`
          }

          // Remove &.modifier classes from parent, keep parent properties
          const cleanContent = content.replace(
            /&\.([a-zA-Z0-9_-]+)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
            "",
          )

          // IMPORTANT: Check if parent has any actual properties (not just whitespace/nested classes)
          const hasParentProps =
            cleanContent.trim().replaceAll(/\s+/g, " ").length > 0

          // Always keep the parent class definition, even if it only has nested modifiers
          // This ensures comma-separated selectors like .userIcon, .agentIcon are both preserved
          const replacement = `.${className} { ${cleanContent.trim()} }${extracted}`

          result =
            result.substring(0, startIndex) +
            replacement +
            result.substring(endIndex)
          changed = true
          break // Restart after modification
        }

        // Also handle regular nested classes (without &)
        const hasNestedClasses = /\s*\.([a-zA-Z0-9_-]+)\s*\{/.test(content)

        if (hasNestedClasses && !hasNestedModifiers) {
          // Extract nested classes - need to handle nested braces properly
          let extracted = ""

          // Find all nested class blocks
          const tempContent = content
          const nestedMatches = []

          // Use a more robust approach to find nested classes
          let searchPos = 0
          while (searchPos < tempContent.length) {
            const classMatch = /\s*\.([a-zA-Z0-9_-]+)\s*\{/.exec(
              tempContent.substring(searchPos),
            )
            if (!classMatch) break

            const nestedClassName = classMatch[1]
            const startPos = searchPos + classMatch.index
            const openBracePos =
              searchPos + classMatch.index + classMatch[0].length - 1

            // Find matching closing brace
            let depth = 1
            let endPos = openBracePos + 1
            while (depth > 0 && endPos < tempContent.length) {
              if (tempContent[endPos] === "{") depth++
              if (tempContent[endPos] === "}") depth--
              endPos++
            }

            if (depth === 0) {
              const nestedContent = tempContent.substring(
                openBracePos + 1,
                endPos - 1,
              )
              nestedMatches.push({
                fullMatch: tempContent.substring(startPos, endPos),
                className: nestedClassName,
                content: nestedContent,
              })
              extracted += `\n.${nestedClassName} { ${nestedContent} }\n`
            }

            searchPos = endPos
          }

          // Remove all nested classes from parent content
          let cleanContent = content
          for (const match of nestedMatches) {
            cleanContent = cleanContent.replace(match.fullMatch, "")
          }

          // Check if parent has any properties (not just whitespace)
          const hasParentProps =
            cleanContent.trim().replaceAll(/\s+/g, " ").length > 0
          const parentClass = hasParentProps
            ? `.${className} { ${cleanContent.trim()} }\n`
            : ""

          // Rebuild with parent class (if it has props) and extracted nested classes
          const replacement = `${parentClass}${extracted}`

          result =
            result.substring(0, startIndex) +
            replacement +
            result.substring(endIndex)
          changed = true
          break // Restart after modification
        }
      }
    }

    return result
  }

  scssContent = flattenNested(scssContent)

  // Match top-level class definitions (comma-separated selectors already split)
  const classRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
  let match

  while ((match = classRegex.exec(scssContent)) !== null) {
    const className = match[1]
    const content = match[2]

    // Extract nested selectors and combine them into the base style
    const styleObj = {
      base: {},
      hover: {},
      active: {},
      focus: {},
      disabled: {},
    }

    // First, remove all pseudo-class blocks from content to get only base properties
    let baseContent = content
    const pseudoBlockRegex = /&:(hover|active|focus|disabled)\s*\{[^}]+\}/g
    baseContent = baseContent.replace(pseudoBlockRegex, "")

    // Parse pseudo-class selectors (&:hover, &:active, &:focus, &:disabled)
    const pseudoRegex = /&:(hover|active|focus|disabled)\s*\{([^}]+)\}/g
    let pseudoMatch

    while ((pseudoMatch = pseudoRegex.exec(content)) !== null) {
      const pseudoType = pseudoMatch[1] // hover, active, focus, disabled
      const pseudoContent = pseudoMatch[2]

      // Parse properties inside pseudo-class
      const pseudoPropRegex = /([a-z-]+)\s*:\s*([^;]+);/g
      let pseudoPropMatch

      while ((pseudoPropMatch = pseudoPropRegex.exec(pseudoContent)) !== null) {
        const cssProp = pseudoPropMatch[1].trim()
        const cssValue = pseudoPropMatch[2].trim()

        const camelProp = propertyMap[cssProp] || cssProp
        const convertedValue = convertValue(camelProp, cssValue)

        if (convertedValue !== null) {
          styleObj[pseudoType][camelProp] = convertedValue
        }
      }
    }

    // Parse direct properties (not nested) - these go into base
    // Use baseContent which has pseudo-class blocks removed
    const directPropRegex = /([a-z-]+)\s*:\s*([^;{]+);/g
    let propMatch

    while ((propMatch = directPropRegex.exec(baseContent)) !== null) {
      const cssProp = propMatch[1].trim()
      const cssValue = propMatch[2].trim()

      const styleProp = propertyMap[cssProp]
      if (styleProp && cssValue && !cssValue.includes("@")) {
        // Handle shorthand padding/margin (e.g., "5px 10px")
        if (
          (cssProp === "padding" || cssProp === "margin") &&
          cssValue.includes(" ")
        ) {
          // Convert toRem calls in shorthand values
          const processedValue = cssValue.replace(
            /toRem\.toRem\((-?[0-9.]+)\)/g,
            (match, num) => {
              return Math.round(parseFloat(num)) + "px"
            },
          )
          styleObj.base[styleProp] = `'${processedValue}'`
        }
        // Handle border shorthand (e.g., "1px solid var(--shade-2)")
        else if (cssProp === "border" && cssValue.includes(" ")) {
          // Convert toRem calls in border values
          const processedValue = cssValue.replace(
            /toRem\.toRem\((-?[0-9.]+)\)/g,
            (match, num) => {
              return Math.round(parseFloat(num)) + "px"
            },
          )
          styleObj.base.border = `'${processedValue}'`
        } else {
          const styleValue = convertValue(styleProp, cssValue)
          if (styleValue !== null && styleValue !== undefined) {
            styleObj.base[styleProp] = styleValue
          }
        }
      }
    }

    // Always include the class - even if it only has CSS-only properties like animation
    // This ensures we generate the className for CSS modules
    styles[className] = styleObj
  }

  return styles
}

// Helper to convert kebab-case to camelCase
const kebabToCamel = (str) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

const generateCode = (styles, inputFile) => {
  const fileName = path.basename(inputFile, ".module.scss")
  // Convert to PascalCase: capitalize first letter and convert kebab-case to PascalCase
  const camelFileName = fileName
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    .replace(/^([a-z])/, (g) => g.toUpperCase())

  // Calculate relative path to the shared styles directory based on file location
  // This ensures subfolders like packages/ui/addToHomeScreen generate
  // imports such as "../styles/createStyleHook" instead of "./styles/..."
  const inputDir = path.dirname(path.resolve(inputFile))
  const stylesDir = path.resolve(__dirname, "../packages/ui/styles")
  let stylesImportPath = path.relative(inputDir, stylesDir)

  // Normalize path separators for cross-platform support
  stylesImportPath = stylesImportPath.split(path.sep).join("/")

  // If relative path doesn't start with "." (e.g. "styles"), prefix with "./"
  if (!stylesImportPath.startsWith(".")) {
    stylesImportPath = `./${stylesImportPath}`
  }

  let code = `/**
 * Generated from ${path.basename(inputFile)}
 * Auto-converted SCSS to Unified Styles
 * 
 * Works on both web and native! 🎉
 */

export const ${camelFileName}StyleDefs = {\n`

  for (const [className, styleObj] of Object.entries(styles)) {
    const camelClassName = kebabToCamel(className)
    const hasInteractive =
      Object.keys(styleObj.hover).length > 0 ||
      Object.keys(styleObj.active).length > 0 ||
      Object.keys(styleObj.focus).length > 0 ||
      Object.keys(styleObj.disabled).length > 0

    if (hasInteractive) {
      // Generate with interactive states
      code += `  ${camelClassName}: {\n`
      code += `    base: {\n`
      for (const [prop, value] of Object.entries(styleObj.base)) {
        const camelProp = kebabToCamel(prop)
        code += `      ${camelProp}: ${value},\n`
      }
      code += `    },\n`

      if (Object.keys(styleObj.hover).length > 0) {
        code += `    hover: {\n`
        for (const [prop, value] of Object.entries(styleObj.hover)) {
          const camelProp = kebabToCamel(prop)
          code += `      ${camelProp}: ${value},\n`
        }
        code += `    },\n`
      }

      if (Object.keys(styleObj.active).length > 0) {
        code += `    active: {\n`
        for (const [prop, value] of Object.entries(styleObj.active)) {
          const camelProp = kebabToCamel(prop)
          code += `      ${camelProp}: ${value},\n`
        }
        code += `    },\n`
      }

      if (Object.keys(styleObj.focus).length > 0) {
        code += `    focus: {\n`
        for (const [prop, value] of Object.entries(styleObj.focus)) {
          const camelProp = kebabToCamel(prop)
          code += `      ${camelProp}: ${value},\n`
        }
        code += `    },\n`
      }

      if (Object.keys(styleObj.disabled).length > 0) {
        code += `    disabled: {\n`
        for (const [prop, value] of Object.entries(styleObj.disabled)) {
          const camelProp = kebabToCamel(prop)
          code += `      ${camelProp}: ${value},\n`
        }
        code += `    },\n`
      }

      code += `  },\n`
    } else {
      // Generate flat structure for non-interactive styles
      code += `  ${camelClassName}: {\n`
      for (const [prop, value] of Object.entries(styleObj.base)) {
        const camelProp = kebabToCamel(prop)
        code += `    ${camelProp}: ${value},\n`
      }
      code += `  },\n`
    }
  }

  code += `} as const\n\n`

  // Check if any styles have interactive states
  // ustable
  const hasAnyInteractive = false

  // Object.values(styles).some(
  //   (styleObj) =>
  //     Object.keys(styleObj.hover).length > 0 ||
  //     Object.keys(styleObj.active).length > 0 ||
  //     Object.keys(styleObj.focus).length > 0 ||
  //     Object.keys(styleObj.disabled).length > 0,
  // )

  if (hasAnyInteractive) {
    // Generate with interactive styles support
    code += `import { createUnifiedStyles } from '${stylesImportPath}/createUnifiedStyles'
import { useInteractiveStyles } from '${stylesImportPath}/useInteractiveStyles'

export const ${camelFileName}Styles = createUnifiedStyles(${camelFileName}StyleDefs)

// ---- Stronger types for style defs and hook results ----

// A minimal shape for a style object. You can expand this later to be more specific
// (e.g., union of CSS properties used across web/native).
type StyleObject = { [key: string]: string | number | boolean | StyleObject | undefined }

// Interactive (hover/focus/etc.) style definition
type InteractiveStyleDef = {
  base: StyleObject
  hover?: StyleObject
  active?: StyleObject
  focus?: StyleObject
  disabled?: StyleObject
}

// Static style definition is simply a style object
type StaticStyleDef = StyleObject

// explicit static result shape for non-interactive classes
type StaticStyleResult = {
  style: StaticStyleDef
  handlers: Record<string, never>
  state: { isHovered: false; isPressed: false; isFocused: false }
}

// interactive style hook result (keeps your existing hook return type)
type InteractiveStyleResult = ReturnType<typeof useInteractiveStyles>

// Create a discriminated mapped type so each key gets the right result type
export type ${camelFileName}StylesHook = {
  [K in keyof typeof ${camelFileName}StyleDefs]: typeof ${camelFileName}StyleDefs[K] extends { base: any }
    ? InteractiveStyleResult
    : StaticStyleResult
}

// Type guard to narrow a StyleDef to InteractiveStyleDef without using any casts
function isInteractiveStyleDef(def: unknown): def is InteractiveStyleDef {
  return typeof def === 'object' && def !== null && Object.prototype.hasOwnProperty.call(def, 'base')
}

// Create interactive style hooks (safe - calls hooks deterministically)
export const use${camelFileName}Styles = (): ${camelFileName}StylesHook => {
  // Call all hooks upfront in a stable order (Rules of Hooks compliant)
  const styleResults: Partial<Record<keyof typeof ${camelFileName}StyleDefs, any>> = {}

  // Use Object.keys to ensure consistent iteration order across environments
  const keys = Object.keys(${camelFileName}StyleDefs) as Array<keyof typeof ${camelFileName}StyleDefs>

  for (const className of keys) {
    const styleDef = ${camelFileName}StyleDefs[className]

    if (isInteractiveStyleDef(styleDef)) {
      // styleDef is narrowed to InteractiveStyleDef here (no any cast needed)
      const { base = {}, hover = {}, active = {}, focus = {}, disabled = {} } = styleDef
      
      // Call useInteractiveStyles for interactive styles
      styleResults[className] = useInteractiveStyles({
        baseStyle: base,
        hoverStyle: hover,
        activeStyle: active,
        focusStyle: focus,
        disabledStyle: disabled,
      })
    } else {
      // Static styles - no hook needed
      // styleDef is narrowed to StaticStyleDef here
      styleResults[className] = {
        style: styleDef as StaticStyleDef,
        handlers: {},
        state: { isHovered: false, isPressed: false, isFocused: false },
      }
    }
  }

  return styleResults as ${camelFileName}StylesHook
}
`
  } else {
    // Generate without interactive styles
    code += `import { createUnifiedStyles } from '${stylesImportPath}/createUnifiedStyles'
import { createStyleHook } from '${stylesImportPath}/createStyleHook'

export const ${camelFileName}Styles = createUnifiedStyles(${camelFileName}StyleDefs)

// Type for the hook return value
type ${camelFileName}StylesHook = {
  [K in keyof typeof ${camelFileName}StyleDefs]: {
    className?: string
    style?: Record<string, any>
  }
}

// Create the style hook using the factory
export const use${camelFileName}Styles = createStyleHook<${camelFileName}StylesHook>(${camelFileName}Styles)
`
  }

  return code
}

const convertFile = async (inputFile, outputFile) => {
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`)
    return false
  }

  const scssContent = fs.readFileSync(inputFile, "utf8")

  console.log(`📖 Reading: ${inputFile}`)

  const styles = parseScss(scssContent)

  if (Object.keys(styles).length === 0) {
    console.warn(`⚠️  No styles found in ${inputFile}`)
    return false
  }

  console.log(`🎨 Found ${Object.keys(styles).length} style classes`)

  let code = generateCode(styles, inputFile)

  // Format with Prettier if available
  try {
    const prettier = await import("prettier")

    // Try to load project's Prettier config
    const prettierConfig = (await prettier.resolveConfig(outputFile)) || {
      semi: false,
      singleQuote: false,
      trailingComma: "all",
    }

    // Always set parser to typescript
    prettierConfig.parser = "typescript"

    code = await prettier.format(code, prettierConfig)
  } catch (error) {
    // Prettier not available or failed, use unformatted code
    console.log(`ℹ️  Prettier not available, skipping formatting`)
    console.log(`   Error: ${error.message}`)
  }

  fs.writeFileSync(outputFile, code)

  console.log(`✅ Generated: ${outputFile}`)
  return true
}

const main = async () => {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`📦 SCSS to Unified Styles Converter\n`)
    console.log(`Usage:`)
    console.log(
      `  node scripts/scss-to-unified.js <input.module.scss> [output.styles.ts]`,
    )
    console.log(`  node scripts/scss-to-unified.js --all\n`)
    console.log(`Examples:`)
    console.log(
      `  node scripts/scss-to-unified.js packages/ui/Thread.module.scss`,
    )
    console.log(`  node scripts/scss-to-unified.js --all`)
    process.exit(0)
  }

  // Handle --all flag
  if (args[0] === "--all") {
    const uiDir = path.join(__dirname, "../packages/ui")

    if (!fs.existsSync(uiDir)) {
      console.error(`❌ Directory not found: ${uiDir}`)
      process.exit(1)
    }

    // Recursively collect all *.module.scss files inside packages/ui
    const collectScssFiles = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      const files = []

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          files.push(...collectScssFiles(fullPath))
        } else if (
          entry.isFile() &&
          entry.name.toLowerCase().endsWith(".module.scss")
        ) {
          files.push(fullPath)
        }
      }

      return files
    }

    const files = collectScssFiles(uiDir)

    if (files.length === 0) {
      console.log(`ℹ️  No .module.scss files found in ${uiDir}`)
      process.exit(0)
    }

    console.log(`🔄 Converting ${files.length} SCSS files...\n`)

    let converted = 0
    for (const inputPath of files) {
      const outputPath = inputPath.replace(".module.scss", ".styles.ts")
      if (await convertFile(inputPath, outputPath)) {
        converted++
      }
    }

    console.log(`✅ Converted ${converted}/${files.length} files!`)
    return
  }

  const inputFile = args[0]
  const outputFile = args[1] || inputFile.replace(".module.scss", ".styles.ts")

  await convertFile(inputFile, outputFile)
}

main()

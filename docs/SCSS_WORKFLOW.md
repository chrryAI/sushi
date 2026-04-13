# SCSS to TypeScript Workflow

Complete guide for the automated SCSS to TypeScript conversion system.

## 🎯 Overview

This system automatically converts SCSS files to cross-platform TypeScript styles that work on both web and React Native.

## 📝 Writing SCSS

### File Naming Convention

```
ComponentName.module.scss  →  ComponentName.styles.ts
```

### Supported Features

#### 1. Basic Styles

```scss
.container {
  display: flex;
  flex-direction: column;
  padding: toRem.toRem(16);
  background-color: var(--background);
}
```

#### 2. Interactive States

```scss
.button {
  background-color: var(--accent-6);

  &:hover {
    background-color: var(--accent-5);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus {
    outline: 2px solid var(--accent-6);
  }

  &:disabled {
    opacity: 0.5;
  }
}
```

#### 3. CSS Variables

```scss
.card {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--shade-2);
}
```

#### 4. Responsive Fonts

```scss
.title {
  font-size: 4vw; // Automatically clamped between min/max
}
```

#### 5. toRem.toRem() Function

```scss
.box {
  padding: toRem.toRem(16); // Converts to 16
  margin: toRem.toRem(8); // Converts to 8
}
```

## 🔄 Conversion Commands

### Manual Conversion

```bash
# Convert single file
npm run s packages/ui/Button.module.scss packages/ui/Button.styles.ts

# Convert all SCSS files
npm run s:all

# Convert only changed files (git staged)
npm run s:changed
```

### Automatic Conversion

The pre-commit hook automatically converts changed SCSS files:

```bash
git add Button.module.scss
git commit -m "Update button styles"
# ✅ Automatically converts Button.module.scss → Button.styles.ts
# ✅ Stages the generated .styles.ts file
```

## 📦 Generated Output

### Non-Interactive Styles (Flat Structure)

Input:

```scss
.container {
  display: flex;
  padding: 16px;
}
```

Output:

```typescript
export const ComponentStyleDefs = {
  container: {
    display: "flex",
    padding: 16,
  },
};

export const useComponentStyles = createStyleHook<ComponentStylesHook>(ComponentStyles);
```

### Interactive Styles (Nested Structure)

Input:

```scss
.button {
  background: blue;
  &:hover {
    background: cyan;
  }
}
```

Output:

```typescript
export const ComponentStyleDefs = {
  button: {
    base: {
      background: "blue",
    },
    hover: {
      background: "cyan",
    },
  },
};

export const useComponentStyles = (): ComponentStylesHook => {
  // Uses useInteractiveStyles automatically
};
```

## 🎨 Using Generated Styles

### Basic Usage

```typescript
import { useComponentStyles } from './Component.styles'

function MyComponent() {
  const styles = useComponentStyles()

  return (
    <Div style={styles.container.style}>
      Content
    </Div>
  )
}
```

### Interactive Styles

```typescript
import { useComponentStyles } from './Component.styles'

function MyButton() {
  const styles = useComponentStyles()

  return (
    <Button
      style={styles.button.style}
      {...styles.button.handlers}  // Hover, active, focus handlers
    >
      Click me
    </Button>
  )
}
```

### Accessing State

```typescript
const styles = useComponentStyles();

console.log(styles.button.state.isHovered); // boolean
console.log(styles.button.state.isPressed); // boolean
console.log(styles.button.state.isFocused); // boolean
```

## 🧪 Testing

### Run Tests

```bash
# Run SCSS converter tests
npm test

# Or specifically
npm run test:scss
```

### Test File

The test file `packages/ui/__tests__/TestComponent.module.scss` contains comprehensive examples of all supported features.

### What Gets Tested

- ✅ Basic style conversion
- ✅ toRem.toRem() → numbers
- ✅ CSS variables → theme markers
- ✅ Interactive states detection
- ✅ Responsive font sizes
- ✅ kebab-case → camelCase
- ✅ TypeScript types generation
- ✅ Proper structure (flat vs nested)

## 🔧 Troubleshooting

### Issue: Styles not updating

**Solution:** Regenerate the styles file:

```bash
npm run s:changed
```

### Issue: TypeScript errors in generated file

**Solution:** Check your SCSS syntax and run tests:

```bash
npm run test:scss
```

### Issue: Interactive states not working

**Solution:** Ensure you're using the handlers:

```typescript
<Button
  style={styles.button.style}
  {...styles.button.handlers}  // ← Don't forget this!
>
```

### Issue: CSS variables not resolving

**Solution:** Make sure the variable exists in `styles/theme.ts`:

```typescript
// Check if your CSS var is mapped
'--your-var': 'yourVar'
```

## 📚 Architecture

### Files

- `scripts/scss-to-universal.js` - Main converter
- `scripts/convert-changed-scss.js` - Git-aware converter
- `scripts/test-scss-converter.js` - Test runner
- `packages/ui/styles/createStyleHook.ts` - Hook factory
- `packages/ui/styles/createStyleProxy.ts` - Proxy with caching
- `packages/ui/styles/resolveThemeValue.ts` - Theme resolver
- `packages/ui/styles/useInteractiveStyles.ts` - Interactive states
- `packages/ui/styles/theme.ts` - Theme definitions

### Flow

```
SCSS File
    ↓
Converter Script
    ↓
TypeScript Definitions
    ↓
createStyleHook / useInteractiveStyles
    ↓
React Component
```

## 🚀 Best Practices

1. **Always use .module.scss extension** for component styles
2. **Use CSS variables** for theme colors (e.g., `var(--accent-6)`)
3. **Use toRem.toRem()** for consistent spacing
4. **Add interactive states** for better UX (`:hover`, `:active`, etc.)
5. **Test your styles** after conversion
6. **Commit both** `.module.scss` and `.styles.ts` files

## 🎯 Benefits

- ✅ **Cross-platform** - Works on web and React Native
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Theme-aware** - Automatic light/dark mode
- ✅ **Responsive** - Viewport units work everywhere
- ✅ **Interactive** - Hover/active/focus states on native
- ✅ **Performant** - Cached with debounced resize
- ✅ **Maintainable** - Write SCSS, get TypeScript
- ✅ **Tested** - Comprehensive test coverage

## 📖 Examples

See `packages/ui/__tests__/TestComponent.module.scss` for a comprehensive example covering all features.

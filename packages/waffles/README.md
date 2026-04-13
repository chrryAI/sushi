# 🧇 Waffles

**Production-ready Playwright testing utilities for AI applications**

[![npm](https://img.shields.io/npm/v/@chrryai/waffles)](https://www.npmjs.com/package/@chrryai/waffles)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Battle-tested helpers from [Vex](https://vex.chrry.ai) - A production AI platform with 6,813+ commits in 2025

---

## 🎯 Why Waffles?

Waffles provides a collection of battle-tested Playwright utilities that make E2E testing delightful. Born from real-world production testing at Vex, these helpers solve common testing challenges like simulating user input, waiting for elements, and generating test data.

## ✨ Features

- 🎭 **Playwright-first** - Built specifically for Playwright
- 🧪 **Production-tested** - Used in Vex's extensive test suite
- 📦 **Zero config** - Works out of the box
- 🎯 **TypeScript** - Full type safety
- 🚀 **Lightweight** - Minimal dependencies

## 📦 Installation

```bash
npm install @chrryai/waffles @playwright/test
```

## 🚀 Quick Start

```typescript
import { test, expect } from "@playwright/test";
import { wait, simulateInputPaste, waitForElement, generateTestEmail } from "@chrryai/waffles";

test("chat interaction", async ({ page }) => {
  await page.goto("https://yourapp.com");

  // Wait for chat to load
  await waitForElement(page, '[data-testid="chat-textarea"]');

  // Simulate pasting text
  await simulateInputPaste(page, "Hello, AI!");

  // Wait for response
  await wait(1000);

  // Assert
  await expect(page.locator(".message")).toBeVisible();
});
```

## 📚 API Reference

### Timing Utilities

#### `wait(ms: number)`

Wait for a specified number of milliseconds.

```typescript
await wait(1000); // Wait 1 second
```

#### `waitForElement(page, selector, timeout?)`

Wait for an element to be visible.

```typescript
await waitForElement(page, ".loading-spinner", 5000);
```

#### `waitForElementToDisappear(page, selector, timeout?)`

Wait for an element to disappear.

```typescript
await waitForElementToDisappear(page, ".loading-spinner");
```

### Input Simulation

#### `simulateInputPaste(page, text, selector?)`

Simulate pasting text into a textarea.

```typescript
await simulateInputPaste(page, "Pasted content");
```

#### `simulatePaste(page, text, buttonSelector?)`

Simulate pasting using clipboard API and clicking paste button.

```typescript
await simulatePaste(page, "Clipboard content");
```

### Navigation

#### `getURL(options)`

Generate a URL with optional fingerprint for testing.

```typescript
const url = getURL({
  baseURL: "https://app.com",
  path: "/chat",
  isMember: true,
  memberFingerprint: "abc-123",
});
```

#### `scrollToBottom(page)`

Scroll to the bottom of the page.

```typescript
await scrollToBottom(page);
```

### Utilities

#### `capitalizeFirstLetter(str: string)`

Capitalize the first letter of a string.

```typescript
capitalizeFirstLetter("hello"); // "Hello"
```

#### `generateTestEmail(prefix?)`

Generate a unique test email.

```typescript
const email = generateTestEmail("user"); // user-1234567890-abc123@test.com
```

#### `generateTestPassword(length?)`

Generate a random password for testing.

```typescript
const password = generateTestPassword(16);
```

### Cleanup

#### `clearLocalStorage(page)`

Clear browser local storage.

```typescript
await clearLocalStorage(page);
```

#### `clearCookies(page)`

Clear browser cookies.

```typescript
await clearCookies(page);
```

### Screenshots

#### `takeScreenshot(page, name, fullPage?)`

Take a screenshot with a custom name.

```typescript
await takeScreenshot(page, "error-state", true);
```

## 🎨 Real-World Examples

### Testing Chat Flow

```typescript
import { test } from "@playwright/test";
import { simulateInputPaste, waitForElement, wait } from "@chrryai/waffles";

test("complete chat interaction", async ({ page }) => {
  await page.goto("https://app.com/chat");

  // Wait for chat to be ready
  await waitForElement(page, '[data-testid="chat-textarea"]');

  // Send message
  await simulateInputPaste(page, "What's the weather?");
  await page.click('[data-testid="send-button"]');

  // Wait for AI response
  await wait(2000);
  await waitForElement(page, ".ai-message");
});
```

### Testing Authentication

```typescript
import { test } from "@playwright/test";
import { generateTestEmail, generateTestPassword, wait } from "@chrryai/waffles";

test("user registration", async ({ page }) => {
  const email = generateTestEmail("newuser");
  const password = generateTestPassword();

  await page.goto("https://app.com/signup");
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');

  await wait(1000);
  await expect(page).toHaveURL(/dashboard/);
});
```

## 🤝 Contributing

We welcome contributions! Waffles is extracted from Vex's production test suite, and we're always improving it.

## 🔗 Links

- [GitHub](https://github.comchrryAIwaffles)
- [npm](https://npmjs.com/package/@chrryai/waffles)
- [Issues](https://github.comchrryAIwaffles/issues)
- [Vex - Powered by Waffles](https://vex.chrry.ai)

---

**Built with ❤️ by the Vex team**

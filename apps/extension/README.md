# Vex Browser Extension

This is the browser extension for the Vex platform. It is built using React, TypeScript, and Vite.

## ✨ Features

- **Multi-App Architecture**: This single codebase is used to build multiple, distinct extensions:
  - **Atlas**: A travel-focused extension.
  - **Focus**: A productivity-focused extension.
  - **Vex**: The main Vex platform extension.
- **AI-Powered**: The extension is powered by the Vex AI platform, providing you with AI assistance in your browser.
- **Cross-Browser**: The extension is designed to work in both Chrome and Firefox.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Setup Instructions

1.  **Install dependencies**:

    ```bash
    pnpm install
    ```

2.  **Build the extension**:

    ```bash
    # Build a specific extension (e.g., atlas)
    pnpm run build:chrome:atlas

    # Build all extensions
    pnpm run build:chrome
    ```

3.  **Load the extension in your browser**:
    - **Chrome**:
      1.  Go to `chrome://extensions`.
      2.  Enable "Developer mode".
      3.  Click "Load unpacked".
      4.  Select the `dist` directory.
    - **Firefox**:
      1.  Go to `about:debugging`.
      2.  Click "This Firefox".
      3.  Click "Load Temporary Add-on".
      4.  Select the `dist/manifest.json` file.

## 🛠️ Development

To build the extension for development, run the following command:

```bash
pnpm run build:dev
```

To watch for changes and automatically rebuild the extension, run:

```bash
pnpm run dev:watch
```

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

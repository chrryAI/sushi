# Release Workflow

This document describes how to build and distribute desktop applications for the Vex ecosystem.

## Building Desktop Apps

### Prerequisites

1. **ImageMagick** - Required for icon generation

   ```bash
   # macOS
   brew install imagemagick

   # Ubuntu/Debian
   sudo apt-get install imagemagick

   # Fedora
   sudo dnf install imagemagick
   ```

2. **Rust & Tauri CLI** - For building native apps
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   cargo install tauri-cli
   ```

### Build Process

Each app mode has its own build script:

```bash
# Build individual apps
pnpm build:vex        # Vex 🍒
pnpm build:atlas      # Atlas 🌍
pnpm build:burn       # Burn 🔥
pnpm build:focus      # Focus ⏱️
pnpm build:grape      # Grape 🍇
pnpm build:popcorn    # Popcorn 🍿
pnpm build:search     # Search 🔍
pnpm build:zarathustra # Zarathustra 🔮

# Build all apps
pnpm build:all
```

### What Happens During Build

1. **Icon Generation** (`generate-icons.js`)
   - Takes high-res 500x500 PNG from `apps/flash/public/images/apps/{mode}.png`
   - Generates all required sizes (16, 32, 48, 128, 256, 512, 1024)
   - Creates `.icns` for macOS and `.ico` for Windows

2. **Config Generation** (`generate-tauri-config.js`)
   - Reads `tauri.conf.template.json`
   - Replaces placeholders with mode-specific values from `siteConfig.ts`
   - Writes to `tauri.conf.json` (gitignored)

3. **Vite Build**
   - Bundles the React app for production

4. **Tauri Build**
   - Compiles Rust backend
   - Packages the app with native webview
   - Creates installers (.app for macOS, .dmg, etc.)

## Distribution

### Build Artifacts

After building, you'll find:

- **macOS**: `apps/desktop/src-tauri/target/release/bundle/macos/{App Name}.app`
- **DMG**: `apps/desktop/src-tauri/target/release/bundle/dmg/{App Name}_0.1.0_aarch64.dmg`

### Publishing to GitHub Releases

**DO NOT** commit binary files to git. Instead:

1. **Create a GitHub Release**

   ```bash
   gh release create v1.8.47 \
     --title "v1.8.47 - Multi-App Release" \
     --notes "Release notes here"
   ```

2. **Upload Build Artifacts**

   ```bash
   gh release upload v1.8.47 \
     apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg
   ```

3. **Update Download Links**
   - Reference GitHub Release URLs in your app
   - Example: `https://github.com/your-org/vex/releases/download/v1.8.47/Vex_0.1.0_aarch64.dmg`

### Alternative: CDN Distribution

For faster downloads, upload to a CDN:

1. **Cloudflare R2 / AWS S3**

   ```bash
   aws s3 cp apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg \
     s3://your-bucket/releases/v1.8.47/
   ```

2. **Set up CloudFront** for global distribution

3. **Update app to reference CDN URLs**

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Desktop Apps

on:
  push:
    tags:
      - "v*"

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install ImageMagick
        run: brew install imagemagick

      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies
        run: pnpm install

      - name: Build all apps
        run: pnpm build:all

      - name: Upload to GitHub Releases
        uses: softprops/action-gh-release@v1
        with:
          files: apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg
```

## Architecture Notes

### Template System

The `tauri.conf.template.json` is the **source of truth** for Tauri configuration. It uses placeholders:

- `{{PRODUCT_NAME}}` - App name (e.g., "Vex 🍒")
- `{{WINDOW_TITLE}}` - Window title
- `{{SHORT_DESCRIPTION}}` - 80-char description
- `{{LONG_DESCRIPTION}}` - Full description

The generated `tauri.conf.json` is **gitignored** to prevent diff noise.

### Icon Management

Source icons (500x500 PNG) live in:

```
apps/flash/public/images/apps/
├── vex.png
├── atlas.png
├── burn.png
└── ...
```

Generated icons are created on-demand during build and are **not committed to git**.

## Troubleshooting

### "ImageMagick not found"

Install ImageMagick using the instructions in Prerequisites.

### "Template not found"

Ensure `apps/desktop/src-tauri/tauri.conf.template.json` exists.

### "Build fails on CI"

Check that ImageMagick and Rust are installed in your CI environment.

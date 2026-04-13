# Tauri Production Build Guide

## Overview

This guide covers building production-ready Tauri desktop apps for all platforms with proper code signing and entitlements.

## Prerequisites

### macOS

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Code Signing (macOS)

For distributable builds, you need an Apple Developer account and certificates:

1. **Get Apple Developer Certificate**
   - Join Apple Developer Program ($99/year)
   - Download "Developer ID Application" certificate from developer.apple.com
   - Install in Keychain Access

2. **Set Environment Variables**
   ```bash
   export APPLE_CERTIFICATE_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
   export APPLE_ID="your@email.com"
   export APPLE_PASSWORD="app-specific-password"
   export APPLE_TEAM_ID="YOUR_TEAM_ID"
   ```

## Building for Production

### Single App Build

```bash
# Build specific app (e.g., Vex)
cd apps/browser
pnpm build:vex
```

This will:

1. Generate icons for the app
2. Generate Tauri config from template
3. Build Vite frontend
4. Build Tauri backend
5. Create DMG installer in `src-tauri/target/release/bundle/dmg/`

### Build All Apps

```bash
cd apps/browser
pnpm build:all
```

Builds all 9 apps sequentially:

- Atlas
- Focus
- Vex
- Popcorn
- ChrryAI
- Zarathustra
- Search
- Grape
- Burn

## Entitlements

The `entitlements.plist` file grants necessary permissions:

- **Network Access**: `com.apple.security.network.client/server`
- **File Access**: User-selected files and downloads
- **App Sandbox**: Disabled for full functionality
- **JIT**: Enabled for better performance
- **Camera/Microphone**: For media features

### Why Disable App Sandbox?

App Sandbox is disabled (`<false/>`) because:

1. Tauri apps need full system access
2. Window dragging requires unrestricted access
3. Deep linking and custom protocols need it
4. Simplifies development and distribution

**Note**: This is standard for Electron/Tauri apps. For App Store distribution, you'd need to enable sandbox and request specific entitlements.

## Troubleshooting

### "Uninstallable" DMG

**Cause**: Missing or incorrect entitlements
**Fix**: Ensure `entitlements.plist` exists and is referenced in `tauri.conf.json`

### Drag Permission Not Working

**Cause**: Missing `com.apple.security.app-sandbox` = false
**Fix**: Already fixed in `entitlements.plist`

### Code Signing Errors

```bash
# Verify certificate
security find-identity -v -p codesigning

# Check if app is signed
codesign -dv --verbose=4 ./src-tauri/target/release/bundle/macos/Vex.app

# Sign manually if needed
codesign --force --deep --sign "Developer ID Application: Your Name" ./src-tauri/target/release/bundle/macos/Vex.app
```

### Notarization (for Distribution)

```bash
# After building, notarize the DMG
xcrun notarytool submit \
  ./src-tauri/target/release/bundle/dmg/Vex_0.1.0_aarch64.dmg \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "YOUR_TEAM_ID" \
  --wait

# Staple the notarization ticket
xcrun stapler staple ./src-tauri/target/release/bundle/dmg/Vex_0.1.0_aarch64.dmg
```

## Build Artifacts

After successful build, find your installers:

### macOS

- **DMG**: `src-tauri/target/release/bundle/dmg/`
- **App Bundle**: `src-tauri/target/release/bundle/macos/`

### Windows

- **MSI**: `src-tauri/target/release/bundle/msi/`
- **NSIS**: `src-tauri/target/release/bundle/nsis/`

### Linux

- **AppImage**: `src-tauri/target/release/bundle/appimage/`
- **DEB**: `src-tauri/target/release/bundle/deb/`

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build Desktop Apps
on:
  push:
    tags:
      - "v*"

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - name: Install Rust
        uses: actions-rs/toolchain@v1
      - name: Build Vex
        run: |
          cd apps/browser
          pnpm install
          pnpm build:vex
        env:
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
      - name: Upload DMG
        uses: actions/upload-artifact@v3
        with:
          name: Vex-macOS
          path: apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg
```

## Development vs Production

### Development

- Uses `tauri dev` with hot reload
- No code signing required
- Faster iteration

### Production

- Uses `tauri build` with optimizations
- Requires code signing for distribution
- Creates installable packages

## Best Practices

1. **Always test production builds** before distribution
2. **Keep entitlements minimal** - only request what you need
3. **Sign and notarize** for macOS distribution
4. **Version your builds** using semantic versioning
5. **Test on clean machines** to catch missing dependencies

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

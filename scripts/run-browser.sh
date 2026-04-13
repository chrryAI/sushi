#!/bin/bash
# Browser Quick Start
# Downloads ungoogled-chromium and runs it with extension

set -e

echo "🌐 Browser Setup"
echo "======================"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Darwin*)    PLATFORM="mac";;
    Linux*)     PLATFORM="linux";;
    *)          echo "❌ Unsupported OS: ${OS}"; exit 1;;
esac

echo "📦 Platform: ${PLATFORM}"

# Download ungoogled-chromium
CHROME_DIR="$(pwd)/browser"
mkdir -p "${CHROME_DIR}"

if [[ "${PLATFORM}" = "mac" ]]; then
    echo "⬇️  Downloading ungoogled-chromium for macOS..."
    
    # Detect Architecture
    ARCH="$(uname -m)"
    if [[ "${ARCH}" = "arm64" ]]; then
        echo "🍎 Apple Silicon detected"
        ARCH_PATTERN="arm64"
    else
        echo "💻 Intel Mac detected"
        ARCH_PATTERN="x86_64"
    fi

    # Fetch latest release URL via GitHub API
    echo "🔍 Finding latest release..."
    LATEST_RELEASE_URL=$(curl -s https://api.github.com/repos/ungoogled-software/ungoogled-chromium-macos/releases/latest | grep "browser_download_url" | grep ".dmg" | grep "${ARCH_PATTERN}" | cut -d '"' -f 4 | head -n 1)

    if [[ -z "${LATEST_RELEASE_URL}" ]]; then
        echo "❌ Could not find a download URL for ${ARCH}. Falling back to x86_64..."
        LATEST_RELEASE_URL=$(curl -s https://api.github.com/repos/ungoogled-software/ungoogled-chromium-macos/releases/latest | grep "browser_download_url" | grep ".dmg" | grep "x86_64" | cut -d '"' -f 4 | head -n 1)
    fi

    if [[ -z "${LATEST_RELEASE_URL}" ]]; then
        echo "❌ Failed to find download URL. Please download manually."
        exit 1
    fi

    echo "🔗 URL: ${LATEST_RELEASE_URL}"
    
    # Download
    curl -L "${LATEST_RELEASE_URL}" -o "${CHROME_DIR}/ungoogled-chromium.dmg"
    
    # Check if download was successful (size > 1MB)
    FILE_SIZE=$(wc -c < "${CHROME_DIR}/ungoogled-chromium.dmg" | xargs)
    if [[ "${FILE_SIZE}" -lt 1000000 ]]; then
        echo "❌ Download failed (file too small). Response:"
        cat "${CHROME_DIR}/ungoogled-chromium.dmg"
        exit 1
    fi

    # Mount DMG and parse mount point
    echo "💿 Mounting DMG..."
    # Attach and get the line with /Volumes
    MOUNT_OUTPUT=$(yes | hdiutil attach "${CHROME_DIR}/ungoogled-chromium.dmg")
    MOUNT_POINT=$(echo "$MOUNT_OUTPUT" | grep "/Volumes" | awk '{print $NF}')
    
    echo "📍 Mounted at: ${MOUNT_POINT}"
    
    if [[ -z "${MOUNT_POINT}" ]]; then
        echo "❌ Failed to detect mount point."
        exit 1
    fi

    # Find the .app inside
    APP_PATH=$(find "${MOUNT_POINT}" -maxdepth 1 -name "*.app" -print -quit)
    
    if [[ -z "${APP_PATH}" ]]; then
        echo "❌ Could not find .app in DMG."
        ls -la "${MOUNT_POINT}"
        hdiutil detach "${MOUNT_POINT}"
        exit 1
    fi
    
    echo "📦 Found app: ${APP_PATH}"
    
    # Copy app
    echo "📦 Installing..."
    rm -rf "${CHROME_DIR}/Browser.app"
    cp -R "${APP_PATH}" "${CHROME_DIR}/Browser.app"
    
    # Unmount
    echo "gf Unmounting..."
    hdiutil detach "${MOUNT_POINT}"
    
    echo "✅ Chromium installed"
    
    # Build Sushi extension
    echo "🔨 Building extension..."
    cd apps/sushi
    pnpm run build
    cd ../..
    
    # Load extension
    echo "🚀 Launching Browser..."
    
    # Resolve absolute paths
    PROFILE_DIR="${CHROME_DIR}/profile"
    EXTENSION_DIR="$(pwd)/apps/sushi/dist"
    
    echo "📂 Profile: ${PROFILE_DIR}"
    echo "📦 Extension: ${EXTENSION_DIR}"
    
    # Create preferences to enable extension
    mkdir -p "${PROFILE_DIR}/Default"
    cat > "${PROFILE_DIR}/Default/Preferences" <<EOF
{
  "extensions": {
    "settings": {}
  }
}
EOF
    
    open "${CHROME_DIR}/Browser.app" --args \
        --load-extension="${EXTENSION_DIR}" \
        --disable-extensions-except="${EXTENSION_DIR}" \
        --no-first-run \
        --no-default-browser-check \
        --disable-fre \
        --new-window \
        --user-data-dir="${PROFILE_DIR}"
    
elif [[ "${PLATFORM}" = "linux" ]]; then
    echo "⬇️  Downloading ungoogled-chromium for Linux..."
    # Add Linux download logic here
    echo "❌ Linux support coming soon"
    exit 1
fi

echo ""
echo "✅ Browser is running!"
echo "📁 Extension: apps/sushi/dist"
echo "📁 Profile: ${CHROME_DIR}/profile"

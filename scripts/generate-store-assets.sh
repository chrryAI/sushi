#!/bin/bash
# generate-store-assets.sh
# Generate Chrome Web Store assets for any app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick is not installed${NC}"
    echo -e "${YELLOW}Install with: brew install imagemagick${NC}"
    exit 1
fi

# Use magick command if available (v7), otherwise convert (v6)
if command -v magick &> /dev/null; then
    MAGICK="magick"
else
    MAGICK="convert"
fi

# Get app name from argument
APP_NAME=$1

if [[ -z "$APP_NAME" ]]; then
    echo -e "${RED}❌ Usage: ./scripts/generate-store-assets.sh <app-name>${NC}"
    echo -e "${YELLOW}Example: ./scripts/generate-store-assets.sh atlas${NC}"
    exit 1
fi

# Convert to lowercase and uppercase
APP_NAME_LOWER=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]')
APP_NAME_UPPER=$(echo "$APP_NAME" | tr '[:lower:]' '[:upper:]')
APP_NAME_TITLE=$(echo "${APP_NAME:0:1}" | tr '[:lower:]' '[:upper:]')$(echo "${APP_NAME:1}" | tr '[:upper:]' '[:lower:]')

# Paths
SOURCE_ICON="apps/flash/public/images/apps/${APP_NAME_LOWER}.png"
OUTPUT_DIR="apps/extension/store-assets/${APP_NAME_LOWER}"

# Check if source icon exists
if [[ ! -f "$SOURCE_ICON" ]]; then
    echo -e "${RED}❌ Source icon not found: $SOURCE_ICON${NC}"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}🎨 Generating Chrome Web Store assets for ${APP_NAME}...${NC}"

# 1. Store Icon (128x128)
echo -e "${YELLOW}📦 Creating store icon (128x128)...${NC}"
$MAGICK "$SOURCE_ICON" \
    -resize 128x128 \
    -background black \
    -gravity center \
    -extent 128x128 \
    "$OUTPUT_DIR/icon-128.png"
echo -e "${GREEN}✅ Store icon created${NC}"

# 2. Small Promo Tile (440x280)
echo -e "${YELLOW}🖼️  Creating small promo tile (440x280)...${NC}"
$MAGICK "$SOURCE_ICON" \
    -resize 220x220 \
    -filter Lanczos \
    -sharpen 0x1 \
    -background black \
    -gravity center \
    -extent 440x280 \
    "$OUTPUT_DIR/small-promo-440x280.png"
echo -e "${GREEN}✅ Small promo tile created${NC}"

# 3. Marquee Promo Tile (1400x560)
echo -e "${YELLOW}🎭 Creating marquee promo tile (1400x560)...${NC}"
$MAGICK "$SOURCE_ICON" \
    -resize 400x400 \
    -filter Lanczos \
    -sharpen 0x1 \
    -background black \
    -gravity center \
    -extent 1400x560 \
    "$OUTPUT_DIR/marquee-promo-1400x560.png"
echo -e "${GREEN}✅ Marquee promo tile created${NC}"

# 4. Screenshots (1280x800)
echo -e "${YELLOW}📸 Converting screenshots (1280x800)...${NC}"

# Look for screenshots in a folder named after the app
SCREENSHOTS_DIR="apps/extension/screenshots/${APP_NAME_LOWER}"

if [ -d "$SCREENSHOTS_DIR" ]; then
    echo -e "${BLUE}📂 Found screenshots folder: $SCREENSHOTS_DIR${NC}"
    
    # Get all image files (png, jpg, jpeg) sorted
    SCREENSHOT_FILES=($(find "$SCREENSHOTS_DIR" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | sort))
    
    if [ ${#SCREENSHOT_FILES[@]} -eq 0 ]; then
        echo -e "${RED}❌ No screenshots found in $SCREENSHOTS_DIR${NC}"
        echo -e "${YELLOW}⚠️  Falling back to icon-based screenshots${NC}"
        # Fallback: Generate from icon
        for i in {1..5}; do
            $MAGICK "$SOURCE_ICON" \
                -resize 400x400 \
                -filter Lanczos \
                -sharpen 0x1 \
                -background black \
                -gravity center \
                -extent 1280x800 \
                "$OUTPUT_DIR/screenshot-${i}-1280x800.png"
        done
    else
        echo -e "${GREEN}✅ Found ${#SCREENSHOT_FILES[@]} screenshot(s)${NC}"
        
        # Convert each screenshot to 1280x800
        for i in "${!SCREENSHOT_FILES[@]}"; do
            SCREENSHOT_NUM=$((i + 1))
            if [ $SCREENSHOT_NUM -le 5 ]; then
                echo -e "${BLUE}  Converting screenshot $SCREENSHOT_NUM...${NC}"
                $MAGICK "${SCREENSHOT_FILES[$i]}" \
                    -resize 1280x800^ \
                    -gravity center \
                    -extent 1280x800 \
                    -quality 95 \
                    "$OUTPUT_DIR/screenshot-${SCREENSHOT_NUM}-1280x800.png"
            fi
        done
        
        # If less than 5 screenshots, fill remaining with icon
        if [ ${#SCREENSHOT_FILES[@]} -lt 5 ]; then
            echo -e "${YELLOW}⚠️  Only ${#SCREENSHOT_FILES[@]} screenshot(s) found, filling remaining with icon${NC}"
            for i in $(seq $((${#SCREENSHOT_FILES[@]} + 1)) 5); do
                $MAGICK "$SOURCE_ICON" \
                    -resize 400x400 \
                    -filter Lanczos \
                    -sharpen 0x1 \
                    -background black \
                    -gravity center \
                    -extent 1280x800 \
                    "$OUTPUT_DIR/screenshot-${i}-1280x800.png"
            done
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Screenshots folder not found: $SCREENSHOTS_DIR${NC}"
    echo -e "${YELLOW}⚠️  Generating screenshots from icon instead${NC}"
    # Fallback: Generate from icon
    for i in {1..5}; do
        $MAGICK "$SOURCE_ICON" \
            -resize 400x400 \
            -filter Lanczos \
            -sharpen 0x1 \
            -background black \
            -gravity center \
            -extent 1280x800 \
            "$OUTPUT_DIR/screenshot-${i}-1280x800.png"
    done
fi

echo -e "${GREEN}✅ Screenshots created (5)${NC}"

# 5. Alternative screenshot size (640x400)
echo -e "${YELLOW}📸 Creating alternative screenshots (640x400)...${NC}"
for i in {1..5}; do
    $MAGICK "$OUTPUT_DIR/screenshot-${i}-1280x800.png" \
        -resize 640x400 \
        "$OUTPUT_DIR/screenshot-${i}-640x400.png"
done
echo -e "${GREEN}✅ Alternative screenshots created${NC}"

# Summary
echo -e "\n${GREEN}🎉 All assets generated successfully!${NC}"
echo -e "${BLUE}📁 Output directory: $OUTPUT_DIR${NC}"
echo -e "\n${YELLOW}Generated files:${NC}"
echo -e "  ${GREEN}✓${NC} icon-128.png (Store icon)"
echo -e "  ${GREEN}✓${NC} small-promo-440x280.png (Small promo tile)"
echo -e "  ${GREEN}✓${NC} marquee-promo-1400x560.png (Marquee promo tile)"
echo -e "  ${GREEN}✓${NC} screenshot-1-1280x800.png (Main interface)"
echo -e "  ${GREEN}✓${NC} screenshot-2-1280x800.png (Features)"
echo -e "  ${GREEN}✓${NC} screenshot-3-1280x800.png (Use cases)"
echo -e "  ${GREEN}✓${NC} screenshot-4-1280x800.png (Integration)"
echo -e "  ${GREEN}✓${NC} screenshot-5-1280x800.png (Privacy)"
echo -e "  ${GREEN}✓${NC} screenshot-*-640x400.png (Alternative sizes)"
echo -e "\n${BLUE}📋 Next steps:${NC}"
echo -e "  1. Review the generated assets in: ${YELLOW}$OUTPUT_DIR${NC}"
echo -e "  2. Upload to Chrome Web Store"
echo -e "  3. Customize text/colors if needed"
echo -e "\n${GREEN}🚀 Ready to publish!${NC}"

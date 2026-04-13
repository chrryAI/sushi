# 🎨 Chrome Web Store Asset Generator

Automatically generate all required Chrome Web Store assets from your app icons.

## Prerequisites

Install ImageMagick:

```bash
brew install imagemagick
```

## Usage

```bash
./scripts/generate-store-assets.sh <app-name>
```

## Examples

### Generate assets for Atlas:

```bash
./scripts/generate-store-assets.sh atlas
```

### Generate assets for Focus:

```bash
./scripts/generate-store-assets.sh focus
```

### Generate assets for Istanbul:

```bash
./scripts/generate-store-assets.sh istanbul
```

## Generated Assets

The script generates all required Chrome Web Store assets:

### 1. Store Icon

- **Size:** 128x128 pixels
- **Format:** PNG
- **File:** `icon-128.png`

### 2. Small Promo Tile

- **Size:** 440x280 pixels
- **Format:** PNG (24-bit, no alpha)
- **File:** `small-promo-440x280.png`

### 3. Marquee Promo Tile

- **Size:** 1400x560 pixels
- **Format:** PNG (24-bit, no alpha)
- **File:** `marquee-promo-1400x560.png`

### 4. Screenshots (5 required)

- **Size:** 1280x800 pixels (primary)
- **Alternative:** 640x400 pixels
- **Format:** PNG (24-bit, no alpha)
- **Files:**
  - `screenshot-1-1280x800.png` - Main interface
  - `screenshot-2-1280x800.png` - Features
  - `screenshot-3-1280x800.png` - Use cases
  - `screenshot-4-1280x800.png` - Integration
  - `screenshot-5-1280x800.png` - Privacy
  - `screenshot-*-640x400.png` - Alternative sizes

## Output Location

All assets are generated in:

```
apps/extension/store-assets/<app-name>/
```

Example:

```
apps/extension/store-assets/atlas/
├── icon-128.png
├── small-promo-440x280.png
├── marquee-promo-1400x560.png
├── screenshot-1-1280x800.png
├── screenshot-2-1280x800.png
├── screenshot-3-1280x800.png
├── screenshot-4-1280x800.png
├── screenshot-5-1280x800.png
├── screenshot-1-640x400.png
├── screenshot-2-640x400.png
├── screenshot-3-640x400.png
├── screenshot-4-640x400.png
└── screenshot-5-640x400.png
```

## Customization

### Change Colors

Edit the gradient in the script:

```bash
# Current gradient
-background "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"

# Change to your brand colors
-background "linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%)"
```

### Change Text

Edit the annotations in the script:

```bash
# Example: Change subtitle
-annotate +0+280 "AI-Powered Assistant"
# Change to:
-annotate +0+280 "Your Custom Subtitle"
```

### Change Font

Edit the font in the script:

```bash
# Current font
-font "Helvetica-Bold"

# Change to:
-font "Arial-Bold"
-font "Times-Bold"
-font "Courier-Bold"
```

## Chrome Web Store Requirements

### Store Icon

- ✅ 128x128 pixels
- ✅ PNG format
- ✅ Follows image guidelines

### Promo Tiles

- ✅ Small: 440x280 pixels
- ✅ Marquee: 1400x560 pixels
- ✅ JPEG or 24-bit PNG (no alpha)

### Screenshots

- ✅ 1280x800 or 640x400 pixels
- ✅ JPEG or 24-bit PNG (no alpha)
- ✅ Minimum 1, maximum 5
- ✅ All 5 generated automatically

## Workflow

### 1. Generate Assets

```bash
./scripts/generate-store-assets.sh atlas
```

### 2. Review Assets

```bash
open apps/extension/store-assets/atlas/
```

### 3. Customize (Optional)

Edit the script to change colors, text, or layout.

### 4. Upload to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select your extension
3. Go to "Store listing"
4. Upload generated assets:
   - Store icon: `icon-128.png`
   - Small promo tile: `small-promo-440x280.png`
   - Marquee promo tile: `marquee-promo-1400x560.png`
   - Screenshots: `screenshot-*-1280x800.png` (all 5)

### 5. Publish

Click "Submit for review"

## Batch Generation

Generate assets for all apps:

```bash
for app in atlas focus istanbul amsterdam tokyo newyork; do
  ./scripts/generate-store-assets.sh $app
done
```

## Tips

### High-Quality Source Icons

- Use high-resolution source icons (512x512 or larger)
- PNG format with transparency
- Clean, simple designs work best

### Brand Consistency

- Use your brand colors in gradients
- Keep text minimal and readable
- Maintain consistent style across all apps

### Screenshot Content

- Show actual app interface when possible
- Highlight key features
- Use clear, readable text
- Avoid clutter

### Testing

- View assets at actual size before uploading
- Test on different backgrounds
- Ensure text is readable

## Troubleshooting

### ImageMagick not found

```bash
# Install ImageMagick
brew install imagemagick

# Verify installation
convert --version
```

### Source icon not found

```bash
# Check if icon exists
ls apps/web/public/images/apps/atlas.png

# If not, create it first
```

### Gradient not working

```bash
# ImageMagick version issue
# Use solid color instead:
-background "#667eea"
```

### Text not rendering

```bash
# Check available fonts
convert -list font

# Use a different font
-font "Arial-Bold"
```

## Advanced Usage

### Custom Gradient

```bash
# Horizontal gradient
-background "gradient:#667eea-#764ba2"

# Vertical gradient
-background "gradient:#667eea-#764ba2" -rotate 90

# Radial gradient
-background "radial-gradient:#667eea-#764ba2"
```

### Custom Layout

```bash
# Add logo in corner
convert base.png \
  logo.png -resize 100x100 \
  -gravity northwest \
  -geometry +20+20 \
  -composite \
  output.png
```

### Add Effects

```bash
# Add shadow
-shadow 80x3+5+5

# Add border
-border 2x2 -bordercolor white

# Add rounded corners
-alpha set -virtual-pixel transparent \
-channel A -blur 0x8 -level 50%,100% +channel
```

## Examples

### Minimal Style

```bash
# Clean, simple design
convert -size 1280x800 xc:white \
  icon.png -resize 400x400 \
  -gravity center \
  -composite \
  screenshot.png
```

### Bold Style

```bash
# High contrast, bold colors
convert -size 1280x800 xc:black \
  icon.png -resize 500x500 \
  -gravity center \
  -composite \
  -font "Helvetica-Bold" \
  -pointsize 100 \
  -fill white \
  -gravity south \
  -annotate +0+100 "ATLAS" \
  screenshot.png
```

### Gradient Style

```bash
# Modern gradient background
convert -size 1280x800 \
  -background "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" \
  xc: \
  icon.png -resize 400x400 \
  -gravity center \
  -composite \
  screenshot.png
```

## Resources

- [Chrome Web Store Image Guidelines](https://developer.chrome.com/docs/webstore/images/)
- [ImageMagick Documentation](https://imagemagick.org/index.php)
- [Gradient Generator](https://cssgradient.io/)
- [Color Palette Generator](https://coolors.co/)

---

**Built with ❤️ for the Chrry platform**

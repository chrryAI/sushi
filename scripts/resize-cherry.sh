#!/bin/bash

# Resize Cherry.png to all required sizes
SOURCE="apps/web/public/logo/Cherry.png"
OUTPUT_DIR="apps/web/public/logo"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Square sizes
magick "$SOURCE" -resize 32x32 "$OUTPUT_DIR/cherry-32-32.png"
magick "$SOURCE" -resize 180x180 "$OUTPUT_DIR/cherry-180-180.png"
magick "$SOURCE" -resize 192x192 "$OUTPUT_DIR/cherry-192-192.png"
magick "$SOURCE" -resize 512x512 "$OUTPUT_DIR/cherry-512-512.png"
magick "$SOURCE" -resize 800x800 "$OUTPUT_DIR/cherry-800-800.png"

# Rectangular sizes (will maintain aspect ratio and fit within dimensions)
magick "$SOURCE" -resize 440x280 "$OUTPUT_DIR/cherry-440-280.png"
magick "$SOURCE" -resize 1200x630 "$OUTPUT_DIR/cherry-1200-630.png"
magick "$SOURCE" -resize 1280x800 "$OUTPUT_DIR/cherry-1280-800.png"
magick "$SOURCE" -resize 1400x560 "$OUTPUT_DIR/cherry-1400-560.png"

echo "✅ All cherry logos resized successfully!"

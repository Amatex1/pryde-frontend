# Midnight Sanctuary Background Image

## Required Image: `midnight-sanctuary.webp`

### Image Specifications:
- **Format:** WebP (optimized)
- **File Size:** Under 400KB
- **Dimensions:** Recommended 1920x1080 or higher
- **Processing:**
  - Slightly darkened (brightness: 0.75)
  - Slightly desaturated (saturation: 0.85)
  - Optional: 2-3px blur for softer atmospheric feel

### Image Theme:
- Cooler indigo/purple atmospheric tones
- Sanctuary/peaceful aesthetic
- Muted, darkened colors
- Low contrast for background use

### Usage:
This image is used as a fixed parallax background for the homepage on desktop (>=900px) when the Midnight Prism theme is active.

The image is displayed with:
- `opacity: 0.22`
- `filter: saturate(0.85) brightness(0.75)`
- Fixed positioning for parallax effect
- Overlaid with readability layer: `rgba(8, 12, 30, 0.55)`

### How to Add:
1. Prepare your image according to specifications above
2. Convert to WebP format
3. Optimize/compress to under 400KB
4. Save as `midnight-sanctuary.webp` in this directory
5. The homepage will automatically use it when Midnight Prism theme is active

### Fallback:
If the image is not present, the homepage will gracefully fall back to the gradient background without the atmospheric image layer.


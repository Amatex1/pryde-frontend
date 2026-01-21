# PWA Icon Guidelines - Full-Bleed Design

## Problem: Blue Border on iOS/Android

When PWA icons have **transparency** or don't fill the entire canvas, operating systems inject a colored backing plate (often blue or white), making the icon look unprofessional.

## Solution: Full-Bleed Icon Design

### Design Requirements

1. **NO Transparency**
   - Use a solid background color (#6C5CE7 - Pryde Purple)
   - Fill the entire canvas edge-to-edge

2. **Rounded Shape Inside Safe Area**
   - Keep the logo/content inset by ~14% from edges
   - This prevents clipping on devices with rounded icon masks
   - The OS will apply its own rounding

3. **Background Color Consistency**
   - Icon background: `#6C5CE7` (Pryde Purple)
   - manifest.json `background_color`: `#6C5CE7`
   - manifest.json `theme_color`: `#6C5CE7`

### Icon Specifications

#### Required Sizes
- **192x192** - Standard PWA icon
- **512x512** - High-res PWA icon
- **192x192-maskable** - Adaptive icon with safe area
- **512x512-maskable** - High-res adaptive icon

#### Design Template (512x512 example)

```
┌─────────────────────────────────────┐
│ #6C5CE7 Background (full canvas)    │
│  ┌───────────────────────────────┐  │
│  │                               │  │ ← 14% safe area
│  │     Pryde Logo (centered)     │  │
│  │     White or light color      │  │
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Maskable Icons

Maskable icons need **20% safe area** (not 14%) to account for various device masks:

- Circle masks (most Android devices)
- Rounded square masks (iOS)
- Squircle masks (some Android skins)

### Color Palette

**Primary Background:** `#6C5CE7` (Pryde Purple)
**Logo/Icon Color:** `#FFFFFF` (White) or `#F7F7F7` (Light Gray)
**Accent (optional):** `#0984E3` (Electric Blue)

### Testing Checklist

- [ ] Icon has NO transparent pixels
- [ ] Background color is #6C5CE7
- [ ] Logo is centered and inset 14% from edges
- [ ] Maskable icons have 20% safe area
- [ ] manifest.json background_color matches icon background
- [ ] Test on iOS (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test in PWA installed mode

### Current Status

✅ **manifest.json updated** - background_color set to #6C5CE7
⚠️ **Icons need regeneration** - Current icons may have transparency

### Next Steps

1. **Regenerate icons** using the design template above
2. **Replace files** in `public/icons/` directory
3. **Test installation** on iOS and Android devices
4. **Verify** no blue/white backing plate appears

### Tools for Icon Generation

**Recommended:**
- Figma/Sketch - Design the icon
- ImageMagick - Batch convert to PNG
- PWA Asset Generator - Automated icon generation

**Script Example (ImageMagick):**
```bash
# Create 512x512 icon with purple background
convert -size 512x512 xc:"#6C5CE7" \
  logo-white.png -gravity center -composite \
  icon-512x512.png

# Create 192x192 icon
convert icon-512x512.png -resize 192x192 icon-192x192.png
```

### References

- [PWA Icon Best Practices](https://web.dev/maskable-icon/)
- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)

---

**Last Updated:** 2025-12-25
**Status:** Manifest updated, icons pending regeneration


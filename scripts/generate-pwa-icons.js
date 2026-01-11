/**
 * Generate PWA icons from the original high-quality logo
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

// Source: the original high-quality logo
const sourceLogo = path.join(publicDir, 'pryde-logo-original.png');

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('🎨 Generating PWA icons from original logo...\n');
  console.log(`Source: ${sourceLogo}\n`);

  for (const size of sizes) {
    // Regular icon
    const regularPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(sourceLogo)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(regularPath);
    console.log(`✅ Generated: icon-${size}x${size}.png`);

    // Maskable icons (192 and 512 only) - with purple background and padding
    if (size === 192 || size === 512) {
      const maskablePath = path.join(iconsDir, `icon-${size}x${size}-maskable.png`);
      
      // Maskable icons need 20% safe area, so scale logo to 80% and center on purple background
      const logoSize = Math.floor(size * 0.6); // Logo takes 60% of space
      const padding = Math.floor((size - logoSize) / 2);
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 108, g: 92, b: 231, alpha: 1 } // #6C5CE7 purple
        }
      })
        .composite([{
          input: await sharp(sourceLogo)
            .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer(),
          left: padding,
          top: padding
        }])
        .png({ quality: 100 })
        .toFile(maskablePath);
      console.log(`✅ Generated: icon-${size}x${size}-maskable.png`);
    }
  }

  // Also update the root icons
  console.log('\n📱 Updating root PWA icons...');
  
  await sharp(sourceLogo)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✅ Generated: icon-192.png');

  await sharp(sourceLogo)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✅ Generated: icon-512.png');

  await sharp(sourceLogo)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ Generated: apple-touch-icon.png');

  await sharp(sourceLogo)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✅ Generated: favicon.png');

  console.log('\n🎉 All PWA icons generated successfully!');
}

generateIcons().catch(console.error);


/**
 * Client-side image compression utility
 * Compresses images before upload to reduce file size and improve reliability
 * 
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 2048)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 2048)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @param {string} options.mimeType - Output MIME type (default: 'image/jpeg')
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(
  file,
  {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = {}
) {
  // Skip non-images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip GIFs to preserve animation
  if (file.type === 'image/gif') {
    return file;
  }

  try {
    // Create image bitmap from file
    const imageBitmap = await createImageBitmap(file);

    let { width, height } = imageBitmap;

    // Calculate new dimensions while maintaining aspect ratio
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(
        maxWidth / width,
        maxHeight / height
      );
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Convert canvas to blob
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );

    // Create new file from blob
    const compressedFile = new File(
      [blob], 
      file.name.replace(/\.\w+$/, '.jpg'), 
      {
        type: mimeType,
        lastModified: Date.now()
      }
    );

    // Log compression results
    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
    const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    
    console.log(`📦 Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${savings}% reduction)`);

    return compressedFile;
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Compress image with avatar-specific settings
 * Smaller dimensions and higher quality for profile photos
 */
export async function compressAvatar(file) {
  return compressImage(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
    mimeType: 'image/jpeg'
  });
}

/**
 * Compress image with cover photo settings
 * Wider dimensions for cover photos
 */
export async function compressCoverPhoto(file) {
  return compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    mimeType: 'image/jpeg'
  });
}

/**
 * Compress image with post media settings
 * Standard settings for post images
 */
export async function compressPostMedia(file) {
  return compressImage(file, {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.8,
    mimeType: 'image/jpeg'
  });
}

export default {
  compressImage,
  compressAvatar,
  compressCoverPhoto,
  compressPostMedia
};


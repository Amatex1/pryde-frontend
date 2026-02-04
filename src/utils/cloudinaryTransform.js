/**
 * Cloudinary transformation utilities for Pryde
 * Provides optional server-side image transformations using stored metadata
 * Non-destructive and reversible - falls back to CSS transforms if not available
 */

/**
 * Check if an image URL is from Cloudinary
 * @param {string} url - Image URL to check
 * @returns {boolean} - True if Cloudinary URL
 */
export const isCloudinaryUrl = (url) => {
  return url && url.includes('cloudinary.com');
};

/**
 * Generate Cloudinary transformation URL for avatar using stored metadata
 * @param {string} baseUrl - Original Cloudinary image URL
 * @param {Object} metadata - Transform metadata { x, y, scale }
 * @param {number} targetWidth - Target display width (optional)
 * @param {number} targetHeight - Target display height (optional)
 * @returns {string} - Transformed Cloudinary URL or original URL if invalid
 */
export const generateCloudinaryAvatarUrl = (baseUrl, metadata, targetWidth = 400, targetHeight = 400) => {
  if (!isCloudinaryUrl(baseUrl) || !metadata) {
    return baseUrl;
  }

  try {
    // Extract Cloudinary public ID from URL
    const urlParts = baseUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return baseUrl;

    // Build transformation parameters
    const transforms = [];

    // Face detection and cropping
    transforms.push('c_fill');
    transforms.push('g_face');

    // Apply stored zoom/scale (convert to zoom factor)
    if (metadata.scale && metadata.scale !== 1) {
      const zoomValue = Math.max(1, Math.min(3, metadata.scale));
      transforms.push(`z_${zoomValue}`);
    }

    // Apply stored position offsets (convert to pixels)
    if (metadata.x || metadata.y) {
      const xOffset = Math.round(metadata.x || 0);
      const yOffset = Math.round(metadata.y || 0);
      transforms.push(`x_${xOffset}`);
      transforms.push(`y_${yOffset}`);
    }

    // Target dimensions
    transforms.push(`w_${targetWidth}`);
    transforms.push(`h_${targetHeight}`);

    // Quality and format optimization
    transforms.push('f_auto');
    transforms.push('q_auto');

    // Insert transforms into URL
    const transformString = transforms.join(',');
    urlParts.splice(uploadIndex + 1, 0, transformString);

    return urlParts.join('/');
  } catch (error) {
    console.warn('Failed to generate Cloudinary avatar URL:', error);
    return baseUrl;
  }
};

/**
 * Generate Cloudinary transformation URL for cover photo using stored metadata
 * @param {string} baseUrl - Original Cloudinary image URL
 * @param {Object} metadata - Transform metadata { x, y, scale }
 * @param {number} targetWidth - Target display width (optional)
 * @param {number} targetHeight - Target display height (optional)
 * @returns {string} - Transformed Cloudinary URL or original URL if invalid
 */
export const generateCloudinaryCoverUrl = (baseUrl, metadata, targetWidth = 1200, targetHeight = 400) => {
  if (!isCloudinaryUrl(baseUrl) || !metadata) {
    return baseUrl;
  }

  try {
    // Extract Cloudinary public ID from URL
    const urlParts = baseUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return baseUrl;

    // Build transformation parameters
    const transforms = [];

    // Cover photo cropping (fill to maintain aspect ratio)
    transforms.push('c_fill');

    // Apply stored zoom/scale
    if (metadata.scale && metadata.scale !== 1) {
      const zoomValue = Math.max(1, Math.min(3, metadata.scale));
      transforms.push(`z_${zoomValue}`);
    }

    // Apply stored position offsets
    if (metadata.x || metadata.y) {
      const xOffset = Math.round(metadata.x || 0);
      const yOffset = Math.round(metadata.y || 0);
      transforms.push(`x_${xOffset}`);
      transforms.push(`y_${yOffset}`);
    }

    // Target dimensions
    transforms.push(`w_${targetWidth}`);
    transforms.push(`h_${targetHeight}`);

    // Quality and format optimization
    transforms.push('f_auto');
    transforms.push('q_auto');

    // Insert transforms into URL
    const transformString = transforms.join(',');
    urlParts.splice(uploadIndex + 1, 0, transformString);

    return urlParts.join('/');
  } catch (error) {
    console.warn('Failed to generate Cloudinary cover URL:', error);
    return baseUrl;
  }
};

/**
 * Get optimized image URL with Cloudinary transforms if available
 * Falls back to original URL with CSS transforms if not Cloudinary
 * @param {string} baseUrl - Original image URL
 * @param {Object} metadata - Transform metadata { x, y, scale }
 * @param {string} type - 'avatar' or 'cover'
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {Object} - { url, needsCssTransform: boolean, transform: string }
 */
export const getOptimizedImageUrl = (baseUrl, metadata, type = 'avatar', width, height) => {
  if (!baseUrl) return { url: '', needsCssTransform: false, transform: '' };

  const isCloudinary = isCloudinaryUrl(baseUrl);

  if (isCloudinary && metadata) {
    // Use Cloudinary server-side transforms
    const transformedUrl = type === 'avatar'
      ? generateCloudinaryAvatarUrl(baseUrl, metadata, width, height)
      : generateCloudinaryCoverUrl(baseUrl, metadata, width, height);

    return {
      url: transformedUrl,
      needsCssTransform: false,
      transform: ''
    };
  } else {
    // Fall back to CSS transforms
    const transform = metadata ? generateCssTransform(metadata) : '';
    return {
      url: baseUrl,
      needsCssTransform: !!transform,
      transform
    };
  }
};

/**
 * Generate CSS transform string from metadata
 * @param {Object} metadata - Transform metadata { x, y, scale }
 * @returns {string} - CSS transform string
 */
export const generateCssTransform = (metadata) => {
  if (!metadata) return '';

  const transforms = [];

  // Apply scale
  if (metadata.scale && metadata.scale !== 1) {
    transforms.push(`scale(${metadata.scale})`);
  }

  // Apply translation
  if (metadata.x || metadata.y) {
    transforms.push(`translate(${metadata.x || 0}px, ${metadata.y || 0}px)`);
  }

  return transforms.length > 0 ? transforms.join(' ') : '';
};

/**
 * Apply CSS transform to an image element
 * @param {HTMLElement} imgElement - Image DOM element
 * @param {Object} metadata - Transform metadata { x, y, scale }
 */
export const applyImageTransform = (imgElement, metadata) => {
  if (!imgElement || !metadata) return;

  const transform = generateCssTransform(metadata);
  imgElement.style.transform = transform;
  imgElement.style.transformOrigin = 'center center';
  imgElement.style.transition = 'transform 0.3s ease';
};

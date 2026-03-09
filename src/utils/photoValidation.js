export const PHOTO_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const PHOTO_UPLOAD_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

export const PHOTO_UPLOAD_HELP_TEXT = 'JPG, PNG, GIF, or WebP · up to 10MB';

export function validatePhotoFile(file) {
  if (!file) {
    return 'Please choose an image to continue.';
  }

  if (!PHOTO_UPLOAD_ALLOWED_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG, GIF, or WebP image.';
  }

  if (file.size > PHOTO_UPLOAD_MAX_SIZE_BYTES) {
    return 'Image exceeds the 10MB limit. Please choose a smaller file.';
  }

  return '';
}
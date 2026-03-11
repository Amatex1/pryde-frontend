import { afterEach, describe, expect, it, vi } from 'vitest';

const loadImageUrlModule = async (env = {}) => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_UPLOADS_URL', 'https://uploads.example.com');
  vi.stubEnv('VITE_CDN_URL', '');

  Object.entries(env).forEach(([key, value]) => {
    vi.stubEnv(key, value);
  });

  return import('../imageUrl.js');
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('getImageUrl', () => {
  it('preserves absolute and special-purpose URLs', async () => {
    const { getImageUrl } = await loadImageUrlModule();

    expect(getImageUrl('https://media.example.com/photo.jpg')).toBe('https://media.example.com/photo.jpg');
    expect(getImageUrl('blob:preview-1')).toBe('blob:preview-1');
    expect(getImageUrl('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123');
    expect(getImageUrl('//media.example.com/photo.jpg')).toBe('//media.example.com/photo.jpg');
  });

  it('routes relative media paths through the backend API when no CDN is configured', async () => {
    const { getImageUrl } = await loadImageUrlModule();

    expect(getImageUrl('/upload/image/my photo.png')).toBe('https://uploads.example.com/api/upload/image/my%20photo.png');
  });

  it('routes relative media paths through the configured CDN', async () => {
    const { getImageUrl } = await loadImageUrlModule({
      VITE_CDN_URL: 'https://media.example.com/'
    });

    expect(getImageUrl('/upload/image/my photo.png')).toBe('https://media.example.com/upload/image/my%20photo.png');
  });

  it('keeps existing backend API media paths on the backend even when a CDN is configured', async () => {
    const { getImageUrl } = await loadImageUrlModule({
      VITE_CDN_URL: 'https://media.example.com/'
    });

    expect(getImageUrl('/api/upload/image/my photo.png')).toBe('https://uploads.example.com/api/upload/image/my%20photo.png');
    expect(getImageUrl('api/upload/image/my photo.png')).toBe('https://uploads.example.com/api/upload/image/my%20photo.png');
  });
});
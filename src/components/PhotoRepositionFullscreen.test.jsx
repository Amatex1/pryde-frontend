import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhotoRepositionInline from './PhotoRepositionFullscreen';

vi.mock('./PhotoRepositionFullscreen.css', () => ({}));

vi.mock('react-easy-crop', () => ({
  default: ({ image, zoom, crop, onCropComplete }) => (
    <>
      <div data-testid="mock-cropper" data-image={image} data-zoom={zoom} data-crop-x={crop?.x} data-crop-y={crop?.y} />
      <button
        type="button"
        onClick={() => onCropComplete?.({ x: 10, y: 20, width: 40, height: 60 })}
      >
        Trigger crop complete
      </button>
    </>
  )
}));

describe('PhotoRepositionInline', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    let previewCount = 0;
    URL.createObjectURL = vi.fn(() => `blob:preview-${++previewCount}`);
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('shows an inline error when a non-image file is selected', async () => {
    const { container } = render(
      <PhotoRepositionInline type="avatar" imageUrl="https://example.com/photo.jpg" onSave={vi.fn()} onCancel={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]');
    const invalidFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Please choose a JPG, PNG, GIF, or WebP image.');
  });

  it('updates the zoom percentage when the slider changes', () => {
    render(
      <PhotoRepositionInline type="cover" imageUrl="https://example.com/cover.jpg" onSave={vi.fn()} onCancel={vi.fn()} />
    );

    fireEvent.change(screen.getByRole('slider', { name: /zoom level/i }), { target: { value: '2' } });

    expect(screen.getByTestId('mock-cropper')).toHaveAttribute('data-zoom', '2');
  });

  it('uses the new upload preview immediately after selecting a valid image', () => {
    const { container } = render(
      <PhotoRepositionInline type="avatar" imageUrl="https://example.com/photo.jpg" onSave={vi.fn()} onCancel={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]');
    const nextImage = new File(['image'], 'next-photo.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [nextImage] } });

    expect(screen.getByTestId('mock-cropper')).toHaveAttribute('data-image', 'blob:preview-1');
  });

  it('restores the saved crop and zoom values from initialPosition', () => {
    render(
      <PhotoRepositionInline
        type="avatar"
        imageUrl="https://example.com/photo.jpg"
        initialPosition={{ x: 12, y: -8, scale: 1.6 }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByTestId('mock-cropper')).toHaveAttribute('data-crop-x', '12');
    expect(screen.getByTestId('mock-cropper')).toHaveAttribute('data-crop-y', '-8');
    expect(screen.getByTestId('mock-cropper')).toHaveAttribute('data-zoom', '1.6');
  });

  it('shows save errors inline and re-enables the button', async () => {
    const onSave = vi.fn().mockRejectedValue({
      response: { data: { message: 'Profile photo upload failed. Please try again or use a smaller image.' } }
    });

    const { container } = render(
      <PhotoRepositionInline type="avatar" imageUrl="https://example.com/photo.jpg" onSave={onSave} onCancel={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]');
    const nextImage = new File(['image'], 'next-photo.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [nextImage] } });
    fireEvent.click(screen.getByRole('button', { name: /trigger crop complete/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Profile photo upload failed. Please try again or use a smaller image.');
    });

    expect(onSave).toHaveBeenCalledWith({
      photo: expect.objectContaining({ name: 'next-photo.png' }),
      type: 'avatar',
      position: {
        x: 0,
        y: 0,
        scale: 1,
        bgX: 30,
        bgY: 50
      }
    });
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });
});
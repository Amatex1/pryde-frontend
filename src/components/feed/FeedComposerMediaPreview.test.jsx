import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedComposerMediaPreview from './FeedComposerMediaPreview';

describe('FeedComposerMediaPreview', () => {
  it('returns nothing when there is no media', () => {
    const { container } = render(
      <FeedComposerMediaPreview selectedMedia={[]} onRemoveMedia={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders media and wires remove actions', () => {
    const onRemoveMedia = vi.fn();

    render(
      <FeedComposerMediaPreview
        selectedMedia={[
          { type: 'image', url: '/image.jpg' },
          { type: 'video', url: '/video.mp4' },
        ]}
        onRemoveMedia={onRemoveMedia}
      />
    );

    expect(screen.getByAltText('Upload 1')).toBeInTheDocument();
    expect(document.querySelector('video')).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: /remove media/i })[1]);
    expect(onRemoveMedia).toHaveBeenCalledWith(1);
  });
});
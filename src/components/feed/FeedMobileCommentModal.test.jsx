import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedMobileCommentModal from './FeedMobileCommentModal';

vi.mock('../GifPicker', () => ({
  default: ({ onClose }) => (
    <button type="button" onClick={onClose}>Close GIF Picker</button>
  ),
}));

describe('FeedMobileCommentModal', () => {
  it('returns nothing when closed', () => {
    const { container } = render(
      <FeedMobileCommentModal isOpen={false} onClose={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('wires change and submit actions', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());

    render(
      <FeedMobileCommentModal
        isOpen
        postId="post-1"
        currentUser={{ displayName: 'Alice' }}
        value="hello"
        selectedGif={null}
        isGifPickerOpen={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        onChange={onChange}
        onKeyDown={vi.fn()}
        onGifSelect={vi.fn()}
        onGifPickerClose={vi.fn()}
        onGifToggle={vi.fn()}
        onGifClear={vi.fn()}
      />
    );

    fireEvent.change(screen.getByRole('textbox', { hidden: true }), { target: { value: 'updated' } });
    expect(onChange).toHaveBeenCalledWith('updated');

    fireEvent.click(screen.getByRole('button', { name: /reply/i, hidden: true }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('closes the gif picker without closing the modal', () => {
    const onClose = vi.fn();
    const onGifPickerClose = vi.fn();

    render(
      <FeedMobileCommentModal
        isOpen
        postId="post-1"
        currentUser={{ displayName: 'Alice' }}
        value=""
        selectedGif={null}
        isGifPickerOpen={true}
        onClose={onClose}
        onSubmit={vi.fn((e) => e.preventDefault())}
        onChange={vi.fn()}
        onKeyDown={vi.fn()}
        onGifSelect={vi.fn()}
        onGifPickerClose={onGifPickerClose}
        onGifToggle={vi.fn()}
        onGifClear={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /close gif picker/i, hidden: true }));
    expect(onGifPickerClose).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
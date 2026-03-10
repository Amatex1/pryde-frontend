import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedComposerDesktopActions from './FeedComposerDesktopActions';

vi.mock('../GifPicker', () => ({
  default: ({ onGifSelect, onClose }) => (
    <div>
      <button type="button" onClick={() => onGifSelect('https://gif.example/test.gif')}>
        Pick GIF
      </button>
      <button type="button" onClick={onClose}>
        Close GIF Picker
      </button>
    </div>
  ),
}));

function renderDesktopActions(props = {}) {
  const defaultProps = {
    isQuietMode: false,
    showAdvancedOptions: true,
    uploadingMedia: false,
    uploadProgress: 0,
    selectedMedia: [],
    showPollCreator: false,
    showContentWarning: false,
    hideMetrics: false,
    isAnonymous: false,
    draftSaveStatus: '',
    showGifPicker: null,
    selectedPostGif: null,
    loading: false,
    postVisibility: 'public',
    onMediaSelect: vi.fn(),
    onSetShowAdvancedOptions: vi.fn(),
    onSetShowPollCreator: vi.fn(),
    onSetShowContentWarning: vi.fn(),
    onSetHideMetrics: vi.fn(),
    onSetIsAnonymous: vi.fn(),
    onSetPostVisibility: vi.fn(),
    onSetShowDraftManager: vi.fn(),
    onSetShowGifPicker: vi.fn(),
    onSetSelectedPostGif: vi.fn(),
    ...props,
  };

  return {
    ...render(<FeedComposerDesktopActions {...defaultProps} />),
    props: defaultProps,
  };
}

describe('FeedComposerDesktopActions', () => {
  it('shows the quiet-mode more options button and wires it', () => {
    const { props } = renderDesktopActions({
      isQuietMode: true,
      showAdvancedOptions: false,
    });

    fireEvent.click(screen.getByRole('button', { name: /more posting options/i }));
    expect(props.onSetShowAdvancedOptions).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('button', { name: /add poll/i })).not.toBeInTheDocument();
  });

  it('wires advanced controls, privacy, and gif actions', () => {
    const { props } = renderDesktopActions({
      isAnonymous: true,
      draftSaveStatus: 'saved',
      showGifPicker: 'main-post',
      selectedPostGif: 'https://gif.example/selected.gif',
      postVisibility: 'followers',
    });

    fireEvent.click(screen.getByRole('button', { name: /add poll/i }));
    expect(props.onSetShowPollCreator).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: /add content warning/i }));
    expect(props.onSetShowContentWarning).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: /view saved drafts/i }));
    expect(props.onSetShowDraftManager).toHaveBeenCalledWith(true);

    fireEvent.change(screen.getByLabelText(/select post privacy/i), {
      target: { value: 'private' },
    });
    expect(props.onSetPostVisibility).toHaveBeenCalledWith('private');

    fireEvent.click(screen.getByRole('button', { name: /pick gif/i }));
    expect(props.onSetSelectedPostGif).toHaveBeenCalledWith('https://gif.example/test.gif');
    expect(props.onSetShowGifPicker).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole('button', { name: /remove gif/i }));
    expect(props.onSetSelectedPostGif).toHaveBeenCalledWith(null);

    expect(screen.getByText(/draft saved/i)).toBeInTheDocument();
    expect(screen.getByText(/visible to moderators only/i)).toBeInTheDocument();
  });
});
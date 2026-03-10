import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedComposerContentWarning from './FeedComposerContentWarning';

describe('FeedComposerContentWarning', () => {
  it('returns nothing when hidden', () => {
    const { container } = render(
      <FeedComposerContentWarning
        isMobile={false}
        showContentWarning={false}
        contentWarning=""
        onSetContentWarning={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders custom warning input and wires updates', () => {
    const onSetContentWarning = vi.fn();

    render(
      <FeedComposerContentWarning
        isMobile={false}
        showContentWarning
        contentWarning="Custom topic"
        onSetContentWarning={onSetContentWarning}
      />
    );

    expect(screen.getByRole('combobox')).toHaveValue('Other');

    fireEvent.change(screen.getByPlaceholderText('Describe the content warning...'), {
      target: { value: 'Updated warning' },
    });

    expect(onSetContentWarning).toHaveBeenCalledWith('Updated warning');
  });
});
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedFilterTabs from './FeedFilterTabs';

describe('FeedFilterTabs', () => {
  it('marks the active filter as selected', () => {
    render(<FeedFilterTabs activeFilter="followers" onChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: /following/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /everyone/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with the clicked filter', () => {
    const onChange = vi.fn();

    render(<FeedFilterTabs activeFilter="followers" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /everyone/i }));

    expect(onChange).toHaveBeenCalledWith('public');
  });
});
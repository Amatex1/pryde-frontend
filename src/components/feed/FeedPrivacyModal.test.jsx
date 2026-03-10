import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedPrivacyModal from './FeedPrivacyModal';

describe('FeedPrivacyModal', () => {
  it('returns nothing when closed', () => {
    const { container } = render(
      <FeedPrivacyModal
        isOpen={false}
        friends={[]}
        hiddenFromUsers={[]}
        onHiddenUsersChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('updates hidden users and clears all selections', () => {
    const onHiddenUsersChange = vi.fn();
    const onClose = vi.fn();

    render(
      <FeedPrivacyModal
        isOpen
        friends={[
          { _id: '1', displayName: 'Alice' },
          { _id: '2', displayName: 'Bob' },
        ]}
        hiddenFromUsers={['1']}
        onHiddenUsersChange={onHiddenUsersChange}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByLabelText(/bob/i));
    expect(onHiddenUsersChange).toHaveBeenCalledWith(['1', '2']);

    fireEvent.click(screen.getByRole('button', { name: /clear all/i, hidden: true }));
    expect(onHiddenUsersChange).toHaveBeenCalledWith([]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { MessagesLoadingSkeleton } from './index';

describe('MessagesLoadingSkeleton', () => {
  it('renders a messages-shaped loading shell instead of plain text', () => {
    render(React.createElement(MessagesLoadingSkeleton));

    expect(screen.getByRole('status', { name: /loading messages/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/loading conversations/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loading current conversation/i)).toBeInTheDocument();

    const conversationList = screen.getByRole('list', { name: /conversation placeholders/i });
    const messageList = screen.getByRole('list', { name: /message placeholders/i });

    expect(within(conversationList).getAllByRole('listitem')).toHaveLength(7);
    expect(within(messageList).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryByText(/loading messages\.\.\./i)).not.toBeInTheDocument();
  });
});
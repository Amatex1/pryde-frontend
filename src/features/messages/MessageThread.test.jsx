import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import MessageThread from './MessageThread';

function renderThread(messageContent) {
  return render(
    <MessageThread
      messages={[
        {
          _id: 'message-1',
          content: messageContent,
          createdAt: '2024-01-01T12:00:00.000Z',
          sender: { _id: 'user-2', displayName: 'Taylor Sender' },
          reactions: []
        }
      ]}
      currentUser={{ _id: 'current-user' }}
      selectedUser={{ _id: 'user-2', displayName: 'Taylor Sender' }}
      selectedChatType="user"
      onlineUsers={[]}
      mutedConversations={[]}
      selectedChatId="chat-1"
      onBack={vi.fn()}
      onReply={vi.fn()}
      onReact={vi.fn()}
      onEdit={vi.fn()}
      onSaveEdit={vi.fn()}
      onCancelEdit={vi.fn()}
      onDelete={vi.fn()}
      onRemoveReaction={vi.fn()}
      onEditTextChange={vi.fn()}
      onToggleMute={vi.fn()}
    />
  );
}

describe('MessageThread', () => {
  it('renders message content as sanitized plain text instead of injected HTML', () => {
    const { container } = renderThread('Hello <strong>world</strong>');

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(container.querySelector('strong')).toBeNull();
  });
});
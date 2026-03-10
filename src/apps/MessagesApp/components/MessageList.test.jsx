import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import MessageList from './MessageList';

function renderMessageList(props = {}) {
  const message = {
    _id: 'message-1',
    content: 'Hello from the thread',
    createdAt: '2024-01-01T12:00:00.000Z',
    sender: { _id: 'user-2' },
    reactions: [],
  };

  const defaultProps = {
    selectedChat: 'chat-1',
    selectedChatType: 'user',
    messages: [message],
    groupMessagesBySender: [{
      senderId: 'user-2',
      isCurrentUser: false,
      senderInfo: { _id: 'user-2', displayName: 'Taylor Sender' },
      messages: [message],
      showDateHeader: false,
    }],
    loadingMessages: false,
    isTyping: false,
    selectedUser: { _id: 'user-2', displayName: 'Taylor Sender' },
    isSelfChat: false,
    currentUser: { _id: 'current-user' },
    currentTheme: 'light',
    chatContainerRef: { current: null },
    onScroll: vi.fn(),
    showNewMessageIndicator: false,
    onDismissIndicator: vi.fn(),
    lastReadMessageId: null,
    onUpdateLastRead: vi.fn(),
    editingMessageId: null,
    editMessageText: '',
    onEditMessageTextChange: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    openMessageMenu: null,
    setOpenMessageMenu: vi.fn(),
    onReply: vi.fn(),
    onReact: vi.fn(),
    onRemoveReaction: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...props,
  };

  return render(<MessageList {...defaultProps} />);
}

describe('MessageList', () => {
  it('hides repeated sender headers in direct conversations', () => {
    renderMessageList();

    expect(screen.queryByText('Taylor Sender')).not.toBeInTheDocument();
    expect(screen.getByText('Hello from the thread')).toBeInTheDocument();
  });

  it('shows sender headers for received clusters in group conversations', () => {
    renderMessageList({ selectedChatType: 'group' });

    expect(screen.getByText('Taylor Sender')).toBeInTheDocument();
    expect(screen.getByText('Hello from the thread')).toBeInTheDocument();
  });
});
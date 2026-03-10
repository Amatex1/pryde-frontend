import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('./SharedMedia', () => ({
  default: ({ userId }) => <div>Shared media for {userId}</div>,
}));

import InfoPanel from './InfoPanel';

function renderInfoPanel(props = {}) {
  const defaultProps = {
    selectedChat: null,
    selectedUser: null,
    selectedGroup: null,
    selectedChatType: 'user',
    onlineUsers: [],
    currentUserId: 'current-user',
    onBlockUser: vi.fn(),
    onReportUser: vi.fn(),
    isOpen: false,
    onClose: vi.fn(),
    ...props,
  };

  return render(<InfoPanel {...defaultProps} />);
}

describe('InfoPanel', () => {
  it('shows the empty state when no conversation is selected', () => {
    renderInfoPanel();

    expect(screen.getByText(/select a conversation to view details/i)).toBeInTheDocument();
  });

  it('renders group details instead of the shared media panel for group chats', () => {
    renderInfoPanel({
      selectedChat: 'group-1',
      selectedChatType: 'group',
      selectedGroup: {
        _id: 'group-1',
        name: 'Design Crew',
        description: 'Discusses message UX polish.',
        members: [{ _id: 'u1' }, { _id: 'u2' }, { _id: 'u3' }],
      },
      isOpen: true,
    });

    expect(screen.getByText('Design Crew')).toBeInTheDocument();
    expect(screen.getByText('3 members')).toBeInTheDocument();
    expect(screen.getByText(/group details/i)).toBeInTheDocument();
    expect(screen.queryByText('Shared media for group-1')).not.toBeInTheDocument();
  });
});


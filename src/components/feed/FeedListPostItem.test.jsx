import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import FeedListPostItem from './FeedListPostItem';

const { feedPostSpy } = vi.hoisted(() => ({
  feedPostSpy: vi.fn(),
}));

vi.mock('./FeedPost', () => ({
  default: forwardRef(function MockFeedPost(props, ref) {
    feedPostSpy(props);
    return <div ref={ref} data-testid="feed-post">{props.post._id}</div>;
  }),
}));

vi.mock('../ui/ActivityTag', () => ({
  ActivityTag: ({ type }) => <div data-testid="activity-tag">{type}</div>,
}));

describe('FeedListPostItem', () => {
  it('renders the activity tag and forwards core props to FeedPost', () => {
    const postRef = vi.fn();

    render(
      <FeedListPostItem
        post={{ _id: 'post-1', activityTag: 'joined' }}
        postIndex={1}
        currentUser={{ displayName: 'Alice' }}
        postRef={postRef}
        openDropdownId={null}
        commentRefs={{ current: {} }}
      />
    );

    expect(screen.getByTestId('activity-tag')).toHaveTextContent('joined');
    expect(screen.getByTestId('feed-post')).toHaveTextContent('post-1');
    expect(feedPostSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({ _id: 'post-1' }),
        postIndex: 1,
        currentUser: expect.objectContaining({ displayName: 'Alice' }),
        isFirstPost: false,
        shouldEagerLoad: true,
      })
    );
    expect(postRef).toHaveBeenCalled();
  });
});
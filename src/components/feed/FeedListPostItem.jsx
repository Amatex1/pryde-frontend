import FeedPost from './FeedPost';
import CommunitySignalCard from './CommunitySignalCard';
import { ActivityTag } from '../ui/ActivityTag';

export default function FeedListPostItem({
  post,
  postIndex,
  currentUser,
  wrapperRef,
  wrapperStyle,
  postRef,
  ...feedPostProps
}) {
  const isFirstPost = postIndex === 0;
  const shouldEagerLoad = postIndex < 3;

  // Render lightweight signal card instead of a full FeedPost
  if (post.type === 'community_signal') {
    return (
      <div ref={wrapperRef} style={wrapperStyle} className="post-wrapper">
        <CommunitySignalCard signal={post} />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={wrapperStyle} className="post-wrapper">
      {post.activityTag && (
        <div className="post-activity-tag">
          <ActivityTag type={post.activityTag} />
        </div>
      )}

      <FeedPost
        ref={postRef}
        post={post}
        postIndex={postIndex}
        currentUser={currentUser}
        isFirstPost={isFirstPost}
        shouldEagerLoad={shouldEagerLoad}
        {...feedPostProps}
      />
    </div>
  );
}
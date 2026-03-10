import FeedPost from './FeedPost';
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
import FeedCommentSheet from './FeedCommentSheet';
import FeedMobileCommentModal from './FeedMobileCommentModal';

function FeedCommentSurfaces({
  commentModalOpen,
  commentSheetOpen,
  currentUser,
  commentText,
  commentGif,
  showGifPicker,
  setCommentModalOpen,
  setCommentSheetOpen,
  setShowGifPicker,
  setCommentGif,
  handleCommentSubmit,
  handleCommentChange,
  handleKeyDown,
  replyingToComment,
  setReplyingToComment,
  activeReplyTargetName,
  replyIsAnonymous,
  setReplyIsAnonymous,
  handleCancelReply,
  replyText,
  handleReplyTextChange,
  handleSubmitReply,
  replyGif,
  handleReplyGifSelect,
  setReplyGif,
  commentSheetContextValue,
  postComments,
  commentReplies,
}) {
  return (
    <>
      <FeedMobileCommentModal
        isOpen={Boolean(commentModalOpen)}
        postId={commentModalOpen}
        currentUser={currentUser}
        value={commentText[commentModalOpen] || ''}
        selectedGif={commentGif[commentModalOpen] || null}
        isGifPickerOpen={showGifPicker === `modal-comment-${commentModalOpen}`}
        onClose={() => {
          setCommentModalOpen(null);
          setShowGifPicker(null);
        }}
        onSubmit={(e) => {
          handleCommentSubmit(commentModalOpen, e);
          setCommentModalOpen(null);
        }}
        onChange={(value) => handleCommentChange(commentModalOpen, value)}
        onKeyDown={handleKeyDown}
        onGifSelect={(gifUrl) => {
          setCommentGif((prev) => ({ ...prev, [commentModalOpen]: gifUrl }));
          setShowGifPicker(null);
        }}
        onGifPickerClose={() => setShowGifPicker(null)}
        onGifToggle={() => setShowGifPicker(showGifPicker === `modal-comment-${commentModalOpen}` ? null : `modal-comment-${commentModalOpen}`)}
        onGifClear={() => setCommentGif((prev) => ({ ...prev, [commentModalOpen]: null }))}
      />

      <FeedCommentSheet
        isOpen={Boolean(commentSheetOpen)}
        postId={commentSheetOpen}
        currentUser={currentUser}
        commentValue={commentText[commentSheetOpen] || ''}
        selectedCommentGif={commentGif[commentSheetOpen] || null}
        isCommentGifPickerOpen={showGifPicker === `sheet-comment-${commentSheetOpen}`}
        onClose={() => {
          setCommentSheetOpen(null);
          setReplyingToComment(null);
          setShowGifPicker(null);
        }}
        onCommentSubmit={(e) => handleCommentSubmit(commentSheetOpen, e)}
        onCommentChange={(value) => handleCommentChange(commentSheetOpen, value)}
        onCommentGifToggle={() => setShowGifPicker(showGifPicker === `sheet-comment-${commentSheetOpen}` ? null : `sheet-comment-${commentSheetOpen}`)}
        onCommentGifSelect={(gifUrl) => {
          setCommentGif((prev) => ({ ...prev, [commentSheetOpen]: gifUrl }));
          setShowGifPicker(null);
        }}
        onCommentGifClear={() => setCommentGif((prev) => ({ ...prev, [commentSheetOpen]: null }))}
        onCommentGifPickerClose={() => setShowGifPicker(null)}
        replyingToComment={replyingToComment}
        replyTargetName={activeReplyTargetName}
        replyIsAnonymous={replyIsAnonymous}
        onReplyAnonymousChange={setReplyIsAnonymous}
        onReplyCancel={handleCancelReply}
        replyText={replyText}
        onReplyTextChange={handleReplyTextChange}
        onReplySubmit={handleSubmitReply}
        replyGif={replyGif}
        isReplyGifPickerOpen={showGifPicker === `sheet-reply-${replyingToComment?.commentId}`}
        onReplyGifToggle={() => setShowGifPicker(showGifPicker === `sheet-reply-${replyingToComment?.commentId}` ? null : `sheet-reply-${replyingToComment?.commentId}`)}
        onReplyGifSelect={(gifUrl) => {
          handleReplyGifSelect(gifUrl);
          setShowGifPicker(null);
        }}
        onReplyGifClear={() => setReplyGif(null)}
        onReplyGifPickerClose={() => setShowGifPicker(null)}
        commentContextValue={commentSheetContextValue}
        comments={postComments[commentSheetOpen] || []}
        commentReplies={commentReplies}
      />
    </>
  );
}

export default FeedCommentSurfaces;
import React, { Suspense, lazy } from 'react';
import { getImageUrl } from '../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial } from '../utils/getDisplayName';
import { sanitizeMessage } from '../utils/sanitize';

// Lazy load heavy components
const AudioPlayer = lazy(() => import('./AudioPlayer'));

/**
 * MessageBubble - Calm message group display
 *
 * Groups consecutive messages by sender for rhythm and flow.
 * Shows avatar ONLY once per group.
 * Applies calm spacing with tight grouping inside, larger gaps between.
 */
export default function MessageBubble({
  group,
  currentUserId,
  onEdit,
  onDelete,
  onReact,
  onReply,
  editingMessageId,
  editMessageText,
  setEditMessageText,
  onSaveEdit,
  onCancelEdit,
  openMessageMenu,
  setOpenMessageMenu,
  bubbleStyles
}) {
  const isOutgoing = group.isCurrentUser;
  const { senderInfo, messages, showDateHeader, dateHeader } = group;

  return (
    <>
      {/* Date Header */}
      {showDateHeader && (
        <div className="date-divider">
          <span>{dateHeader}</span>
        </div>
      )}

      {/* Bubble Group */}
      <div className={`bubble-group ${isOutgoing ? 'outgoing' : 'incoming'}`}>
        {/* Avatar - only shown once per group, for incoming messages */}
        {!isOutgoing && (
          <div className="bubble-avatar">
            {senderInfo.profilePhoto ? (
              <img
                src={getImageUrl(senderInfo.profilePhoto)}
                alt={getDisplayName(senderInfo)}
              />
            ) : (
              <span>{getDisplayNameInitial(senderInfo)}</span>
            )}
          </div>
        )}

        {/* Messages stack */}
        <div className="bubble-stack">
          {/* Sender name - only for incoming, first message */}
          {!isOutgoing && (
            <span className="bubble-sender">{getDisplayName(senderInfo)}</span>
          )}

          {messages.map((msg, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === messages.length - 1;
            const isSingle = messages.length === 1;
            const isEditing = editingMessageId === msg._id;

            // Determine bubble corner style
            let cornerClass = '';
            if (isSingle) {
              cornerClass = isOutgoing ? 'corner-single-out' : 'corner-single-in';
            } else if (isFirst) {
              cornerClass = isOutgoing ? 'corner-first-out' : 'corner-first-in';
            } else if (isLast) {
              cornerClass = isOutgoing ? 'corner-last-out' : 'corner-last-in';
            } else {
              cornerClass = isOutgoing ? 'corner-mid-out' : 'corner-mid-in';
            }

            return (
              <div key={msg._id} className="bubble-row">
                {/* Deleted message placeholder */}
                {msg.isDeleted ? (
                  <div className="bubble deleted">
                    <span className="deleted-icon">🗑️</span>
                    <span className="deleted-text">Message deleted</span>
                  </div>
                ) : isEditing ? (
                  /* Edit mode */
                  <div className="bubble-edit">
                    <input
                      type="text"
                      value={editMessageText}
                      onChange={(e) => setEditMessageText(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button onClick={() => onSaveEdit(msg._id)} className="edit-save">✓</button>
                      <button onClick={onCancelEdit} className="edit-cancel">✕</button>
                    </div>
                  </div>
                ) : (
                  /* Normal bubble */
                  <>
                    <div
                      className={`bubble ${isOutgoing ? 'outgoing' : 'incoming'} ${cornerClass}`}
                      style={bubbleStyles?.(msg, isOutgoing)}
                    >
                      {/* Content Warning */}
                      {msg.contentWarning && (
                        <div className="content-warning-tag">
                          ⚠️ {msg.contentWarning}
                        </div>
                      )}

                      {/* Text content */}
                      {msg.content && (
                        <span className="bubble-text">{sanitizeMessage(msg.content)}</span>
                      )}

                      {/* Attachment */}
                      {msg.attachment && (
                        <div className="bubble-attachment">
                          {msg.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img src={getImageUrl(msg.attachment)} alt="Attachment" />
                          ) : msg.attachment.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={getImageUrl(msg.attachment)} controls />
                          ) : null}
                        </div>
                      )}

                      {/* Voice Note */}
                      {msg.voiceNote?.url && (
                        <Suspense fallback={<div className="loading-audio">Loading...</div>}>
                          <AudioPlayer
                            url={getImageUrl(msg.voiceNote.url)}
                            duration={msg.voiceNote.duration}
                          />
                        </Suspense>
                      )}

                      {/* Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="bubble-reactions">
                          {Object.entries(
                            msg.reactions.reduce((acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <span key={emoji} className="reaction-chip">
                              {emoji} {count > 1 && count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp - only on last message in group */}
                    {isLast && (
                      <span className="bubble-time">
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                        {msg.edited && <span className="edited-tag"> (edited)</span>}
                      </span>
                    )}

                    {/* Actions menu */}
                    <div className="bubble-actions">
                      <button
                        className="action-trigger"
                        onClick={() => setOpenMessageMenu(openMessageMenu === msg._id ? null : msg._id)}
                      >
                        ⋮
                      </button>
                      {openMessageMenu === msg._id && (
                        <div className="action-menu">
                          <button onClick={() => { onReply(msg); setOpenMessageMenu(null); }}>
                            ↩️ Reply
                          </button>
                          <button onClick={() => { onReact(msg._id); setOpenMessageMenu(null); }}>
                            😊 React
                          </button>
                          {isOutgoing && (
                            <>
                              <button onClick={() => { onEdit(msg._id, msg.content); setOpenMessageMenu(null); }}>
                                ✏️ Edit
                              </button>
                              <button className="danger" onClick={() => { onDelete(msg._id, true); setOpenMessageMenu(null); }}>
                                🗑️ Delete
                              </button>
                            </>
                          )}
                          {!isOutgoing && (
                            <button className="danger" onClick={() => { onDelete(msg._id, false); setOpenMessageMenu(null); }}>
                              🗑️ Delete for me
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

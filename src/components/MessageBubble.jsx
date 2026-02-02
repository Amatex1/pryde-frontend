import React, { Suspense, lazy } from 'react';
import { getImageUrl } from '../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial } from '../utils/getDisplayName';
import { sanitizeMessage } from '../utils/sanitize';

// Lazy load heavy components
const AudioPlayer = lazy(() => import('./AudioPlayer'));

/**
 * MessageBubble — Calm grouped message display
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
        {/* Avatar (incoming only) */}
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

        {/* Messages */}
        <div className="bubble-stack">
          {!isOutgoing && (
            <span className="bubble-sender">{getDisplayName(senderInfo)}</span>
          )}

          {messages.map((msg, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === messages.length - 1;
            const isSingle = messages.length === 1;
            const isEditing = editingMessageId === msg._id;

            // Normalize attachment to string URL
            const attachmentUrl =
              typeof msg.attachment === 'string'
                ? msg.attachment
                : msg.attachment?.url || null;

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
                {msg.isDeleted ? (
                  <div className="bubble deleted">
                    <span className="deleted-icon">🗑️</span>
                    <span className="deleted-text">Message deleted</span>
                  </div>
                ) : isEditing ? (
                  <div className="bubble-edit">
                    <input
                      type="text"
                      value={editMessageText}
                      onChange={(e) => setEditMessageText(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button onClick={() => onSaveEdit(msg._id)}>✓</button>
                      <button onClick={onCancelEdit}>✕</button>
                    </div>
                  </div>
                ) : (
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

                      {/* Text */}
                      {msg.content && (
                        <span className="bubble-text">
                          {sanitizeMessage(msg.content)}
                        </span>
                      )}

                      {/* Attachment (Image / Video) */}
                      {attachmentUrl && (
                        <div className="bubble-attachment">
                          {(attachmentUrl.includes('.jpg') ||
                            attachmentUrl.includes('.jpeg') ||
                            attachmentUrl.includes('.png') ||
                            attachmentUrl.includes('.gif') ||
                            attachmentUrl.includes('.webp') ||
                            attachmentUrl.startsWith('data:image') ||
                            attachmentUrl.includes('/upload/image/')) && (
                            <img
                              src={getImageUrl(attachmentUrl)}
                              alt="Attachment"
                              loading="lazy"
                            />
                          )}

                          {(attachmentUrl.includes('.mp4') ||
                            attachmentUrl.includes('.webm') ||
                            attachmentUrl.includes('.ogg')) && (
                            <video
                              src={getImageUrl(attachmentUrl)}
                              controls
                              preload="metadata"
                            />
                          )}
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
                      {msg.reactions?.length > 0 && (
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

                    {/* Timestamp */}
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

                    {/* Actions */}
                    <div className="bubble-actions">
                      <button
                        className="action-trigger"
                        onClick={() =>
                          setOpenMessageMenu(
                            openMessageMenu === msg._id ? null : msg._id
                          )
                        }
                      >
                        ⋮
                      </button>

                      {openMessageMenu === msg._id && (
                        <div className="action-menu">
                          <button onClick={() => onReply(msg)}>↩️ Reply</button>
                          <button onClick={() => onReact(msg._id)}>😊 React</button>

                          {isOutgoing ? (
                            <>
                              <button onClick={() => onEdit(msg._id, msg.content)}>
                                ✏️ Edit
                              </button>
                              <button
                                className="danger"
                                onClick={() => onDelete(msg._id, true)}
                              >
                                🗑️ Delete
                              </button>
                            </>
                          ) : (
                            <button
                              className="danger"
                              onClick={() => onDelete(msg._id, false)}
                            >
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

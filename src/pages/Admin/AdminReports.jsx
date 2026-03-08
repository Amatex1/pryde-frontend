import { useState } from 'react';
import OptimizedImage from '../../components/OptimizedImage';
import { getImageUrl } from '../../utils/imageUrl';

/**
 * AdminReports - Reports management component
 */
function AdminReports({ reports, onResolve }) {
  const [expandedReport, setExpandedReport] = useState(null);

  const renderContentPreview = (report) => {
    if (report.reportType === 'post' && report.reportedPost) {
      const post = report.reportedPost;
      return (
        <div className="content-preview">
          <h4>📝 Reported Post Preview:</h4>
          <div className="preview-card">
            <div className="preview-author">
              {post.author?.profilePhoto && (
                <img src={getImageUrl(post.author.profilePhoto)} alt={post.author.username} className="preview-avatar" />
              )}
              <span>{post.author?.displayName || post.author?.username || 'Unknown'}</span>
            </div>
            <p className="preview-content">{post.content}</p>
            {post.media && post.media.length > 0 && (
              <div className="preview-media">
                {post.media.slice(0, 3).map((media, idx) => (
                  <div key={idx} className="preview-media-item">
                    {media.type === 'image' ? (
                      <img src={getImageUrl(media.url)} alt="Post media" />
                    ) : (
                      <video src={getImageUrl(media.url)} />
                    )}
                  </div>
                ))}
                {post.media.length > 3 && <span>+{post.media.length - 3} more</span>}
              </div>
            )}
            <div className="preview-stats">
              <span>❤️ {post.likes?.length || 0}</span>
              <span>💬 {post.comments?.length || 0}</span>
              <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      );
    }

    if (report.reportType === 'comment' && report.reportedComment) {
      const comment = report.reportedComment;
      return (
        <div className="content-preview">
          <h4>💬 Reported Comment Preview:</h4>
          <div className="preview-card">
            <div className="preview-author">
              {comment.user?.profilePhoto && (
                <img src={getImageUrl(comment.user.profilePhoto)} alt={comment.user.username} className="preview-avatar" />
              )}
              <span>{comment.user?.displayName || comment.user?.username || 'Unknown'}</span>
            </div>
            <p className="preview-content">{comment.content}</p>
          </div>
        </div>
      );
    }

    if (report.reportType === 'user' && report.reportedUser) {
      const user = report.reportedUser;
      return (
        <div className="content-preview">
          <h4>👤 Reported User Profile:</h4>
          <div className="preview-card">
            <div className="preview-author">
              {user.profilePhoto && (
                <img src={getImageUrl(user.profilePhoto)} alt={user.username} className="preview-avatar" />
              )}
              <div>
                <div><strong>{user.displayName || user.username}</strong></div>
                <div style={{ color: '#666', fontSize: '0.9em' }}>@{user.username}</div>
                <div style={{ color: '#666', fontSize: '0.9em' }}>{user.email}</div>
              </div>
            </div>
            {user.bio && <p className="preview-content">{user.bio}</p>}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="reports-list">
      <h2>Pending Reports</h2>
      {reports.length === 0 ? (
        <p className="empty-state">No pending reports</p>
      ) : (
        reports.map(report => (
          <div key={report._id} className="report-card">
            <div className="report-header">
              <span className="report-type">{report.reportType}</span>
              <span className="report-reason">{report.reason}</span>
              <span className="report-date">{new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="report-body">
              <p><strong>Reporter:</strong> {report.reporter?.username || 'Unknown'} ({report.reporter?.email})</p>
              <p><strong>Reported User:</strong> {report.reportedUser?.username || 'N/A'} ({report.reportedUser?.email || 'N/A'})</p>
              {report.description && <p><strong>Description:</strong> {report.description}</p>}

              <button
                className="btn-preview"
                onClick={() => setExpandedReport(expandedReport === report._id ? null : report._id)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: 'var(--pryde-purple)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {expandedReport === report._id ? '🔼 Hide Preview' : '🔽 Show Content Preview'}
              </button>

              {expandedReport === report._id && renderContentPreview(report)}
            </div>
            <div className="report-actions">
              <button className="btn-resolve" onClick={() => onResolve(report._id, 'resolved', 'warning')}>
                ⚠️ Warning
              </button>
              <button className="btn-resolve" onClick={() => onResolve(report._id, 'resolved', 'content_removed')}>
                🗑️ Remove Content
              </button>
              <button className="btn-resolve" onClick={() => onResolve(report._id, 'dismissed', 'none')}>
                ❌ Dismiss
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminReports;


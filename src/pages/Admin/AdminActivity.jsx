import { useNavigate } from 'react-router-dom';

/**
 * AdminActivity - Activity feed component
 */
function AdminActivity({ activity, onViewPost }) {
  const navigate = useNavigate();

  return (
    <div className="activity-container">
      <h2>Recent Activity ({activity.period})</h2>

      <div className="activity-section">
        <h3>📝 Recent Posts ({activity.recentPosts.length})</h3>
        <div className="activity-table">
          <div className="activity-table-header">
            <span className="activity-header-author">Author</span>
            <span className="activity-header-post">Post</span>
            <span className="activity-header-date">Date Posted</span>
          </div>
          <div className="activity-list">
            {activity.recentPosts.slice(0, 10).map(post => (
              <div key={post._id} className="activity-item">
                <span
                  className="activity-user-link"
                  onClick={() => navigate(`/profile/${post.author?._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {post.author?.displayName || post.author?.username}
                </span>
                <span
                  className="activity-post-link"
                  onClick={() => onViewPost(post._id)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view full post in modal"
                >
                  {post.content?.substring(0, 100)}{post.content?.length > 100 ? '...' : ''}
                </span>
                <span className="activity-date">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h3>👥 New Users ({activity.recentUsers.length})</h3>
        <div className="activity-table">
          <div className="activity-table-header">
            <span className="activity-header-realname">Display Name</span>
            <span className="activity-header-username">Username</span>
            <span className="activity-header-email">Email</span>
            <span className="activity-header-date">Date Joined</span>
          </div>
          <div className="activity-list">
            {activity.recentUsers.slice(0, 10).map(user => (
              <div key={user._id} className="activity-item">
                <span className="activity-realname">{user.displayName || user.username}</span>
                <span
                  className="activity-user-link"
                  onClick={() => navigate(`/profile/${user._id}`)}
                  style={{ cursor: 'pointer' }}
                  title="View profile"
                >
                  {user.username}
                </span>
                <span className="activity-email">{user.email}</span>
                <span className="activity-date">{new Date(user.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h3>🚩 Recent Reports ({activity.recentReports.length})</h3>
        <div className="activity-table">
          <div className="activity-table-header">
            <span className="activity-header-reporter">Reporter</span>
            <span className="activity-header-report">Report Details</span>
            <span className="activity-header-date">Date Reported</span>
          </div>
          <div className="activity-list">
            {activity.recentReports.slice(0, 10).map(report => (
              <div key={report._id} className="activity-item">
                <span
                  className="activity-user-link"
                  onClick={() => navigate(`/profile/${report.reporter?._id}`)}
                  style={{ cursor: 'pointer' }}
                  title="View reporter profile"
                >
                  {report.reporter?.displayName || report.reporter?.username}
                </span>
                <span className="activity-content">
                  Reported {report.reportType}: {report.reason}
                </span>
                <span className="activity-date">{new Date(report.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminActivity;


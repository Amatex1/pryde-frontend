/**
 * AdminDashboard - Dashboard statistics display
 * 
 * Displays platform statistics in a grid layout.
 */
function AdminDashboard({ stats }) {
  return (
    <div className="dashboard-grid">
      <div className="stat-card">
        <h3>👥 Users</h3>
        <div className="stat-number">{stats.users.total}</div>
        <div className="stat-details">
          <span>✅ Active: {stats.users.active}</span>
          <span>⏸️ Suspended: {stats.users.suspended}</span>
          <span>🚫 Banned: {stats.users.banned}</span>
          <span>🆕 New this week: {stats.users.newThisWeek}</span>
          <span>📱 Active today: {stats.users.activeToday}</span>
        </div>
      </div>

      <div className="stat-card">
        <h3>📝 Content</h3>
        <div className="stat-number">{stats.content.totalPosts}</div>
        <div className="stat-details">
          <span>Posts: {stats.content.totalPosts}</span>
          <span>Messages: {stats.content.totalMessages}</span>
        </div>
      </div>

      <div className="stat-card">
        <h3>🛡️ Moderation</h3>
        <div className="stat-number">{stats.moderation.pendingReports}</div>
        <div className="stat-details">
          <span>⏳ Pending: {stats.moderation.pendingReports}</span>
          <span>📋 Total Reports: {stats.moderation.totalReports}</span>
          <span>🚫 Total Blocks: {stats.moderation.totalBlocks}</span>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;


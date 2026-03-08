/**
 * AdminBlocks - User blocks management component
 */
function AdminBlocks({ blocks }) {
  return (
    <div className="blocks-list">
      <h2>User Blocks</h2>
      {blocks.length === 0 ? (
        <p className="empty-state">No blocks found</p>
      ) : (
        <table className="blocks-table">
          <thead>
            <tr>
              <th>Blocker</th>
              <th>Blocked User</th>
              <th>Date</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map(block => (
              <tr key={block._id}>
                <td data-label="Blocker">{block.blocker?.username} ({block.blocker?.email})</td>
                <td data-label="Blocked User">{block.blocked?.username} ({block.blocked?.email})</td>
                <td data-label="Date">{new Date(block.createdAt).toLocaleDateString()}</td>
                <td data-label="Reason">{block.reason || 'No reason provided'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminBlocks;


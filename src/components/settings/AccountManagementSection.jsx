const AccountManagementSection = ({
  currentUser,
  onDownloadData,
  onDeactivate,
  onDelete,
  onCancelDeletion,
}) => {
  return (
    <div className="settings-section danger-zone">
      <h2 className="section-title">Account Management</h2>

      <div className="account-actions">
        <div className="action-item">
          <div className="action-info">
            <h3>📥 Download Your Data</h3>
            <p>Download a copy of all your data including posts, messages, and profile information</p>
          </div>
          <button
            type="button"
            onClick={onDownloadData}
            className="btn-download"
          >
            Download Data
          </button>
        </div>

        <div className="action-item">
          <div className="action-info">
            <h3>⏸️ Deactivate Account</h3>
            <p>Temporarily deactivate your account. You can reactivate by logging in again.</p>
          </div>
          <button
            type="button"
            onClick={onDeactivate}
            className="btn-deactivate"
          >
            Deactivate Account
          </button>
        </div>

        {currentUser?.isDeleted ? (
          <div className="action-item danger">
            <div className="action-info">
              <h3>⏳ Deletion Pending</h3>
              <p className="danger-text">
                Your account is scheduled for permanent deletion on{' '}
                <strong>
                  {currentUser.deletionScheduledFor
                    ? new Date(currentUser.deletionScheduledFor).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'soon'}
                </strong>.
                Log in or cancel below to keep your account.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelDeletion}
              className="btn-deactivate"
            >
              Cancel Deletion
            </button>
          </div>
        ) : (
          <div className="action-item danger">
            <div className="action-info">
              <h3>🗑️ Delete Account</h3>
              <p className="danger-text">
                Schedule your account for deletion. You have 30 days to change your mind.
                After that, your profile, posts, and data will be permanently removed.
              </p>
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="btn-delete-account"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManagementSection;

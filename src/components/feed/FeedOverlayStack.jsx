import ReportModal from '../ReportModal';
import PhotoViewer from '../PhotoViewer';
import CustomModal from '../CustomModal';
import ReactionDetailsModal from '../ReactionDetailsModal';
import Toast from '../Toast';
import FeedPrivacyModal from './FeedPrivacyModal';

export default function FeedOverlayStack({
  reportModal,
  onCloseReportModal,
  photoViewerImage,
  onClosePhotoViewer,
  showPrivacyModal,
  friends,
  hiddenFromUsers,
  onHiddenUsersChange,
  onClosePrivacyModal,
  modalState,
  onCloseModal,
  reactionDetailsModal,
  onCloseReactionDetails,
  toasts,
  onRemoveToast,
}) {
  return (
    <>
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={onCloseReportModal}
        reportType={reportModal.type}
        contentId={reportModal.contentId}
        userId={reportModal.userId}
      />

      {photoViewerImage && (
        <PhotoViewer imageUrl={photoViewerImage} onClose={onClosePhotoViewer} />
      )}

      <FeedPrivacyModal
        isOpen={showPrivacyModal}
        friends={friends}
        hiddenFromUsers={hiddenFromUsers}
        onHiddenUsersChange={onHiddenUsersChange}
        onClose={onClosePrivacyModal}
      />

      <CustomModal
        isOpen={modalState.isOpen}
        onClose={onCloseModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        placeholder={modalState.placeholder}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        inputType={modalState.inputType}
        defaultValue={modalState.defaultValue}
      />

      {reactionDetailsModal.isOpen && (
        <ReactionDetailsModal
          targetType={reactionDetailsModal.targetType}
          targetId={reactionDetailsModal.targetId}
          onClose={onCloseReactionDetails}
        />
      )}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </>
  );
}
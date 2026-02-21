import { useEffect, useState } from 'react';
import './PhotoViewer.css';

function PhotoViewer({ imageUrl, onClose }) {
  const [imgError, setImgError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="photo-viewer-overlay" onClick={onClose}>
      <div className="photo-viewer-container">
        <button className="photo-viewer-close" onClick={onClose}>
          ✕
        </button>
        {imgError ? (
          <div className="photo-viewer-error">
            <span className="photo-viewer-error-icon">🖼️</span>
            <p>Image unavailable</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Full size"
            className="photo-viewer-image"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              e.stopPropagation();
              setImgError(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default PhotoViewer;


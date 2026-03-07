import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

  // Stop propagation handler
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return createPortal(
    <button
      type="button"
      className="photo-viewer-overlay"
      onClick={onClose}
      aria-label="Close photo viewer"
    >
      <button className="photo-viewer-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <div
        className="photo-viewer-container"
        onClick={stopPropagation}
        onKeyDown={stopPropagation}
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
      >
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
            onClick={stopPropagation}
            onKeyDown={stopPropagation}
            onError={(e) => {
              e.stopPropagation();
              setImgError(true);
            }}
          />
        )}
      </div>
    </button>,
    document.body
  );
}

export default PhotoViewer;

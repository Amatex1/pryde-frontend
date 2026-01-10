import { useState, useRef } from 'react';
import '../styles/PausableGif.css';

/**
 * PausableGif Component
 *
 * Displays a GIF with click-to-pause functionality
 * Shows a play/pause icon overlay when paused
 * Shows a fallback when the GIF fails to load
 *
 * @param {string} src - GIF URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - Additional CSS classes
 * @param {string} loading - Loading strategy (lazy/eager)
 */
const PausableGif = ({ src, alt = 'GIF', className = '', loading = 'lazy' }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent triggering parent click handlers

    if (hasError) return; // Don't toggle pause on broken images

    if (!isPaused) {
      // Pause: Capture current frame to canvas
      const img = imgRef.current;
      const canvas = canvasRef.current;

      if (img && canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }

    setIsPaused(!isPaused);
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  // Show fallback for broken GIFs
  if (hasError) {
    return (
      <div className={`pausable-gif-container gif-error ${className}`}>
        <div className="gif-error-content">
          <span className="gif-error-icon">🎞️</span>
          <span className="gif-error-text">GIF unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`pausable-gif-container ${className}`} onClick={handleClick}>
      {/* Animated GIF (hidden when paused) */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`pausable-gif ${isPaused ? 'paused' : ''}`}
      />

      {/* Static canvas showing frozen frame (visible when paused) */}
      <canvas
        ref={canvasRef}
        className={`pausable-gif-canvas ${isPaused ? 'visible' : ''}`}
      />

      {/* Play/Pause icon overlay - only show after image is loaded */}
      {isPaused && isLoaded && (
        <div className="gif-play-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Semi-transparent circle background */}
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="rgba(0, 0, 0, 0.6)"
              stroke="white"
              strokeWidth="2"
            />
            {/* Play triangle */}
            <path
              d="M26 20 L26 44 L44 32 Z"
              fill="white"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default PausableGif;


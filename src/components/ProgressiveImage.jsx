import { useState } from 'react';
import './ProgressiveImage.css';

/**
 * ProgressiveImage - Blur-up image loading
 * 
 * Usage:
 * <ProgressiveImage
 *   src="https://example.com/image.jpg"
 *   placeholderSrc="https://example.com/image-tiny.jpg"
 *   alt="Description"
 *   aspectRatio="16/9"
 * />
 */
export function ProgressiveImage({
  src,
  placeholderSrc,
  alt = '',
  className = '',
  aspectRatio,
  onLoad,
  onError,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  // Calculate aspect ratio padding if provided
  const aspectStyle = aspectRatio 
    ? { paddingBottom: `${(1 / eval(aspectRatio)) * 100}%` }
    : {};

  return (
    <div 
      className={`progressive-image-container ${loaded ? 'loaded' : ''} ${error ? 'error' : ''} ${className}`}
      style={aspectStyle}
    >
      {/* Placeholder - always visible until loaded */}
      <img
        src={placeholderSrc || src}
        alt=""
        aria-hidden="true"
        className="progressive-image-placeholder"
      />
      
      {/* Main image - fades in when loaded */}
      {!error && (
        <img
          src={src}
          alt={alt}
          className="progressive-image-main"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Error state */}
      {error && (
        <div className="progressive-image-error">
          <span className="progressive-image-error-icon">🖼️</span>
          <span className="progressive-image-error-text">Image unavailable</span>
        </div>
      )}
    </div>
  );
}

/**
 * OptimizedImage - Simple optimized image with loading state
 * 
 * Usage:
 * <OptimizedImage
 *   src="https://example.com/image.jpg"
 *   alt="Description"
 *   lazy // Add loading="lazy"
 * />
 */
export function OptimizedImage({
  src,
  alt,
  className = '',
  lazy = true,
  onLoad,
  onError,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  return (
    <div className={`optimized-image ${loaded ? 'loaded' : ''} ${error ? 'error' : ''} ${className}`}>
      {!error && (
        <img
          src={src}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {error && (
        <div className="optimized-image-error">
          <span>🖼️</span>
        </div>
      )}
      
      {/* Loading skeleton */}
      {!loaded && !error && (
        <div className="optimized-image-skeleton" />
      )}
    </div>
  );
}

export default ProgressiveImage;

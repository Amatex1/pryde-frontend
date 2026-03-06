/**
 * ProgressiveImage - Component for progressive image loading
 * 
 * Features:
 * - Low-resolution placeholder
 * - Blur effect during load
 * - Smooth transition to full image
 * - Lazy loading
 * - Handles failed loads gracefully
 */

import { useState, useEffect } from 'react';
import './ProgressiveImage.css';

/**
 * ProgressiveImage Component
 * @param {string} src - Full resolution image URL
 * @param {string} placeholder - Low-res placeholder URL (optional - will use tiny URL)
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - Additional CSS classes
 * @param {object} props - Additional img attributes
 */
export function ProgressiveImage({
  src,
  placeholder,
  alt = '',
  className = '',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setIsError(false);
    setCurrentSrc(placeholder || src);
  }, [src, placeholder]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  // If we have a placeholder and haven't loaded yet, show blur
  const showBlur = placeholder && !isLoaded && !isError;

  return (
    <div className={`progressive-image-container ${className}`}>
      {/* Placeholder with blur */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className={`progressive-image-placeholder ${showBlur ? 'blur' : ''}`}
          aria-hidden="true"
        />
      )}
      
      {/* Full image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`progressive-image-full ${isLoaded ? 'loaded' : ''}`}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {/* Error fallback */}
      {isError && (
        <div className="progressive-image-error">
          <span role="img" aria-label="image error">🖼️</span>
        </div>
      )}
    </div>
  );
}

export default ProgressiveImage;

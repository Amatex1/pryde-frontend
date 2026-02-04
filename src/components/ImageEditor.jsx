/**
 * ImageEditor - Non-destructive avatar and cover photo editor
 * Uses react-easy-crop for drag, zoom, and mobile gestures
 * Stores transform metadata (x, y, scale) instead of cropping
 *
 * Features:
 * - Drag/pan with mouse or touch
 * - Zoom with scroll wheel or pinch gestures
 * - Double-tap/double-click to reset to defaults
 * - Safe-area visual guides (subtle, non-interactive)
 * - Mobile gesture support (one-finger drag, two-finger pinch)
 * - Real-time preview updates
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import './ImageEditor.css';

function ImageEditor({
  image,
  aspect = 1, // 1 for avatar (square), 16/6 for cover
  cropShape = 'rect', // 'rect' for cover, 'round' for avatar
  initialCrop = { x: 0, y: 0 },
  initialZoom = 1,
  onCropChange,
  onZoomChange,
  onReset,
  showControls = true,
  minZoom = 1,
  maxZoom = 3,
  showSafeAreaGuide = true,
  safeAreaGuideType = 'avatar' // 'avatar' or 'cover'
}) {
  const [crop, setCrop] = useState(initialCrop);
  const [zoom, setZoom] = useState(initialZoom);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const cropperRef = useRef(null);

  // Handle crop changes
  const handleCropChange = useCallback((location) => {
    setCrop(location);
    if (onCropChange) {
      onCropChange(location);
    }
  }, [onCropChange]);

  // Handle zoom changes
  const handleZoomChange = useCallback((newZoom) => {
    setZoom(newZoom);
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
  }, [onZoomChange]);

  // Handle double-tap/double-click reset
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - reset to defaults
      const defaultCrop = { x: 0, y: 0 };
      const defaultZoom = 1;

      setCrop(defaultCrop);
      setZoom(defaultZoom);

      if (onCropChange) onCropChange(defaultCrop);
      if (onZoomChange) onZoomChange(defaultZoom);
      if (onReset) onReset();

      // Add subtle visual feedback
      if (cropperRef.current) {
        cropperRef.current.style.transform = 'scale(0.98)';
        setTimeout(() => {
          if (cropperRef.current) {
            cropperRef.current.style.transform = 'scale(1)';
          }
        }, 150);
      }
    }

    setLastTap(now);
  }, [lastTap, onCropChange, onZoomChange, onReset]);

  // Handle mouse/touch events for double-tap detection
  const handlePointerDown = useCallback((e) => {
    setIsDragging(true);
  }, []);

  const handlePointerUp = useCallback((e) => {
    setIsDragging(false);
    // Only check for double-tap if not dragging
    if (!isDragging) {
      handleDoubleTap();
    }
  }, [isDragging, handleDoubleTap]);

  // Prevent page scroll while interacting with cropper on mobile
  useEffect(() => {
    const preventScroll = (e) => {
      if (cropperRef.current && cropperRef.current.contains(e.target)) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e) => {
      if (cropperRef.current && cropperRef.current.contains(e.target)) {
        // Allow vertical scrolling within cropper bounds
        // But prevent page scroll when interacting with cropper
        if (Math.abs(e.touches[0].clientY - e.touches[0].screenY) > 10) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('wheel', preventScroll);
    };
  }, []);

  if (!image) return null;

  return (
    <div className="image-editor">
      <div className="crop-container" ref={cropperRef}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          showGrid={false}
          onCropChange={handleCropChange}
          onZoomChange={handleZoomChange}
          minZoom={minZoom}
          maxZoom={maxZoom}
          objectFit="contain"
          classes={{
            containerClassName: 'crop-area-container',
            mediaClassName: 'crop-media',
            cropAreaClassName: 'crop-area'
          }}
          onTouchStart={handlePointerDown}
          onMouseDown={handlePointerDown}
          onTouchEnd={handlePointerUp}
          onMouseUp={handlePointerUp}
        />

        {/* Safe Area Guides - Visual only, non-interactive */}
        {showSafeAreaGuide && (
          <div className="safe-area-guides">
            {safeAreaGuideType === 'avatar' && (
              <div className="avatar-safe-guide">
                {/* Subtle centered circle/oval for face framing */}
                <div className="face-guide-circle"></div>
              </div>
            )}
            {safeAreaGuideType === 'cover' && (
              <div className="cover-safe-guide">
                {/* Subtle horizontal band for safe area */}
                <div className="safe-area-band"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {showControls && (
        <div className="crop-controls">
          <div className="zoom-control">
            <span className="zoom-icon">🔍</span>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="crop-zoom-slider"
              aria-label="Zoom"
            />
            <span className="zoom-value">{zoom.toFixed(1)}x</span>
          </div>

          <div className="editor-instructions">
            <small>
              Drag to pan • Scroll/pinch to zoom • Double-tap to reset
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageEditor;

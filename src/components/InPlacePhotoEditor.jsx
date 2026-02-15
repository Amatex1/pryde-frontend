import { useState, useRef, useEffect, useCallback } from 'react';
import './InPlacePhotoEditor.css';

/**
 * InPlacePhotoEditor - Calm, real-time photo repositioning
 *
 * Features:
 * - Drag-to-reposition with CSS transforms
 * - Visual guides (fade during drag)
 * - Keyboard nudging (arrow keys)
 * - Zoom slider for avatar (appears after interaction)
 * - Respects prefers-reduced-motion
 * - Native touch event listeners (non-passive) for mobile drag support
 * - Stable DOM tree (always renders wrapper div to prevent React removeChild errors)
 */
function InPlacePhotoEditor({
  type,
  imageUrl,
  position,
  onPositionChange,
  isEditing,
  children
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const editorRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const guideFadeTimeoutRef = useRef(null);

  // Refs to avoid stale closures in document-level event listeners
  const positionRef = useRef(position);
  const onPositionChangeRef = useRef(onPositionChange);

  // Keep refs in sync with props
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { onPositionChangeRef.current = onPositionChange; }, [onPositionChange]);

  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bounds = type === 'cover'
    ? { maxX: 100, maxY: 100 }
    : { maxX: 50, maxY: 50 };

  // Native event listeners for drag — avoids React's passive touch listeners
  // and stale closure issues since all handlers are created fresh inside the effect
  useEffect(() => {
    const el = editorRef.current;
    if (!el || !isEditing) return;

    let moveHandler = null;
    let endHandler = null;

    const handleDragMove = (e) => {
      e.preventDefault();
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;
      const newX = dragStartRef.current.posX + deltaX;
      const newY = dragStartRef.current.posY + deltaY;

      const boundedX = Math.max(-bounds.maxX, Math.min(bounds.maxX, newX));
      const boundedY = Math.max(-bounds.maxY, Math.min(bounds.maxY, newY));

      onPositionChangeRef.current({
        ...positionRef.current,
        x: boundedX,
        y: boundedY
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);

      if (!prefersReducedMotion) {
        guideFadeTimeoutRef.current = setTimeout(() => setShowGuides(true), 300);
      } else {
        setShowGuides(true);
      }

      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
      moveHandler = null;
      endHandler = null;
    };

    const handleDragStart = (e) => {
      // Don't intercept clicks on the zoom slider
      if (e.target.closest && e.target.closest('.zoom-slider-overlay')) return;

      e.preventDefault();
      setIsDragging(true);
      setHasInteracted(true);
      setShowGuides(false);

      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

      dragStartRef.current = {
        x: clientX,
        y: clientY,
        posX: positionRef.current.x,
        posY: positionRef.current.y
      };

      // Store refs so handleDragEnd can clean up
      moveHandler = handleDragMove;
      endHandler = handleDragEnd;

      if (e.type.startsWith('touch')) {
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
      } else {
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
      }
    };

    // Register with { passive: false } so e.preventDefault() works on touch
    el.addEventListener('touchstart', handleDragStart, { passive: false });
    el.addEventListener('mousedown', handleDragStart);

    return () => {
      el.removeEventListener('touchstart', handleDragStart);
      el.removeEventListener('mousedown', handleDragStart);
      // Clean up any lingering document listeners
      if (moveHandler) {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('touchmove', moveHandler);
      }
      if (endHandler) {
        document.removeEventListener('mouseup', endHandler);
        document.removeEventListener('touchend', endHandler);
      }
    };
  }, [isEditing, type, bounds.maxX, bounds.maxY, prefersReducedMotion]);

  // Keyboard nudging (uses React event — no passive issue with keyboards)
  const handleKeyDown = useCallback((e) => {
    if (!isEditing) return;
    const step = 5;
    let newX = position.x;
    let newY = position.y;

    switch (e.key) {
      case 'ArrowUp': newY -= step; e.preventDefault(); break;
      case 'ArrowDown': newY += step; e.preventDefault(); break;
      case 'ArrowLeft': newX -= step; e.preventDefault(); break;
      case 'ArrowRight': newX += step; e.preventDefault(); break;
      default: return;
    }

    setHasInteracted(true);
    const boundedX = Math.max(-bounds.maxX, Math.min(bounds.maxX, newX));
    const boundedY = Math.max(-bounds.maxY, Math.min(bounds.maxY, newY));
    onPositionChange({ ...position, x: boundedX, y: boundedY });
  }, [isEditing, position, onPositionChange, bounds.maxX, bounds.maxY]);

  // Scale change handler
  const handleScaleChange = useCallback((e) => {
    const newScale = parseFloat(e.target.value);
    onPositionChange({ ...position, scale: newScale });
    setHasInteracted(true);
  }, [position, onPositionChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (guideFadeTimeoutRef.current) clearTimeout(guideFadeTimeoutRef.current);
    };
  }, []);

  // ALWAYS render wrapper div to keep DOM tree stable (prevents removeChild errors)
  // When not editing, the wrapper has no event handlers and neutral styling
  return (
    <div
      ref={editorRef}
      className={`in-place-editor in-place-editor--${type}${isEditing ? ' editing' : ''}${isDragging ? ' dragging' : ''}${hasInteracted ? ' interacted' : ''}`}
      onKeyDown={isEditing ? handleKeyDown : undefined}
      tabIndex={isEditing ? 0 : undefined}
      role={isEditing ? 'img' : undefined}
      aria-label={isEditing ? `${type === 'cover' ? 'Cover photo' : 'Profile photo'} editor - drag to reposition or use arrow keys` : undefined}
    >
      {children}

      {/* Visual Guides - only when editing cover */}
      {isEditing && type === 'cover' && (
        <div className={`visual-guides ${showGuides ? '' : 'faded'}`}>
          <div className="visual-guide guide-avatar-safe" aria-hidden="true" />
          <div className="visual-guide guide-text-clearance" aria-hidden="true" />
        </div>
      )}

      {/* Zoom slider for avatar - only when editing */}
      {isEditing && type === 'avatar' && (
        <div className="zoom-slider-overlay">
          <label htmlFor="avatar-zoom-slider" className="zoom-label">
            Fine-tune size
          </label>
          <input
            id="avatar-zoom-slider"
            type="range"
            min="1"
            max="2"
            step="0.01"
            value={position.scale}
            onChange={handleScaleChange}
            className="zoom-slider"
            aria-label="Adjust photo zoom"
          />
        </div>
      )}

      {/* Edit affordance hint - only when editing */}
      {isEditing && (
        <div className="edit-affordance" aria-hidden="true">
          <span className="edit-hint">
            {type === 'cover' ? 'Drag to reposition' : 'Drag or zoom'}
          </span>
        </div>
      )}
    </div>
  );
}

export default InPlacePhotoEditor;

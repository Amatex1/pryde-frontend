import { useState, useRef, useEffect } from 'react';
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
 * 
 * @param {Object} props
 * @param {'cover' | 'avatar'} props.type - Photo type
 * @param {string} props.imageUrl - Image URL
 * @param {Object} props.position - Current position {x, y, scale}
 * @param {Function} props.onPositionChange - Callback when position changes
 * @param {boolean} props.isEditing - Whether editing mode is active
 * @param {React.ReactNode} props.children - Image element to wrap
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

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Bounds for dragging (prevent excessive movement)
  const bounds = type === 'cover' 
    ? { maxX: 100, maxY: 100 } 
    : { maxX: 50, maxY: 50 };

  // Handle drag start
  const handleDragStart = (e) => {
    if (!isEditing) return; // Only allow drag when editing mode is active
    
    e.preventDefault();
    setIsDragging(true);
    setHasInteracted(true);
    setShowGuides(false); // Fade guides during drag

    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: position.x,
      posY: position.y
    };

    // Add move and end listeners
    if (e.type.startsWith('touch')) {
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
    } else {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }
  };

  // Handle drag move
  const handleDragMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();

    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    const newX = dragStartRef.current.posX + deltaX;
    const newY = dragStartRef.current.posY + deltaY;

    // Apply soft bounds
    const boundedX = Math.max(-bounds.maxX, Math.min(bounds.maxX, newX));
    const boundedY = Math.max(-bounds.maxY, Math.min(bounds.maxY, newY));

    onPositionChange({
      ...position,
      x: boundedX,
      y: boundedY
    });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);

    // Fade guides back in after a short pause
    if (!prefersReducedMotion) {
      guideFadeTimeoutRef.current = setTimeout(() => {
        setShowGuides(true);
      }, 300);
    } else {
      setShowGuides(true);
    }

    // Remove listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  };

  // Handle keyboard nudging
  const handleKeyDown = (e) => {
    if (!isEditing) return;

    const step = 5; // 5px per keypress
    let newX = position.x;
    let newY = position.y;

    switch (e.key) {
      case 'ArrowUp':
        newY -= step;
        e.preventDefault();
        break;
      case 'ArrowDown':
        newY += step;
        e.preventDefault();
        break;
      case 'ArrowLeft':
        newX -= step;
        e.preventDefault();
        break;
      case 'ArrowRight':
        newX += step;
        e.preventDefault();
        break;
      default:
        return;
    }

    setHasInteracted(true);

    // Apply bounds
    const boundedX = Math.max(-bounds.maxX, Math.min(bounds.maxX, newX));
    const boundedY = Math.max(-bounds.maxY, Math.min(bounds.maxY, newY));

    onPositionChange({
      ...position,
      x: boundedX,
      y: boundedY
    });
  };

  // Handle scale change
  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    onPositionChange({
      ...position,
      scale: newScale
    });
    setHasInteracted(true);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (guideFadeTimeoutRef.current) {
        clearTimeout(guideFadeTimeoutRef.current);
      }
    };
  }, []);

  // Always render children, but add editing functionality when isEditing is true
  if (!isEditing) {
    return <>{children}</>;
  }

  return (
    <div
      ref={editorRef}
      className={`in-place-editor in-place-editor--${type} ${isDragging ? 'dragging' : ''} ${hasInteracted ? 'interacted' : ''}`}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="img"
      aria-label={`${type === 'cover' ? 'Cover photo' : 'Profile photo'} editor - drag to reposition or use arrow keys`}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {children}

      {/* Visual Guides */}
      {type === 'cover' && (
        <div className={`visual-guides ${showGuides ? '' : 'faded'}`}>
          {/* Avatar-safe circle guide */}
          <div className="visual-guide guide-avatar-safe" aria-hidden="true"></div>
          {/* Text clearance guide */}
          <div className="visual-guide guide-text-clearance" aria-hidden="true"></div>
        </div>
      )}

      {/* Zoom slider for avatar (appears after interaction) */}
      {type === 'avatar' && (
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

      {/* Edit affordance hint */}
      <div className="edit-affordance" aria-hidden="true">
        <span className="edit-hint">
          {type === 'cover' ? 'Drag to reposition' : 'Drag or zoom'}
        </span>
      </div>
    </div>
  );
}

export default InPlacePhotoEditor;

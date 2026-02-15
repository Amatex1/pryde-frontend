import { useState, useRef, useCallback } from "react";
import "./PhotoRepositionFullscreen.css";

export default function PhotoRepositionInline({
  type, // "cover" | "avatar"
  imageUrl,
  initialPosition = { x: 0, y: 0, scale: 1 },
  onSave,
  onCancel
}) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const frameRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const bounds = type === "cover"
    ? { maxX: 200, maxY: 100 }
    : { maxX: 60, maxY: 60 };

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  }, [position.x, position.y]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    let newX = dragRef.current.startPosX + deltaX;
    let newY = dragRef.current.startPosY + deltaY;
    newX = Math.max(-bounds.maxX, Math.min(bounds.maxX, newX));
    newY = Math.max(-bounds.maxY, Math.min(bounds.maxY, newY));
    setPosition(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, bounds.maxX, bounds.maxY]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScaleChange = useCallback((e) => {
    setPosition(prev => ({ ...prev, scale: parseFloat(e.target.value) }));
  }, []);

  const handleReset = useCallback(() => {
    setPosition({ x: 0, y: 0, scale: 1 });
  }, []);

  const zoomPercent = Math.round(position.scale * 100);

  return (
    <div className={`photo-editor-inline ${type}`}>
      {/* Drag area */}
      <div
        ref={frameRef}
        className={`photo-editor-inline-frame ${type}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img
          src={imageUrl}
          alt="Editing"
          draggable="false"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`
          }}
        />
        {type === "cover" && (
          <div className="photo-editor-inline-hint">
            Drag to reposition
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="photo-editor-inline-controls">
        {type === "avatar" && (
          <span className="photo-editor-inline-hint-bar">Drag to reposition</span>
        )}
        <div className="photo-editor-inline-zoom">
          <span className="zoom-label">🔍 {zoomPercent}%</span>
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.01"
            value={position.scale}
            onChange={handleScaleChange}
            className="zoom-slider"
          />
        </div>
        <div className="photo-editor-inline-buttons">
          <button onClick={handleReset} className="pe-btn pe-btn--secondary">
            Reset
          </button>
          <button onClick={onCancel} className="pe-btn pe-btn--secondary">
            Cancel
          </button>
          <button onClick={() => onSave(position)} className="pe-btn pe-btn--primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

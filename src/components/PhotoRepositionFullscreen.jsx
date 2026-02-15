import React, { useState, useRef } from "react";
import "./PhotoRepositionFullscreen.css";

export default function PhotoRepositionFullscreen({
  type, // "cover" | "avatar"
  imageUrl,
  initialPosition = { x: 0, y: 0, scale: 1 },
  onSave,
  onCancel
}) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const bounds = type === "cover"
    ? { maxX: 150, maxY: 150 }
    : { maxX: 80, maxY: 80 };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    let newX = dragRef.current.startPosX + deltaX;
    let newY = dragRef.current.startPosY + deltaY;

    newX = Math.max(-bounds.maxX, Math.min(bounds.maxX, newX));
    newY = Math.max(-bounds.maxY, Math.min(bounds.maxY, newY));

    setPosition(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setPosition({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div className="photo-editor-overlay">
      <div className="photo-editor-header">
        <h3>{type === "cover" ? "Edit Cover Photo" : "Edit Profile Photo"}</h3>
      </div>

      <div
        className={`photo-editor-frame ${type}`}
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
      </div>

      <div className="photo-editor-controls">
        <button onClick={handleReset} className="secondary">
          Reset
        </button>
        <div className="spacer" />
        <button onClick={onCancel} className="secondary">
          Cancel
        </button>
        <button
          onClick={() => onSave(position)}
          className="primary"
        >
          Save
        </button>
      </div>
    </div>
  );
}


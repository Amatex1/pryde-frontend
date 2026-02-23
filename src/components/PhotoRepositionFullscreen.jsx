import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import "./PhotoRepositionFullscreen.css";

export default function PhotoRepositionInline({
  type,                                        // "cover" | "avatar"
  imageUrl,
  cropSize,      // { width, height } — for cover; makes the box fill the container exactly
  initialPosition = { x: 0, y: 0, scale: 1 },
  onSave,
  onCancel,
}) {
  // Treat the legacy backend sentinel (50, 50) as "no saved position"
  const isLegacyDefault =
    initialPosition.x === 50 && initialPosition.y === 50;

  const [crop, setCrop] = useState(
    isLegacyDefault
      ? { x: 0, y: 0 }
      : { x: initialPosition.x || 0, y: initialPosition.y || 0 }
  );
  const [zoom, setZoom] = useState(initialPosition.scale || 1);

  // ── Transient zoom badge ──────────────────────────────────────────────────
  const [showZoomBadge, setShowZoomBadge] = useState(false);
  const badgeTimerRef = useRef(null);

  const triggerZoomBadge = useCallback(() => {
    setShowZoomBadge(true);
    clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current = setTimeout(() => setShowZoomBadge(false), 1400);
  }, []);

  useEffect(() => () => clearTimeout(badgeTimerRef.current), []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCropChange = useCallback((c) => setCrop(c), []);

  // react-easy-crop fires onZoomChange on pinch/scroll — badge shows then
  const handleZoomChange = useCallback(
    (value) => {
      const clamped = Math.min(3, Math.max(1, value));
      setZoom(clamped);
      triggerZoomBadge();
    },
    [triggerZoomBadge]
  );

  // +/- buttons increment by 0.15x per tap
  const stepZoom = useCallback(
    (delta) => handleZoomChange(zoom + delta),
    [zoom, handleZoomChange]
  );

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Non-destructive: save position metadata, not a new blob
  const handleSave = useCallback(() => {
    onSave({ x: crop.x, y: crop.y, scale: zoom });
  }, [crop, zoom, onSave]);

  // No-op — we don't need pixel crop data anymore
  const noop = useCallback(() => {}, []);

  // cropSize fills the container exactly (cover); avatar uses 1:1 aspect
  const cropperSizeProps = cropSize
    ? { cropSize }
    : { aspect: 1 };

  const zoomPercent = Math.round(zoom * 100);

  const hintText =
    type === "avatar"
      ? "Drag to reposition · Pinch or scroll to zoom"
      : "Drag to reposition · Scroll to zoom";

  return (
    <div className={`photo-editor-inline ${type}`}>
      {/* ── Crop canvas ───────────────────────────────────────────────────── */}
      <div className={`photo-editor-crop-container ${type}`}>
        {/* Transient zoom badge — fades out automatically */}
        {showZoomBadge && (
          <div className="zoom-badge" aria-live="polite">
            {zoomPercent}%
          </div>
        )}

        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          {...cropperSizeProps}
          cropShape={type === "avatar" ? "round" : "rect"}
          showGrid={false}
          onCropChange={handleCropChange}
          onCropComplete={noop}
          onZoomChange={handleZoomChange}
          style={{
            containerStyle: { backgroundColor: "rgba(0, 0, 0, 0.35)" },
            cropAreaStyle: {
              border:
                type === "avatar"
                  ? "3px solid rgba(255, 255, 255, 0.9)"
                  : "2px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
            },
          }}
        />
      </div>

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div className="photo-editor-inline-controls">
        <span className="photo-editor-inline-hint-bar">{hintText}</span>

        {/* +/− zoom buttons */}
        <div className="photo-editor-inline-zoom">
          <button
            className="pe-zoom-btn"
            onClick={() => stepZoom(-0.15)}
            disabled={zoom <= 1}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="zoom-level">{zoomPercent}%</span>
          <button
            className="pe-zoom-btn"
            onClick={() => stepZoom(0.15)}
            disabled={zoom >= 3}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <div className="photo-editor-inline-buttons">
          <button onClick={handleReset} className="pe-btn pe-btn--secondary">
            Reset
          </button>
          <button onClick={onCancel} className="pe-btn pe-btn--secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="pe-btn pe-btn--primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

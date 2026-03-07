import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import "./PhotoRepositionFullscreen.css";

// Helper: load an image element from a URL
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });

// Helper: draw the cropped area onto a canvas and return a Blob
const getCroppedBlob = async (imageSrc, pixelCrop, outputSize) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Use outputSize if provided (e.g. 500×500 for avatar), otherwise use pixel crop dimensions
  const outW = outputSize?.width || pixelCrop.width;
  const outH = outputSize?.height || pixelCrop.height;
  canvas.width = outW;
  canvas.height = outH;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      "image/jpeg",
      0.92
    );
  });
};

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

  // Track if user uploaded a new image (to distinguish from server-cropped images)
  const [newImageFile, setNewImageFile] = useState(null);
  
  // Ref for file input to allow uploading new original image
  const fileInputRef = useRef(null);

  const [crop, setCrop] = useState(
    isLegacyDefault
      ? { x: 0, y: 0 }
      : { x: initialPosition.x || 0, y: initialPosition.y || 0 }
  );
  const [zoom, setZoom] = useState(initialPosition.scale || 1);
  const [saving, setSaving] = useState(false);

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

  // Handle new image upload - trigger file input click
  const handleUploadNew = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate it's an image
      if (!file.type.startsWith('image/')) {
        console.error('Selected file is not an image');
        return;
      }
      setNewImageFile(file);
    }
  }, []);

  // Capture croppedAreaPixels for destructive canvas crop on save
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const handleCropComplete = useCallback((_croppedArea, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  // Save the FULL original image - not the cropped version
  // The crop/zoom is only for preview; the original full quality image is always saved
  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      // If user uploaded a new file, use it directly
      if (newImageFile) {
        await onSave(newImageFile, type);
        return;
      }
      
      // Load the original image and convert to blob (full image, not cropped)
      const image = await createImage(imageUrl);
      
      // Create a canvas with the full original image dimensions
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Draw the FULL image (no cropping)
      ctx.drawImage(image, 0, 0);
      
      // Convert to blob - full quality JPEG
      const blob = await new Promise((resolve) => {
        canvas.toBlob(
          (b) => resolve(b),
          "image/jpeg",
          0.95 // Higher quality for full images
        );
      });
      
      await onSave(blob, type);
    } catch (err) {
      console.error("Save failed:", err);
      setSaving(false);
    }
  }, [saving, imageUrl, type, onSave, newImageFile]);

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
      {/* Hidden file input for new image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
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
          onCropComplete={handleCropComplete}
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
          <button onClick={handleUploadNew} className="pe-btn pe-btn--secondary">
            Upload New
          </button>
          <button onClick={handleReset} className="pe-btn pe-btn--secondary">
            Reset
          </button>
          <button onClick={onCancel} className="pe-btn pe-btn--secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="pe-btn pe-btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

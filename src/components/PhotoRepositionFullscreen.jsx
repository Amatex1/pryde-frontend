import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import "./PhotoRepositionFullscreen.css";
import { PHOTO_UPLOAD_HELP_TEXT, validatePhotoFile } from "../utils/photoValidation";

const revokeObjectUrlSafely = (url) => {
  if (url && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
};

const clampPercentage = (value, fallback = 50) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, value));
};

const roundPositionValue = (value) => Math.round(value * 100) / 100;

const buildPhotoPosition = ({ crop, zoom, croppedAreaPercentages, fallbackPosition = {} }) => {
  const bgXFromCrop = croppedAreaPercentages
    ? croppedAreaPercentages.x + (croppedAreaPercentages.width / 2)
    : fallbackPosition.bgX;
  const bgYFromCrop = croppedAreaPercentages
    ? croppedAreaPercentages.y + (croppedAreaPercentages.height / 2)
    : fallbackPosition.bgY;

  return {
    x: roundPositionValue(crop?.x ?? fallbackPosition.x ?? 0),
    y: roundPositionValue(crop?.y ?? fallbackPosition.y ?? 0),
    scale: roundPositionValue(zoom ?? fallbackPosition.scale ?? 1),
    bgX: roundPositionValue(clampPercentage(bgXFromCrop, 50)),
    bgY: roundPositionValue(clampPercentage(bgYFromCrop, 50)),
  };
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
  const [activeImageUrl, setActiveImageUrl] = useState(imageUrl);
  const [errorMessage, setErrorMessage] = useState("");

  // Ref for file input to allow uploading new original image
  const fileInputRef = useRef(null);
  const uploadedPreviewUrlRef = useRef(null);

  const [crop, setCrop] = useState(
    isLegacyDefault
      ? { x: 0, y: 0 }
      : { x: initialPosition.x || 0, y: initialPosition.y || 0 }
  );
  const [zoom, setZoom] = useState(initialPosition.scale || 1);
  const [croppedAreaPercentages, setCroppedAreaPercentages] = useState(null);
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

  useEffect(() => {
    if (uploadedPreviewUrlRef.current) {
      revokeObjectUrlSafely(uploadedPreviewUrlRef.current);
      uploadedPreviewUrlRef.current = null;
    }

    const nextIsLegacyDefault =
      initialPosition.x === 50 && initialPosition.y === 50;

    setNewImageFile(null);
    setActiveImageUrl(imageUrl);
    setErrorMessage("");
    setCrop(
      nextIsLegacyDefault
        ? { x: 0, y: 0 }
        : { x: initialPosition.x || 0, y: initialPosition.y || 0 }
    );
    setZoom(initialPosition.scale || 1);
    setCroppedAreaPercentages(null);
  }, [imageUrl, initialPosition.x, initialPosition.y, initialPosition.scale]);

  useEffect(() => () => {
    if (uploadedPreviewUrlRef.current) {
      revokeObjectUrlSafely(uploadedPreviewUrlRef.current);
      uploadedPreviewUrlRef.current = null;
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCropChange = useCallback((c) => setCrop(c), []);

  const handleCropComplete = useCallback((areaPercentages) => {
    setCroppedAreaPercentages(areaPercentages);
  }, []);

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
    setCroppedAreaPercentages(null);
    setErrorMessage("");
  }, []);

  // Handle new image upload - trigger file input click
  const handleUploadNew = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) {
      return;
    }

    const validationMessage = validatePhotoFile(file);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (uploadedPreviewUrlRef.current) {
      revokeObjectUrlSafely(uploadedPreviewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    uploadedPreviewUrlRef.current = nextPreviewUrl;

    setErrorMessage("");
    setNewImageFile(file);
    setActiveImageUrl(nextPreviewUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPercentages(null);
  }, []);

  // Save the FULL original image - not the cropped version
  // The crop/zoom is only for preview; the original full quality image is always saved
  const handleSave = useCallback(async () => {
    if (saving) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const position = buildPhotoPosition({
        crop,
        zoom,
        croppedAreaPercentages,
        fallbackPosition: initialPosition,
      });

      // If user uploaded a new file, use it directly
      if (newImageFile) {
        await onSave({ photo: newImageFile, type, position });
        return;
      }

      if (!activeImageUrl) {
        throw new Error("Please choose an image to continue.");
      }

      await onSave({ type, position });
    } catch (err) {
      console.error("Save failed:", err);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save photo. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }, [saving, activeImageUrl, crop, zoom, croppedAreaPercentages, initialPosition, type, onSave, newImageFile]);

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
        aria-label={`Upload a new ${type} photo`}
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
          image={activeImageUrl}
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
        <div className="photo-editor-inline-meta">
          <span className="photo-editor-inline-hint-bar">{hintText}</span>
          <span className="photo-editor-inline-file-help">{PHOTO_UPLOAD_HELP_TEXT}</span>
          {errorMessage && (
            <div className="photo-editor-inline-status photo-editor-inline-status--error" role="alert">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="photo-editor-inline-action-groups">
          <div className="photo-editor-inline-zoom-panel">
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

            <label className="photo-editor-inline-slider-wrap">
              <span className="sr-only">Zoom level</span>
              <input
                className="photo-editor-inline-slider"
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => handleZoomChange(Number(e.target.value))}
                aria-label="Zoom level"
              />
            </label>
          </div>

          <div className="photo-editor-inline-buttons">
            <button onClick={handleUploadNew} className="pe-btn pe-btn--secondary" type="button">
              Upload New
            </button>
            <button onClick={handleReset} className="pe-btn pe-btn--secondary" type="button">
              Reset
            </button>
            <button onClick={onCancel} className="pe-btn pe-btn--secondary" type="button">
              Cancel
            </button>
            <button onClick={handleSave} className="pe-btn pe-btn--primary" disabled={saving} type="button">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

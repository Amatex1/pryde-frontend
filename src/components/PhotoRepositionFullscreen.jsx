import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import "./PhotoRepositionFullscreen.css";

// Helper function to create an image from URL
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

// Helper function to get cropped image as blob
async function getCroppedImg(imageSrc, pixelCrop, format = "image/jpeg", quality = 0.9) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // Set canvas size to the crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped portion of the image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          resolve(null);
        }
      },
      format,
      quality
    );
  });
}

export default function PhotoRepositionInline({
  type, // "cover" | "avatar"
  imageUrl,
  initialPosition = { x: 0, y: 0, scale: 1 },
  onSave,
  onCancel
}) {
  // Convert position to crop area for react-easy-crop
  // The initial position represents how the image is offset/scaled
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Handle crop complete - store the cropped area in pixels
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle zoom slider change
  const handleZoomChange = useCallback((value) => {
    setZoom(value);
  }, []);

  // Handle crop change (when user drags)
  const handleCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Handle save - crop the image and return the blob
  const handleSave = useCallback(async () => {
    try {
      if (!croppedAreaPixels) {
        // If no crop area, try to get full image
        const blob = await getCroppedImg(imageUrl, {
          x: 0,
          y: 0,
          width: 800,
          height: type === "avatar" ? 800 : 400
        });
        if (blob) {
          onSave(blob);
        }
        return;
      }

      // Get the cropped image as a blob
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
      if (blob) {
        onSave(blob);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  }, [croppedAreaPixels, imageUrl, type, onSave]);

  // Calculate aspect ratio based on type
  // For avatar: square (1:1)
  // For cover: wider aspect (16:9 or similar)
  const aspectRatio = type === "avatar" ? 1 : 16 / 9;

  // Calculate container dimensions based on type
  const containerHeight = type === "avatar" ? "auto" : "100%";
  const containerMinHeight = type === "avatar" ? "200px" : "auto";

  // Zoom percentage for display
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className={`photo-editor-inline ${type}`}>
      {/* Crop area */}
      <div
        className={`photo-editor-crop-container ${type}`}
        style={{
          height: containerHeight,
          minHeight: containerMinHeight
        }}
      >
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          cropShape={type === "avatar" ? "round" : "rect"}
          showGrid={false}
          onCropChange={handleCropChange}
          onCropComplete={onCropComplete}
          onZoomChange={handleZoomChange}
          style={{
            containerStyle: {
              backgroundColor: "rgba(0, 0, 0, 0.3)"
            },
            cropAreaStyle: {
              border: type === "avatar" 
                ? "3px solid rgba(255, 255, 255, 0.9)" 
                : "2px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)"
            }
          }}
        />
      </div>

      {/* Controls bar */}
      <div className="photo-editor-inline-controls">
        {type === "avatar" && (
          <span className="photo-editor-inline-hint-bar">
            Drag to reposition • Pinch/scroll to zoom
          </span>
        )}
        <div className="photo-editor-inline-zoom">
          <span className="zoom-label">🔍 {zoomPercent}%</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="zoom-slider"
            aria-label="Zoom"
          />
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

/**
 * ImageCropEditor - Unified crop editor for avatar and cover photos
 * Uses react-easy-crop for drag, zoom, and pinch-to-zoom functionality
 * 
 * UX Decisions:
 * - Inline editor (no modal) for seamless experience
 * - Soft overlay with calm aesthetic matching Pryde design
 * - Touch-friendly controls for mobile
 * - Real-time preview during crop adjustments
 */
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import './ImageCropEditor.css';

// Helper to create cropped image blob from crop data
export const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

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

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

function ImageCropEditor({
  image,
  aspect = 1,
  cropShape = 'rect', // 'rect' for cover, 'round' for avatar
  onCropComplete,
  onCancel,
  showControls = true,
  minZoom = 1,
  maxZoom = 3
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = useCallback((location) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((z) => {
    setZoom(z);
  }, []);

  const onCropCompleteInternal = useCallback((croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete({
        blob: croppedBlob,
        cropData: {
          x: crop.x,
          y: crop.y,
          zoom,
          pixels: croppedAreaPixels
        }
      });
    } catch (error) {
      console.error('Error creating cropped image:', error);
    }
  }, [image, croppedAreaPixels, crop, zoom, onCropComplete]);

  if (!image) return null;

  return (
    <div className="image-crop-editor">
      <div className="crop-container">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteInternal}
          minZoom={minZoom}
          maxZoom={maxZoom}
          objectFit="contain"
          classes={{
            containerClassName: 'crop-area-container',
            mediaClassName: 'crop-media',
            cropAreaClassName: 'crop-area'
          }}
        />
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
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="crop-zoom-slider"
              aria-label="Zoom"
            />
            <span className="zoom-value">{zoom.toFixed(1)}x</span>
          </div>
          
          <div className="crop-actions">
            <button type="button" className="crop-btn cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="crop-btn save" onClick={handleSave}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageCropEditor;


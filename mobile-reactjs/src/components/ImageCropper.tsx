import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Set canvas size to a maximum of 400x400 for profile pictures
      const maxSize = 400;
      const scale = Math.min(maxSize / croppedAreaPixels.width, maxSize / croppedAreaPixels.height, 1);
      const targetWidth = croppedAreaPixels.width * scale;
      const targetHeight = croppedAreaPixels.height * scale;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw the cropped and resized image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // Convert to base64 with reduced quality for smaller file size
      const croppedImage = canvas.toDataURL('image/jpeg', 0.7);
      console.log('Cropped image size:', (croppedImage.length / 1024).toFixed(2), 'KB');
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.9)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        overflow: 'hidden',
      }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={setZoom}
          onCropComplete={onCropAreaComplete}
        />
      </div>
      
      <div style={{
        flexShrink: 0,
        padding: '16px 20px 20px',
        background: '#fff',
        maxHeight: '40vh',
        overflowY: 'auto',
      }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, marginBottom: 8, color: '#666' }}>
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              background: '#fff',
              color: '#666',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={createCroppedImage}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: '#000',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to create an image element from a source
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

export default ImageCropper;

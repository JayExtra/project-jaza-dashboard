import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import config from '../lib/config';
import { useAuth } from '../hooks/useAuth';


interface ProfileImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUpload: (imageUrl: string) => void;
  currentImageUrl?: string;
}

interface UploadResponse {
  imageUrl: string;
  thumbnailUrl: string;
}

export const ProfileImageUploadDialog = ({
  isOpen,
  onClose,
  onImageUpload,
  currentImageUrl
}: ProfileImageUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accessToken, user } = useAuth();
  
  // Pan offset: how much we've dragged the image from center (in canvas pixels)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  
  // Store scaled image dimensions
  const imgDimsRef = useRef({ width: 0, height: 0 });

  const CANVAS_SIZE = 400;
  const CROP_SIZE = 200;
  const CROP_RADIUS = CROP_SIZE / 2;
  const CROP_CENTER = CANVAS_SIZE / 2;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPEG, etc.)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPan({ x: 0, y: 0 }); // Reset pan on new image

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  // Calculate scale so image covers the crop circle (like object-fit: cover)
  const getCoverScale = (imgWidth: number, imgHeight: number) => {
    return Math.max(CROP_SIZE / imgWidth, CROP_SIZE / imgHeight);
  };

  // Clamp pan values so image always fills the circle
  const clampPan = (px: number, py: number, scaledW: number, scaledH: number) => {
    // The image must always cover the crop circle area
    // When pan=0, image is centered on canvas
    // Image draw position = center - (scaled/2) + pan
    // We need: drawX <= CROP_CENTER - CROP_RADIUS (left edge of circle)
    // AND: drawX + scaledW >= CROP_CENTER + CROP_RADIUS (right edge)
    
    const minPanX = (CROP_CENTER - CROP_RADIUS) - (CROP_CENTER - scaledW / 2);
    const maxPanX = (CROP_CENTER + CROP_RADIUS) - (CROP_CENTER + scaledW / 2);
    
    const minPanY = (CROP_CENTER - CROP_RADIUS) - (CROP_CENTER - scaledH / 2);
    const maxPanY = (CROP_CENTER + CROP_RADIUS) - (CROP_CENTER + scaledH / 2);

    return {
      x: Math.max(maxPanX, Math.min(minPanX, px)), // Note: min/max swapped because pan is negative to move right
      y: Math.max(maxPanY, Math.min(minPanY, py))
    };
  };

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !preview) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const scale = getCoverScale(img.width, img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      imgDimsRef.current = { width: scaledW, height: scaledH };

      // Clamp current pan
      const clamped = clampPan(pan.x, pan.y, scaledW, scaledH);
      if (clamped.x !== pan.x || clamped.y !== pan.y) {
        setPan(clamped);
      }

      // Clear
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw image centered on canvas, offset by pan
      const drawX = CROP_CENTER - scaledW / 2 + clamped.x;
      const drawY = CROP_CENTER - scaledH / 2 + clamped.y;
      ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

      // Draw dark overlay with circular hole
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.arc(CROP_CENTER, CROP_CENTER, CROP_RADIUS, 0, Math.PI * 2, true);
      ctx.fill();

      // Draw circle border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CROP_CENTER, CROP_CENTER, CROP_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    };
    img.src = preview;
  }, [preview, pan]);

  // Redraw when dependencies change
  useEffect(() => {
    if (!preview) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    draw();
  }, [preview, draw]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!preview) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !preview) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const dims = imgDimsRef.current;
    const newPan = clampPan(
      panStartRef.current.x + dx,
      panStartRef.current.y + dy,
      dims.width,
      dims.height
    );

    setPan(newPan);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!preview) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !preview) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;

    const dims = imgDimsRef.current;
    const newPan = clampPan(
      panStartRef.current.x + dx,
      panStartRef.current.y + dy,
      dims.width,
      dims.height
    );
    setPan(newPan);
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Upload: crop exactly what's in the circle
  const handleUpload = async () => {
    if (!selectedFile || !preview) {
      setError('Please select an image first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const outCanvas = document.createElement('canvas');
      outCanvas.width = CROP_SIZE;
      outCanvas.height = CROP_SIZE;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) {
        setError('Failed to process image');
        setIsUploading(false);
        return;
      }

      const img = new Image();
      img.onload = async () => {
        const scale = getCoverScale(img.width, img.height);
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        const clamped = clampPan(pan.x, pan.y, scaledW, scaledH);

        // Circular clip
        outCtx.beginPath();
        outCtx.arc(CROP_RADIUS, CROP_RADIUS, CROP_RADIUS, 0, Math.PI * 2);
        outCtx.clip();

        // Draw the portion of image that was under the crop circle
        // In preview: image drawn at (CENTER - scaled/2 + pan)
        // Crop circle center is at CROP_CENTER
        // We want the pixel at crop center to map to CROP_RADIUS in output
        const srcX = CROP_CENTER - scaledW / 2 + clamped.x;
        const srcY = CROP_CENTER - scaledH / 2 + clamped.y;
        
        // dest = src shifted so crop center becomes (RADIUS, RADIUS)
        const destX = srcX - (CROP_CENTER - CROP_RADIUS);
        const destY = srcY - (CROP_CENTER - CROP_RADIUS);

        outCtx.drawImage(img, destX, destY, scaledW, scaledH);

        outCanvas.toBlob(async (blob) => {
          if (!blob) {
            setError('Failed to process image');
            setIsUploading(false);
            return;
          }

          const formData = new FormData();
          formData.append('image', blob, 'profile-image.png');

          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setUploadProgress((e.loaded / e.total) * 100);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText) as UploadResponse;
                setSuccess(true);
                onImageUpload(response.imageUrl);
                setTimeout(() => handleClose(), 2000);
              } catch {
                setError('Failed to parse upload response');
                setIsUploading(false);
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                setError(errorData.message || errorData.error || 'Upload failed');
              } catch {
                setError('Upload failed. Please try again.');
              }
              setIsUploading(false);
            }
          });

          xhr.addEventListener('error', () => {
            setError('Network error during upload');
            setIsUploading(false);
          });

          xhr.open('POST', `${config.apiBaseUrl}/account/upload-picture`);
          if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
          xhr.send(formData);
        }, 'image/png');
      };
      img.src = preview;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-surface-lowest rounded-3xl shadow-lg max-w-lg w-full border border-border/10 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border/10">
            <h2 className="text-xl font-bold text-foreground">Change Profile Image</h2>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="p-2 hover:bg-surface-low rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-green-500">Image uploaded successfully!</p>
              </div>
            )}

            {!preview ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/30 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Upload size={32} className="mx-auto mb-3 text-foreground/50" />
                  <p className="font-semibold text-foreground mb-1">
                    Drop your image here or click to browse
                  </p>
                  <p className="text-xs text-foreground/60">
                    Supports PNG, JPEG (Max 2MB)
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-foreground/60 mb-3 block tracking-widest uppercase">
                    Crop Image — Click and drag to adjust
                  </label>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`w-full bg-surface-low rounded-xl border border-border/10 select-none ${
                      isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    style={{ touchAction: 'none' }}
                  />
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-foreground/60">Uploading...</p>
                      <p className="text-sm font-semibold text-foreground">
                        {Math.round(uploadProgress)}%
                      </p>
                    </div>
                    <div className="h-2 bg-surface-low rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 p-6 border-t border-border/10 bg-surface-low/30">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-low hover:bg-surface-low/75 text-foreground font-semibold text-sm transition-colors border border-border/10 disabled:opacity-50"
            >
              Cancel
            </button>
            {preview && (
              <button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
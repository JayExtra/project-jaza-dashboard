import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import config from '../lib/config';
import { authenticatedFetch } from '../lib/api';

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
  const [cropData, setCropData] = useState({ x: 0, y: 0 });

  const AVATAR_SIZE = 200;
  const CROP_CIRCLE_SIZE = 200;

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPEG, etc.)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const event = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  // Handle mouse movement on preview for crop adjustment
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!preview) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Draw preview with crop circle
    drawCropPreview(x - CROP_CIRCLE_SIZE / 2, y - CROP_CIRCLE_SIZE / 2);
  };

  const drawCropPreview = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !preview) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling
      const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Clamp crop position
      const clampedX = Math.max(0, Math.min(x, canvas.width - CROP_CIRCLE_SIZE));
      const clampedY = Math.max(0, Math.min(y, canvas.height - CROP_CIRCLE_SIZE));

      setCropData({ x: clampedX, y: clampedY });

      // Draw image
      ctx.drawImage(
        img,
        clampedX - (scaledWidth - AVATAR_SIZE) / 2,
        clampedY - (scaledHeight - AVATAR_SIZE) / 2,
        scaledWidth,
        scaledHeight
      );

      // Draw circle overlay
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        clampedX + CROP_CIRCLE_SIZE / 2,
        clampedY + CROP_CIRCLE_SIZE / 2,
        CROP_CIRCLE_SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Draw dark overlay outside circle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear the circle area
      ctx.clearRect(clampedX, clampedY, CROP_CIRCLE_SIZE, CROP_CIRCLE_SIZE);

      // Redraw image in circle area
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        clampedX + CROP_CIRCLE_SIZE / 2,
        clampedY + CROP_CIRCLE_SIZE / 2,
        CROP_CIRCLE_SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();
      ctx.drawImage(
        img,
        clampedX - (scaledWidth - AVATAR_SIZE) / 2,
        clampedY - (scaledHeight - AVATAR_SIZE) / 2,
        scaledWidth,
        scaledHeight
      );
      ctx.restore();
    };
    img.src = preview;
  };

  // Initialize canvas preview
  useEffect(() => {
    if (!preview) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    // Draw initial preview
    drawCropPreview(100, 100);
  }, [preview]);

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !preview) {
      setError('Please select an image first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create cropped image
      const canvas = canvasRef.current;
      if (!canvas) {
        setError('Failed to process image');
        setIsUploading(false);
        return;
      }

      // Get cropped canvas
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = CROP_CIRCLE_SIZE;
      croppedCanvas.height = CROP_CIRCLE_SIZE;
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) {
        setError('Failed to process image');
        setIsUploading(false);
        return;
      }

      // Draw circular image
      const img = new Image();
      img.onload = async () => {
        // Calculate scaling
        const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Create circular clipping path
        croppedCtx.beginPath();
        croppedCtx.arc(
          CROP_CIRCLE_SIZE / 2,
          CROP_CIRCLE_SIZE / 2,
          CROP_CIRCLE_SIZE / 2,
          0,
          Math.PI * 2
        );
        croppedCtx.clip();

        // Draw image
        croppedCtx.drawImage(
          img,
          cropData.x - (scaledWidth - AVATAR_SIZE) / 2,
          cropData.y - (scaledHeight - AVATAR_SIZE) / 2,
          scaledWidth,
          scaledHeight
        );

        // Convert to blob
        croppedCanvas.toBlob(async (blob) => {
          if (!blob) {
            setError('Failed to process image');
            setIsUploading(false);
            return;
          }

          try {
            // Create FormData
            const formData = new FormData();
            formData.append('image', blob, 'profile-image.png');

            // Upload with progress
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                setUploadProgress(percentComplete);
              }
            });

            xhr.addEventListener('load', async () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText) as UploadResponse;
                  setSuccess(true);
                  onImageUpload(response.imageUrl);

                  // Close dialog after 2 seconds
                  setTimeout(() => {
                    handleClose();
                  }, 2000);
                } catch (e) {
                  setError('Failed to parse upload response');
                  setIsUploading(false);
                }
              } else {
                try {
                  const errorData = JSON.parse(xhr.responseText);
                  setError(
                    errorData.message ||
                    errorData.error ||
                    'Upload failed. Please try again.'
                  );
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

            // Get token
            const token = localStorage.getItem('accessToken');
            xhr.open('POST', `${config.apiBaseUrl}/account/upload-picture`);
            if (token) {
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(formData);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            setIsUploading(false);
          }
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
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-surface-lowest rounded-3xl shadow-lg max-w-lg w-full border border-border/10 overflow-hidden">
          {/* Header */}
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

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-green-500">Image uploaded successfully!</p>
              </div>
            )}

            {!preview ? (
              <>
                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Drag & Drop Area */}
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
                {/* Image Crop Preview */}
                <div>
                  <label className="text-xs font-bold text-foreground/60 mb-3 block tracking-widest uppercase">
                    Crop Image - Click and drag to adjust
                  </label>
                  <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    className="w-full bg-surface-low rounded-xl cursor-crosshair border border-border/10"
                  />
                </div>

                {/* Upload Progress */}
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

          {/* Footer */}
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

import { ImageUploadSlot } from './ImageUploadSlot';

interface PhotosStepProps {
  coverImage: File | null;
  featureImages: [File | null, File | null, File | null];
  onCoverChange: (file: File | null) => void;
  onFeatureChange: (index: 0 | 1 | 2, file: File | null) => void;
}

export const PhotosStep = ({ coverImage, featureImages, onCoverChange, onFeatureChange }: PhotosStepProps) => {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">COVER IMAGE — REQUIRED</label>
      <ImageUploadSlot label="Drop your cover image" file={coverImage} onChange={onCoverChange} className="w-full h-[220px] mb-6" />

      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">FEATURE IMAGES — OPTIONAL</label>
      <div className="grid grid-cols-3 gap-3">
        <ImageUploadSlot label="Feature 1" file={featureImages[0]} onChange={(f) => onFeatureChange(0, f)} className="w-full h-[100px]" />
        <ImageUploadSlot label="Feature 2" file={featureImages[1]} onChange={(f) => onFeatureChange(1, f)} className="w-full h-[100px]" />
        <ImageUploadSlot label="Feature 3" file={featureImages[2]} onChange={(f) => onFeatureChange(2, f)} className="w-full h-[100px]" />
      </div>
    </div>
  );
};

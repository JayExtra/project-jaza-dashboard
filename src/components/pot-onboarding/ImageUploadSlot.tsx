import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { useObjectUrl } from '../../hooks/useObjectUrl';

interface ImageUploadSlotProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  className?: string;
}

export const ImageUploadSlot = ({ label, file, onChange, className = '' }: ImageUploadSlotProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useObjectUrl(file);

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (picked && picked.type.startsWith('image/')) {
      onChange(picked);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.key === ' ') e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer overflow-hidden transition-colors ${
        isDragging ? 'bg-primary/10 ring-2 ring-primary' : 'bg-surface-low hover:bg-surface-low/70'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {previewUrl ? (
        <img src={previewUrl} alt={label} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <ImagePlus size={20} className="text-foreground/40" />
          <span className="text-xs font-semibold text-foreground/50 text-center px-2">{label}</span>
        </>
      )}
    </div>
  );
};

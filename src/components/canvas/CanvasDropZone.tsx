import React, { useRef, useState } from 'react';
import { Upload, Sparkles, FolderUp } from 'lucide-react';

interface CanvasDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  isProcessing: boolean;
}

export const CanvasDropZone: React.FC<CanvasDropZoneProps> = ({
  onFilesSelected,
  onLoadSamples,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      const files = Array.from(e.dataTransfer.files) as File[];
      const validFiles = files.filter((file) => file.type.startsWith('image/'));
      if (validFiles.length > 0) onFilesSelected(validFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files) as File[];
      const validFiles = files.filter((file) => file.type.startsWith('image/'));
      if (validFiles.length > 0) onFilesSelected(validFiles);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`w-full h-full flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors ${
        isDragOver ? 'bg-blue-600/10 border-2 border-dashed border-blue-500' : 'bg-transparent hover:bg-zinc-900/30'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="max-w-md space-y-4 pointer-events-none">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shadow-xl">
          <Upload className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-zinc-100">Drop Studio Photos to Auto-Crop</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Supports high-res PNG, JPEG, WebP. On-device biometric head detection.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <FolderUp className="w-4 h-4" />
            Browse Files
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSamples();
            }}
            disabled={isProcessing}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            Load Sample Headshots
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, FolderUp } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((file: File) =>
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((file: File) =>
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`h-full min-h-[340px] flex flex-col items-center justify-center relative group border-2 border-dashed rounded-2xl p-6 lg:p-8 text-center transition-all cursor-pointer overflow-hidden ${
        isDragOver
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/80'
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

      <div className="max-w-md mx-auto space-y-4 pointer-events-none">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-200">
            Drop photos here to auto-crop by subject head
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Supports PNG, JPEG, WebP batch processing. 100% browser-side ML.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FolderUp className="w-4 h-4" />
            Browse Batch Photos
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSamples();
            }}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Load Sample Headshots
          </button>
        </div>
      </div>
    </div>
  );
};

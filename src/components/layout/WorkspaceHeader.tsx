import React from 'react';
import { Crop, Download, Sparkles, HelpCircle, LayoutGrid, Focus } from 'lucide-react';

interface WorkspaceHeaderProps {
  totalCount: number;
  croppedCount: number;
  viewMode: 'studio' | 'grid';
  isZipping: boolean;
  onToggleViewMode: () => void;
  onDownloadAllZip: () => void;
  onLoadSamples: () => void;
  onOpenShortcuts: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  totalCount,
  croppedCount,
  viewMode,
  isZipping,
  onToggleViewMode,
  onDownloadAllZip,
  onLoadSamples,
  onOpenShortcuts,
}) => {
  return (
    <header className="h-12 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Branding & Mode Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Crop className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-zinc-100 tracking-tight">Studio Pro Cropper</span>
        </div>

        <div className="w-px h-4 bg-zinc-800 mx-1" />

        {/* View Mode Toggle */}
        <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={onToggleViewMode}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'studio' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Focus className="w-3.5 h-3.5" />
            Studio Focus
          </button>
          <button
            onClick={onToggleViewMode}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Light Table ({totalCount})
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {totalCount === 0 && (
          <button
            onClick={onLoadSamples}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Try Samples
          </button>
        )}

        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {croppedCount > 0 && (
          <button
            onClick={onDownloadAllZip}
            disabled={isZipping}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {isZipping ? 'Exporting...' : `Export ZIP (${croppedCount})`}
          </button>
        )}
      </div>
    </header>
  );
};

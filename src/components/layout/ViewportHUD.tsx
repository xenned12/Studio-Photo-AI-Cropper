import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid3X3, Target, Sparkles, Columns, RotateCcw } from 'lucide-react';
import { GuidesVisibility, ViewportTransform } from '../../types';

interface ViewportHUDProps {
  transform: ViewportTransform;
  guides: GuidesVisibility;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onResetPan: () => void;
  onToggleGuide: (key: keyof GuidesVisibility) => void;
}

export const ViewportHUD: React.FC<ViewportHUDProps> = ({
  transform,
  guides,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onResetPan,
  onToggleGuide,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl px-2 py-1.5 shadow-2xl">
      {/* Zoom Controls */}
      <button
        onClick={onZoomOut}
        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Zoom Out (-)"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <span className="text-xs font-mono text-zinc-300 w-12 text-center">
        {Math.round(transform.scale * 100)}%
      </span>

      <button
        onClick={onZoomIn}
        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Zoom In (+)"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        onClick={onZoomFit}
        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Fit to Canvas (Z / F)"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <button
        onClick={onResetPan}
        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Reset Pan & Center"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-zinc-800 mx-1" />

      {/* Guide Toggles */}
      <button
        onClick={() => onToggleGuide('ruleOfThirds')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
          guides.ruleOfThirds ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Toggle Rule of Thirds [G]"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleGuide('biometricGuide')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
          guides.biometricGuide ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Toggle Biometric Eyeline Guide [E]"
      >
        <Target className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleGuide('goldenRatio')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
          guides.goldenRatio ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Toggle Golden Ratio [R]"
      >
        <Sparkles className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleGuide('beforeAfterSplit')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
          guides.beforeAfterSplit ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Toggle Before / After Split View [B]"
      >
        <Columns className="w-4 h-4" />
      </button>
    </div>
  );
};

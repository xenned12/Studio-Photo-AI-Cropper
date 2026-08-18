import React from 'react';
import { ExtendedCropSettings, ImageItem } from '../../types';
import { Sliders, RefreshCw, Palette, CheckCheck, FileImage } from 'lucide-react';

interface StudioInspectorProps {
  settings: ExtendedCropSettings;
  activeItem: ImageItem | null;
  isProcessing: boolean;
  onChange: (updated: ExtendedCropSettings) => void;
  onReDetectHead: () => void;
  onApplyToAll: () => void;
}

export const StudioInspector: React.FC<StudioInspectorProps> = ({
  settings,
  activeItem,
  isProcessing,
  onChange,
  onReDetectHead,
  onApplyToAll,
}) => {
  const bleedOptions = [
    { id: 'white', label: 'White', color: '#ffffff' },
    { id: 'gray', label: 'Studio Gray', color: '#1e1e24' },
    { id: 'charcoal', label: 'Charcoal', color: '#0f0f12' },
    { id: 'transparent', label: 'Alpha', color: 'transparent' },
  ] as const;

  return (
    <aside className="w-72 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col justify-between overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Section 1: Subject Framing & Headroom */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Framing & Headroom
            </span>

            {activeItem && (
              <button
                onClick={onReDetectHead}
                disabled={isProcessing}
                className="text-[10px] text-zinc-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                title="Re-run ML face detector"
              >
                <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                Re-Detect
              </button>
            )}
          </div>

          {/* Headroom Margin */}
          <div className="space-y-1 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Headroom Margin</span>
              <span className="font-mono text-blue-400">{settings.headroomPercent}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              value={settings.headroomPercent}
              onChange={(e) => onChange({ ...settings, headroomPercent: parseInt(e.target.value) })}
              className="w-full accent-blue-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Subject Frame Scale */}
          <div className="space-y-1 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Subject Scale</span>
              <span className="font-mono text-blue-400">{settings.scaleFactor.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="10.0"
              step="0.1"
              value={settings.scaleFactor}
              onChange={(e) => onChange({ ...settings, scaleFactor: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Section 2: Canvas Bleed & Background Matting */}
        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            Canvas Extended Bleed
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            {bleedOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ ...settings, bleedFillMode: opt.id })}
                className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 border transition-colors ${
                  settings.bleedFillMode === opt.id
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full border border-zinc-700 shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
                <span className="text-[11px] truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Export Pipeline */}
        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <FileImage className="w-3.5 h-3.5 text-blue-400" />
            Export Pipeline
          </span>

          {/* Format & Quality */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">Format</span>
              <div className="flex bg-zinc-900 p-0.5 rounded border border-zinc-800">
                {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => onChange({ ...settings, exportFormat: fmt })}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      settings.exportFormat === fmt ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {fmt.split('/')[1].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">Max Edge</span>
              <select
                value={settings.exportMaxDimension}
                onChange={(e) => onChange({ ...settings, exportMaxDimension: parseInt(e.target.value) })}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-[11px] font-mono focus:outline-none"
              >
                <option value={0}>Original (Sensor 1:1)</option>
                <option value={3840}>3840px (4K Ultra HD)</option>
                <option value={2048}>2048px (Web Pro)</option>
                <option value={1080}>1080px (Full HD)</option>
                <option value={800}>800px (Compact)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Apply to All Batch */}
        <div className="pt-2">
          <button
            onClick={onApplyToAll}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-blue-400" />
            Apply Settings to All Photos
          </button>
        </div>
      </div>
    </aside>
  );
};

import React from 'react';
import { ArrowLeftRight, Sliders, Settings2, Image as ImageIcon } from 'lucide-react';
import { AspectRatioType, CropSettings } from '../types';
import { ASPECT_RATIOS } from '../utils/cropMath';

interface RatioSelectorProps {
  settings: CropSettings;
  onChange: (updated: CropSettings) => void;
  disabled?: boolean;
}

export const RatioSelector: React.FC<RatioSelectorProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  const handleSelectRatio = (ratioId: AspectRatioType) => {
    onChange({
      ...settings,
      ratioType: ratioId,
    });
  };

  const handleToggleSwap = () => {
    onChange({
      ...settings,
      isSwapped: !settings.isSwapped,
    });
  };

  const handleCustomWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 100;
    onChange({ ...settings, customWidth: val });
  };

  const handleCustomHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 100;
    onChange({ ...settings, customHeight: val });
  };

  return (
    <div className="h-full flex flex-col justify-between bg-slate-900/60 border border-slate-800 rounded-2xl p-4 lg:p-6 space-y-6">
      {/* Aspect Ratio Header & Swap Button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            Crop Aspect Ratio
          </label>

          {/* Master Interchangeable Swap Button */}
          <button
            onClick={handleToggleSwap}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 cursor-pointer ${
              settings.isSwapped
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
            title="Swap width and height orientation (Portrait ↔ Landscape)"
          >
            <ArrowLeftRight
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                settings.isSwapped ? 'rotate-180 text-blue-400' : ''
              }`}
            />
            <span>{settings.isSwapped ? 'Swapped (Horizontal)' : 'Standard (Vertical)'}</span>
          </button>
        </div>

        {/* Ratio Preset Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = settings.ratioType === ratio.id;

            // Compute current displayed text considering swap
            let displayLabel = ratio.label;
            if (ratio.id !== 'custom') {
              displayLabel = settings.isSwapped
                ? `${ratio.height}:${ratio.width}`
                : `${ratio.width}:${ratio.height}`;
            }

            return (
              <button
                key={ratio.id}
                onClick={() => handleSelectRatio(ratio.id)}
                disabled={disabled}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="text-sm font-bold tracking-tight">{displayLabel}</span>
                <span className="text-[10px] opacity-80 capitalize">
                  {ratio.id === 'custom'
                    ? 'User Size'
                    : settings.isSwapped
                    ? 'Landscape'
                    : 'Portrait'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Input Fields if Custom ratio is chosen */}
        {settings.ratioType === 'custom' && (
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex-1 space-y-1">
              <span className="text-slate-400 text-[10px]">
                {settings.isSwapped ? 'Height Ratio' : 'Width Ratio'}
              </span>
              <input
                type="number"
                min="1"
                value={settings.isSwapped ? settings.customHeight : settings.customWidth}
                onChange={settings.isSwapped ? handleCustomHeightChange : handleCustomWidthChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-center focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleToggleSwap}
              className="mt-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
              title="Swap Custom Width & Height"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1 space-y-1">
              <span className="text-slate-400 text-[10px]">
                {settings.isSwapped ? 'Width Ratio' : 'Height Ratio'}
              </span>
              <input
                type="number"
                min="1"
                value={settings.isSwapped ? settings.customWidth : settings.customHeight}
                onChange={settings.isSwapped ? handleCustomWidthChange : handleCustomHeightChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-center focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Headroom & Framing Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
        {/* Headroom Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300 flex items-center gap-1">
              Headroom Padding
            </span>
            <span className="text-blue-400 font-mono">{settings.headroomPercent}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="45"
            step="1"
            value={settings.headroomPercent}
            onChange={(e) =>
              onChange({ ...settings, headroomPercent: parseInt(e.target.value) })
            }
            className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] text-slate-500">
            Distance from top edge of crop box to subject hair/head.
          </p>
        </div>

        {/* Frame Zoom / Scale Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300 flex items-center gap-1">
              Subject Frame Scale
            </span>
            <span className="text-blue-400 font-mono">{settings.scaleFactor.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.2"
            max="10.0"
            step="0.1"
            value={settings.scaleFactor}
            onChange={(e) =>
              onChange({ ...settings, scaleFactor: parseFloat(e.target.value) })
            }
            className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] text-slate-500">
            Multiplier for outer crop context (tight headshot vs upper torso).
          </p>
        </div>
      </div>

      {/* Advanced Export Settings (Format & Quality) */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            Format:
          </span>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['image/jpeg', 'image/png', 'image/webp'] as const).map((fmt) => {
              const label = fmt.split('/')[1].toUpperCase();
              return (
                <button
                  key={fmt}
                  onClick={() => onChange({ ...settings, exportFormat: fmt })}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    settings.exportFormat === fmt
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Max Edge:</span>
          <select
            value={settings.exportMaxDimension}
            onChange={(e) =>
              onChange({ ...settings, exportMaxDimension: parseInt(e.target.value) })
            }
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value={0}>Original Scale</option>
            <option value={2048}>2048px (Ultra HD)</option>
            <option value={1080}>1080px (FHD / Web)</option>
            <option value={800}>800px (Medium)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ExtendedCropSettings } from '../../types';
import { STUDIO_PRESETS } from '../../utils/presetLibrary';
import { ArrowLeftRight, Sliders, ShieldCheck, Camera, Share2, Sparkles } from 'lucide-react';

interface PresetSidebarProps {
  settings: ExtendedCropSettings;
  onChange: (updated: ExtendedCropSettings) => void;
  disabled?: boolean;
}

export const PresetSidebar: React.FC<PresetSidebarProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  const handleSelectPreset = (id: string) => {
    onChange({ ...settings, ratioId: id });
  };

  const handleToggleSwap = () => {
    onChange({ ...settings, isSwapped: !settings.isSwapped });
  };

  const categories = [
    { id: 'biometric', label: 'Biometric & Passports', icon: ShieldCheck },
    { id: 'studio', label: 'Studio & Portraits', icon: Camera },
    { id: 'social', label: 'Digital & Social Media', icon: Share2 },
  ] as const;

  return (
    <aside className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Header & Orientation Swap */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            Aspect Ratios
          </span>

          <button
            onClick={handleToggleSwap}
            disabled={disabled}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
              settings.isSwapped
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Swap width and height orientation (Portrait ↔ Landscape)"
          >
            <ArrowLeftRight className="w-3 h-3" />
            {settings.isSwapped ? 'Landscape' : 'Portrait'}
          </button>
        </div>

        {/* Categorized Presets */}
        {categories.map((cat) => {
          const presets = STUDIO_PRESETS.filter((p) => p.category === cat.id);
          const Icon = cat.icon;

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {cat.label}
              </div>

              <div className="grid grid-cols-1 gap-1">
                {presets.map((p) => {
                  const isSelected = settings.ratioId === p.id;
                  const displayRatio = settings.isSwapped ? `${p.height}:${p.width}` : `${p.width}:${p.height}`;

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id)}
                      disabled={disabled}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between border ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500/50 text-blue-200 shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-[11px] truncate">{p.label}</p>
                        <p className="text-[9px] text-zinc-500">{p.description}</p>
                      </div>

                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-zinc-950/80 rounded border border-zinc-800/80 text-zinc-400 shrink-0">
                        {displayRatio}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Custom Ratio Block */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <button
            onClick={() => handleSelectPreset('custom')}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between border ${
              settings.ratioId === 'custom'
                ? 'bg-blue-600/15 border-blue-500/50 text-blue-200 shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Custom Dimensions
            </div>
            <span className="font-mono text-[10px] text-zinc-500">Free/Fixed</span>
          </button>

          {settings.ratioId === 'custom' && (
            <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">
                  {settings.isSwapped ? 'Height' : 'Width'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.isSwapped ? settings.customHeight : settings.customWidth}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 100;
                    onChange(
                      settings.isSwapped
                        ? { ...settings, customHeight: val }
                        : { ...settings, customWidth: val }
                    );
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 font-mono text-center text-zinc-200 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">
                  {settings.isSwapped ? 'Width' : 'Height'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.isSwapped ? settings.customWidth : settings.customHeight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 100;
                    onChange(
                      settings.isSwapped
                        ? { ...settings, customWidth: val }
                        : { ...settings, customHeight: val }
                    );
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 font-mono text-center text-zinc-200 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

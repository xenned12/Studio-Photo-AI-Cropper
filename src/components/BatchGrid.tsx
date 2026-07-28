import React from 'react';
import { ImageItem, CropSettings } from '../types';
import { Sliders, Download, Trash2, Eye, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BatchGridProps {
  items: ImageItem[];
  settings: CropSettings;
  onEditItem: (item: ImageItem) => void;
  onDeleteItem: (id: string) => void;
  onDownloadItem: (item: ImageItem) => void;
}

export const BatchGrid: React.FC<BatchGridProps> = ({
  items,
  settings,
  onEditItem,
  onDeleteItem,
  onDownloadItem,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Batch Queue ({items.length} {items.length === 1 ? 'photo' : 'photos'})
        </h2>
        <span className="text-xs text-slate-400">
          Ratio: <strong className="text-blue-400">{settings.isSwapped ? `${settings.ratioType} (Swapped)` : settings.ratioType}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const activeHead = item.manualHead || item.detectedHead;

          return (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              {/* Image Thumbnail Container with Crop Frame */}
              <div className="relative aspect-square bg-slate-950 overflow-hidden flex items-center justify-center p-3">
                <div className="relative max-w-full max-h-full border-2 border-slate-700/80 group-hover:border-blue-500/80 rounded-lg shadow-lg overflow-hidden flex items-center justify-center bg-[conic-gradient(#1e293b_90deg,#0f172a_90deg_180deg,#1e293b_180deg_270deg,#0f172a_270deg)] [background-size:12px_12px] transition-colors">
                  <img
                    src={item.croppedUrl || item.originalUrl}
                    alt={item.name}
                    className="max-w-full max-h-full object-contain"
                  />
                  {/* Canvas Frame Overlay Border */}
                  <div className="absolute inset-0 border border-blue-400/30 pointer-events-none rounded-sm" />
                </div>

                {/* Processing Overlay Loader */}
                {item.status === 'detecting' && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-blue-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">Detecting Head...</span>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {item.status === 'cropped' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md">
                      <CheckCircle2 className="w-3 h-3" />
                      Auto-Trimmed
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md">
                      <AlertCircle className="w-3 h-3" />
                      Error
                    </span>
                  )}
                  {activeHead && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-mono backdrop-blur-md">
                      {activeHead.source === 'mediapipe' ? 'ML Head' : 'Saliency Head'}
                    </span>
                  )}
                </div>

                {/* Hover Quick Action Buttons */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEditItem(item)}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
                    title="Fine-tune crop box"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>

                  {item.croppedUrl && (
                    <button
                      onClick={() => onDownloadItem(item)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
                      title="Download trimmed photo"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Photo Meta Footer */}
              <div className="p-3 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <p className="font-medium text-slate-200 truncate text-[11px]" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {item.dimensions.width}×{item.dimensions.height} px
                  </p>
                </div>

                <button
                  onClick={() => onEditItem(item)}
                  className="text-slate-400 hover:text-blue-400 transition-colors p-1 cursor-pointer"
                  title="Preview / Edit"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

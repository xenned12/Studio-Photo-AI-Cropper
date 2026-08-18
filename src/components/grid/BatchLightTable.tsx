import React from 'react';
import { ImageItem } from '../../types';
import { Download, Trash2, Sliders, Loader2 } from 'lucide-react';

interface BatchLightTableProps {
  items: ImageItem[];
  onSelectAndEdit: (item: ImageItem) => void;
  onDeleteItem: (id: string) => void;
  onDownloadItem: (item: ImageItem) => void;
}

export const BatchLightTable: React.FC<BatchLightTableProps> = ({
  items,
  onSelectAndEdit,
  onDeleteItem,
  onDownloadItem,
}) => {
  return (
    <div className="flex-1 h-full w-full bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Batch Light Table ({items.length} Photos)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div
                onClick={() => onSelectAndEdit(item)}
                className="relative aspect-square bg-zinc-950 p-2 flex items-center justify-center cursor-pointer"
              >
                <img
                  src={item.croppedUrl || item.originalUrl}
                  alt={item.name}
                  className="max-w-full max-h-full object-contain rounded"
                />

                {item.status === 'detecting' && (
                  <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center gap-1.5 text-xs text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Detecting...
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <p className="font-medium text-[11px] text-zinc-200 truncate">{item.name}</p>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {item.dimensions.width}×{item.dimensions.height} px
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectAndEdit(item)}
                    className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition-colors"
                    title="Open in Studio"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  {item.croppedUrl && (
                    <button
                      onClick={() => onDownloadItem(item)}
                      className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

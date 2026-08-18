import React from 'react';
import { ImageItem } from '../../types';
import { Download, Trash2, CheckCircle2, AlertCircle, Loader2, Plus, Sparkles, RefreshCw } from 'lucide-react';

interface FilmstripQueueProps {
  items: ImageItem[];
  activeItemId: string | null;
  isProcessing: boolean;
  onSelectItem: (item: ImageItem) => void;
  onDeleteItem: (id: string) => void;
  onDownloadItem: (item: ImageItem) => void;
  onAddFiles: (files: File[]) => void;
  onLoadSamples: () => void;
  onClearQueue: () => void;
}

export const FilmstripQueue: React.FC<FilmstripQueueProps> = ({
  items,
  activeItemId,
  isProcessing,
  onSelectItem,
  onDeleteItem,
  onDownloadItem,
  onAddFiles,
  onLoadSamples,
  onClearQueue,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <footer className="h-24 bg-zinc-950 border-t border-zinc-800 px-4 flex items-center gap-3 overflow-x-auto select-none shrink-0">
      {/* Import & Actions Drop Button */}
      <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-3 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.length) {
              const files = Array.from(e.target.files).filter((f: File) => f.type.startsWith('image/'));
              onAddFiles(files);
            }
          }}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Import additional photos"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>

        {items.length === 0 && (
          <button
            onClick={onLoadSamples}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
            title="Load sample photos"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Samples
          </button>
        )}

        {items.length > 0 && (
          <button
            onClick={onClearQueue}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
            title="Clear all queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filmstrip Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {items.map((item) => {
          const isActive = item.id === activeItemId;

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`relative h-18 w-20 rounded-lg overflow-hidden border cursor-pointer shrink-0 transition-all group ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/40'
                  : 'border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={item.croppedUrl || item.originalUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />

              {/* Status Badge */}
              <div className="absolute top-1 left-1">
                {item.status === 'detecting' && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
                {item.status === 'cropped' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {item.status === 'error' && <AlertCircle className="w-3 h-3 text-rose-400" />}
              </div>

              {/* Hover Quick Actions */}
              <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {item.croppedUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadItem(item);
                    }}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                    title="Download trimmed image"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded"
                  title="Remove from batch"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
};

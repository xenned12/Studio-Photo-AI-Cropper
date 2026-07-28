import React from 'react';
import { Crop, ShieldCheck, Download, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  croppedCount: number;
  onDownloadAllZip: () => void;
  onResetAll: () => void;
  onLoadSamples: () => void;
  isProcessing: boolean;
  isZipping: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  croppedCount,
  onDownloadAllZip,
  onResetAll,
  onLoadSamples,
  isProcessing,
  isZipping,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Crop className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">Subject Crop</h1>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                On-Device ML
              </span>
            </div>
            <p className="text-xs text-slate-400">Automatic subject head-detection & photo trimmer</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {totalCount === 0 ? (
            <button
              onClick={onLoadSamples}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Load demo headshots for testing"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Try Demo Photos
            </button>
          ) : (
            <>
              <button
                onClick={onResetAll}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Clear queue"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear ({totalCount})
              </button>

              <button
                onClick={onDownloadAllZip}
                disabled={croppedCount === 0 || isZipping}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-all flex items-center gap-1.5 shadow-md ${
                  croppedCount > 0 && !isZipping
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-indigo-500/25 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                {isZipping ? 'Zipping...' : `Download All ZIP (${croppedCount})`}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

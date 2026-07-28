import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-100">Install Subject Crop PWA</h4>
          <p className="text-[10px] text-slate-400">Use offline for fast, private batch photo processing.</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>

        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

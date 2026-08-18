import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'G', desc: 'Toggle Rule of Thirds Guide' },
    { key: 'E', desc: 'Toggle Biometric Passport / Eyeline Guide' },
    { key: 'R', desc: 'Toggle Golden Ratio Overlay' },
    { key: 'B', desc: 'Toggle Before / After Split View' },
    { key: 'Z / F', desc: 'Fit Canvas to Screen' },
    { key: 'Space + Drag', desc: 'Pan Canvas' },
    { key: 'Ctrl/Cmd + Wheel', desc: 'Zoom Viewport' },
    { key: '← / →', desc: 'Previous / Next Photo in Filmstrip' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-zinc-100">Studio Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/60 last:border-none">
              <span className="text-zinc-300">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-700 rounded font-mono text-[11px] text-zinc-400">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

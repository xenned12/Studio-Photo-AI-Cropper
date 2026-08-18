import React, { useState, useRef, useCallback } from 'react';
import { Columns } from 'lucide-react';

interface BeforeAfterSplitProps {
  originalUrl: string;
  croppedUrl: string;
  className?: string;
}

export const BeforeAfterSplit: React.FC<BeforeAfterSplitProps> = ({
  originalUrl,
  croppedUrl,
  className = '',
}) => {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className={`relative w-full h-full select-none overflow-hidden ${className}`}
    >
      {/* Background Layer: Original Full Image */}
      <img
        src={originalUrl}
        alt="Original Uncropped"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-60 filter grayscale-30"
      />

      {/* Foreground Layer: Cropped Output */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
      >
        <img
          src={croppedUrl}
          alt="Cropped Result"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none shadow-2xl"
        />
      </div>

      {/* Divider Bar & Grab Handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="absolute top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize flex items-center justify-center -translate-x-1/2 z-20 hover:w-1.5 transition-all shadow-[0_0_12px_rgba(59,130,246,0.8)]"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="w-7 h-7 rounded-full bg-zinc-900 border-2 border-blue-400 flex items-center justify-center text-blue-400 shadow-lg">
          <Columns className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-zinc-950/80 backdrop-blur-md rounded text-[10px] font-mono text-zinc-400 border border-zinc-800 pointer-events-none">
        Original (Left)
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 bg-blue-950/80 backdrop-blur-md rounded text-[10px] font-mono text-blue-300 border border-blue-800 pointer-events-none">
        Framed Crop (Right)
      </div>
    </div>
  );
};

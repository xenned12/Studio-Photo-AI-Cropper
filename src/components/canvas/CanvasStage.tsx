import React, { useRef, useState } from 'react';
import { ImageItem, ExtendedCropSettings, GuidesVisibility, ViewportTransform, CropRect, DetectedHead } from '../../types';
import { getEffectiveAspectRatio } from '../../utils/presetLibrary';
import { CropBoundingBox } from './CropBoundingBox';
import { BeforeAfterSplit } from './BeforeAfterSplit';
import { ViewportHUD } from '../layout/ViewportHUD';
import { CanvasDropZone } from './CanvasDropZone';

interface CanvasStageProps {
  activeItem: ImageItem | null;
  settings: ExtendedCropSettings;
  guides: GuidesVisibility;
  isProcessing: boolean;
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  onCropRectChange: (rect: CropRect) => void;
  onHeadAnchorChange: (head: DetectedHead) => void;
  onToggleGuide: (key: keyof GuidesVisibility) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  activeItem,
  settings,
  guides,
  isProcessing,
  onFilesSelected,
  onLoadSamples,
  onCropRectChange,
  onHeadAnchorChange,
  onToggleGuide,
}) => {
  const [transform, setTransform] = useState<ViewportTransform>({ scale: 1, x: 0, y: 0 });
  const isPanning = useRef(false);
  const startPanPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const targetRatio = getEffectiveAspectRatio(settings);
  const activeHead = activeItem?.manualHead || activeItem?.detectedHead || null;

  // Zoom handlers
  const handleZoomIn = () => setTransform((t) => ({ ...t, scale: Math.min(4.0, t.scale * 1.2) }));
  const handleZoomOut = () => setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale / 1.2) }));
  const handleZoomFit = () => setTransform({ scale: 1, x: 0, y: 0 });
  const handleResetPan = () => setTransform((t) => ({ ...t, x: 0, y: 0 }));

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform((t) => ({
        ...t,
        scale: Math.max(0.2, Math.min(4.0, t.scale * delta)),
      }));
    }
  };

  // Pan canvas (Middle Click or Alt/Option Drag)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.altKey) {
      isPanning.current = true;
      startPanPos.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning.current) {
      setTransform((t) => ({
        ...t,
        x: e.clientX - startPanPos.current.x,
        y: e.clientY - startPanPos.current.y,
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative flex-1 h-full w-full bg-zinc-950 checkerboard-pattern overflow-hidden flex items-center justify-center select-none"
    >
      {!activeItem ? (
        <CanvasDropZone
          onFilesSelected={onFilesSelected}
          onLoadSamples={onLoadSamples}
          isProcessing={isProcessing}
        />
      ) : guides.beforeAfterSplit && activeItem.croppedUrl ? (
        <BeforeAfterSplit
          originalUrl={activeItem.originalUrl}
          croppedUrl={activeItem.croppedUrl}
          className="max-w-[90%] max-h-[90%]"
        />
      ) : (
        <div
          className="relative transition-transform duration-75 flex items-center justify-center p-8"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {/* Main Image Layer */}
          <div className="relative max-w-[85vw] max-h-[75vh] shadow-2xl bg-zinc-900 border border-zinc-800">
            <img
              src={activeItem.originalUrl}
              alt={activeItem.name}
              className="max-w-full max-h-[75vh] object-contain block pointer-events-none"
            />

            {/* Interactive Crop Bounding Box */}
            {activeItem.cropRect && (
              <CropBoundingBox
                cropRect={activeItem.cropRect}
                imageDimensions={activeItem.dimensions}
                targetRatio={targetRatio}
                activeHead={activeHead}
                guides={guides}
                isBiometricPreset={settings.ratioId.includes('passport') || settings.ratioId.includes('visa')}
                onCropRectChange={onCropRectChange}
                onHeadAnchorChange={onHeadAnchorChange}
              />
            )}
          </div>
        </div>
      )}

      {/* Floating HUD controls */}
      {activeItem && (
        <ViewportHUD
          transform={transform}
          guides={guides}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleZoomFit}
          onResetPan={handleResetPan}
          onToggleGuide={onToggleGuide}
        />
      )}
    </div>
  );
};

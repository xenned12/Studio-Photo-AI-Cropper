import React, { useRef } from 'react';
import { CropRect, DetectedHead, GuidesVisibility } from '../../types';
import { calculateHandleResize, ResizeHandlePosition } from '../../utils/cropMath';
import { CompositionGuides } from './CompositionGuides';
import { Target, Move } from 'lucide-react';

interface CropBoundingBoxProps {
  cropRect: CropRect;
  imageDimensions: { width: number; height: number };
  targetRatio: number;
  activeHead: DetectedHead | null;
  guides: GuidesVisibility;
  isBiometricPreset?: boolean;
  onCropRectChange: (rect: CropRect) => void;
  onHeadAnchorChange: (head: DetectedHead) => void;
}

export const CropBoundingBox: React.FC<CropBoundingBoxProps> = ({
  cropRect,
  imageDimensions,
  targetRatio,
  activeHead,
  guides,
  isBiometricPreset,
  onCropRectChange,
  onHeadAnchorChange,
}) => {
  const isDraggingMove = useRef(false);
  const isDraggingHandle = useRef<ResizeHandlePosition | null>(null);
  const isDraggingAnchor = useRef(false);
  const startPointerPos = useRef({ x: 0, y: 0 });
  const startRect = useRef<CropRect>(cropRect);
  const startHeadPos = useRef({ x: 0, y: 0 });

  if (imageDimensions.width === 0 || imageDimensions.height === 0) return null;

  // Percentage styles
  const leftPercent = (cropRect.x / imageDimensions.width) * 100;
  const topPercent = (cropRect.y / imageDimensions.height) * 100;
  const widthPercent = (cropRect.width / imageDimensions.width) * 100;
  const heightPercent = (cropRect.height / imageDimensions.height) * 100;

  // Move Crop Box
  const handleMovePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingMove.current = true;
    startPointerPos.current = { x: e.clientX, y: e.clientY };
    startRect.current = cropRect;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Resize Handle
  const handleResizePointerDown = (handle: ResizeHandlePosition, e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingHandle.current = handle;
    startPointerPos.current = { x: e.clientX, y: e.clientY };
    startRect.current = cropRect;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Drag Head Anchor Reticle
  const handleAnchorPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!activeHead) return;
    isDraggingAnchor.current = true;
    startPointerPos.current = { x: e.clientX, y: e.clientY };
    startHeadPos.current = { x: activeHead.x, y: activeHead.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Image coordinate scaling factor
    const container = (e.currentTarget as HTMLElement).parentElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const scaleX = imageDimensions.width / containerRect.width;
    const scaleY = imageDimensions.height / containerRect.height;

    const deltaX = (e.clientX - startPointerPos.current.x) * scaleX;
    const deltaY = (e.clientY - startPointerPos.current.y) * scaleY;

    if (isDraggingMove.current) {
      onCropRectChange({
        ...startRect.current,
        x: Math.round(startRect.current.x + deltaX),
        y: Math.round(startRect.current.y + deltaY),
      });
    } else if (isDraggingHandle.current) {
      const resized = calculateHandleResize(
        startRect.current,
        isDraggingHandle.current,
        deltaX,
        deltaY,
        targetRatio
      );
      onCropRectChange(resized);
    } else if (isDraggingAnchor.current && activeHead) {
      const normDeltaX = deltaX / imageDimensions.width;
      const normDeltaY = deltaY / imageDimensions.height;
      onHeadAnchorChange({
        ...activeHead,
        x: Math.max(0, Math.min(1 - activeHead.width, startHeadPos.current.x + normDeltaX)),
        y: Math.max(0, Math.min(1 - activeHead.height, startHeadPos.current.y + normDeltaY)),
        source: 'manual',
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingMove.current = false;
    isDraggingHandle.current = null;
    isDraggingAnchor.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handles: { pos: ResizeHandlePosition; cursor: string; className: string }[] = [
    { pos: 'nw', cursor: 'nwse-resize', className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2' },
    { pos: 'n', cursor: 'ns-resize', className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
    { pos: 'ne', cursor: 'nesw-resize', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2' },
    { pos: 'e', cursor: 'ew-resize', className: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
    { pos: 'se', cursor: 'nwse-resize', className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2' },
    { pos: 's', cursor: 'ns-resize', className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
    { pos: 'sw', cursor: 'nesw-resize', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' },
    { pos: 'w', cursor: 'ew-resize', className: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' },
  ];

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 pointer-events-none select-none z-10"
    >
      {/* The Active Crop Window */}
      <div
        className="absolute border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(9,9,11,0.72)] transition-colors pointer-events-auto"
        style={{
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
        }}
      >
        {/* Inner Move Drag Area */}
        <div
          onPointerDown={handleMovePointerDown}
          className="absolute inset-0 cursor-move bg-blue-500/5 hover:bg-blue-500/10 transition-colors flex items-center justify-center group"
          title="Drag to reposition crop box"
        >
          <Move className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors pointer-events-none" />
        </div>

        {/* Live Composition Guides */}
        <CompositionGuides guides={guides} isBiometricPreset={isBiometricPreset} />

        {/* 8 Resize Handles */}
        {handles.map((h) => (
          <div
            key={h.pos}
            onPointerDown={(e) => handleResizePointerDown(h.pos, e)}
            className={`absolute w-3.5 h-3.5 bg-zinc-950 border-2 border-blue-400 rounded-xs shadow-md z-30 hover:scale-125 transition-transform ${h.className}`}
            style={{ cursor: h.cursor }}
          />
        ))}

        {/* Dimension & Coordinates HUD Pill */}
        <div className="absolute -top-7 left-0 px-2 py-0.5 bg-zinc-900/90 border border-zinc-700 text-[10px] font-mono text-zinc-300 rounded shadow-md pointer-events-none whitespace-nowrap">
          {cropRect.width} × {cropRect.height} px
        </div>
      </div>

      {/* Head Anchor Point Marker */}
      {activeHead && (
        <div
          onPointerDown={handleAnchorPointerDown}
          className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing z-30 group"
          style={{
            left: `${(activeHead.x + activeHead.width / 2) * 100}%`,
            top: `${(activeHead.y + activeHead.height / 2) * 100}%`,
          }}
          title="Draggable Subject Head Anchor"
        >
          <div className="w-full h-full rounded-full border-2 border-blue-400 bg-blue-500/20 group-hover:scale-110 transition-transform flex items-center justify-center text-blue-300 shadow-lg">
            <Target className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { ImageItem, CropSettings, DetectedHead, CropRect } from '../types';
import { calculateCropRect, renderCroppedImage } from '../utils/cropMath';
import { X, Check, RefreshCw, ZoomIn, Target, Sliders } from 'lucide-react';

interface SingleEditorModalProps {
  item: ImageItem | null;
  settings: CropSettings;
  onClose: () => void;
  onSave: (updatedItem: ImageItem) => void;
}

export const SingleEditorModal: React.FC<SingleEditorModalProps> = ({
  item,
  settings,
  onClose,
  onSave,
}) => {
  if (!item) return null;

  const [localHead, setLocalHead] = useState<DetectedHead>(
    item.manualHead ||
      item.detectedHead || {
        x: 0.35,
        y: 0.15,
        width: 0.3,
        height: 0.3,
        confidence: 1.0,
        source: 'manual',
      }
  );

  const [localSettings, setLocalSettings] = useState<CropSettings>(settings);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);

  // Re-calculate crop box whenever head or local settings change
  useEffect(() => {
    if (!item.dimensions.width || !item.dimensions.height) return;

    const computedRect = calculateCropRect(
      item.dimensions.width,
      item.dimensions.height,
      localHead,
      localSettings
    );
    setCropRect(computedRect);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        setIsUpdating(true);
        const fileIdentifier = item.file?.type || item.name;
        const { dataUrl, blob } = await renderCroppedImage(img, computedRect, localSettings, fileIdentifier);
        setPreviewUrl(dataUrl);
        setPreviewBlob(blob);
      } catch (err) {
        console.error('Failed rendering preview in editor:', err);
      } finally {
        setIsUpdating(false);
      }
    };
    img.src = item.originalUrl;
  }, [item, localHead, localSettings]);

  // Handle clicking on original photo canvas to manually position subject head center
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert pixel click to normalized 0..1 coordinates
    const normX = Math.max(0, Math.min(1, clickX / rect.width));
    const normY = Math.max(0, Math.min(1, clickY / rect.height));

    const boxW = localHead.width || 0.25;
    const boxH = localHead.height || 0.25;

    const newHeadX = Math.max(0, Math.min(1 - boxW, normX - boxW / 2));
    const newHeadY = Math.max(0, Math.min(1 - boxH, normY - boxH / 2));

    setLocalHead({
      x: newHeadX,
      y: newHeadY,
      width: boxW,
      height: boxH,
      confidence: 1.0,
      source: 'manual',
    });
  };

  const handleApply = () => {
    if (!cropRect || !previewUrl || !previewBlob) return;

    onSave({
      ...item,
      manualHead: localHead,
      cropRect,
      croppedUrl: previewUrl,
      croppedBlob: previewBlob,
      status: 'cropped',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-0 my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              Fine-Tune Subject Head Alignment
            </h3>
            <p className="text-xs text-slate-400">
              Click anywhere on the photo to reposition the detected head center.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Side-by-Side Original Overlay & Cropped Preview */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40">
          {/* Left: Original Image with Head Anchor Overlay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                Original & Subject Anchor
              </span>
              <span className="text-[10px] text-slate-500">Click image to set head location</span>
            </div>

            <div
              onClick={handleImageClick}
              className="relative aspect-square bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden cursor-crosshair group flex items-center justify-center p-2"
            >
              <img
                ref={imageRef}
                src={item.originalUrl}
                alt="Original Subject"
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Cropping Canvas Frame Outline Overlay */}
              {cropRect && item.dimensions.width > 0 && (
                <div
                  className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/10 pointer-events-none transition-all shadow-md shadow-emerald-500/20"
                  style={{
                    left: `${(cropRect.x / item.dimensions.width) * 100}%`,
                    top: `${(cropRect.y / item.dimensions.height) * 100}%`,
                    width: `${(cropRect.width / item.dimensions.width) * 100}%`,
                    height: `${(cropRect.height / item.dimensions.height) * 100}%`,
                  }}
                >
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-500 text-slate-950 font-mono text-[9px] font-bold rounded shadow-xs">
                    Crop Frame
                  </div>
                </div>
              )}

              {/* Detected Head Anchor Marker Box */}
              <div
                className="absolute border-2 border-blue-400 bg-blue-500/20 rounded-lg pointer-events-none transition-all shadow-lg shadow-blue-500/30"
                style={{
                  left: `${localHead.x * 100}%`,
                  top: `${localHead.y * 100}%`,
                  width: `${localHead.width * 100}%`,
                  height: `${localHead.height * 100}%`,
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-white" />
              </div>
            </div>
          </div>

          {/* Right: Cropped Preview Result */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                Cropped Output Preview
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {cropRect ? `${cropRect.width}×${cropRect.height} px` : ''}
              </span>
            </div>

            <div className="relative aspect-square bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-3">
              {previewUrl ? (
                <div className="relative max-w-full max-h-full border-2 border-blue-500/80 rounded-lg shadow-2xl overflow-hidden flex items-center justify-center bg-[conic-gradient(#1e293b_90deg,#0f172a_90deg_180deg,#1e293b_180deg_270deg,#0f172a_270deg)] [background-size:16px_16px]">
                  <img
                    src={previewUrl}
                    alt="Cropped Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                  {/* Canvas Frame Overlay Line */}
                  <div className="absolute inset-0 border border-blue-400/40 pointer-events-none" />
                </div>
              ) : (
                <div className="text-xs text-slate-500">Generating preview...</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Controls Bar */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Headroom Margin</span>
                <span className="font-mono text-blue-400">{localSettings.headroomPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                value={localSettings.headroomPercent}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, headroomPercent: parseInt(e.target.value) })
                }
                className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Subject Frame Scale</span>
                <span className="font-mono text-blue-400">{localSettings.scaleFactor.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="10.0"
                step="0.1"
                value={localSettings.scaleFactor}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, scaleFactor: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              disabled={isUpdating}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Apply Custom Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

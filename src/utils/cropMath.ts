import { CropRect, ExtendedCropSettings, DetectedHead } from '../types';
import { getEffectiveAspectRatio } from './presetLibrary';

export type ResizeHandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/**
 * Backward compatibility AspectRatio list
 */
export const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', width: 1, height: 1 },
  { id: '4:5', label: '4:5 Portrait', width: 4, height: 5 },
  { id: '5:7', label: '5:7 Print', width: 5, height: 7 },
  { id: '16:9', label: '16:9 Banner', width: 16, height: 9 },
  { id: '3:5', label: '3:5 Mobile', width: 3, height: 5 },
  { id: 'custom', label: 'Custom', width: 1, height: 1 },
];

/**
 * Compute pixel crop rectangle centered on detected head with headroom rule and offsets
 */
export function calculateCropRect(
  imgWidth: number,
  imgHeight: number,
  head: DetectedHead,
  settings: ExtendedCropSettings
): CropRect {
  const targetRatio = getEffectiveAspectRatio(settings);

  // Convert normalized head coords to pixel dimensions
  const headPxX = head.x * imgWidth;
  const headPxY = head.y * imgHeight;
  const headPxW = head.width * imgWidth;
  const headPxH = head.height * imgHeight;

  // Head center X and top Y
  const headCenterX = headPxX + headPxW / 2;

  // Calculate crop window height based on head height and scale factor
  const cropH = Math.max(headPxH * settings.scaleFactor, Math.min(imgWidth, imgHeight) * 0.15);
  const cropW = cropH * targetRatio;

  // Calculate top headroom position: head top sits settings.headroomPercent from top edge
  const headroomPx = cropH * (settings.headroomPercent / 100);
  let cropY = headPxY - headroomPx;
  let cropX = headCenterX - cropW / 2;

  // Apply horizontal and vertical offset nudges
  if (settings.horizontalOffsetPercent) {
    cropX += cropW * (settings.horizontalOffsetPercent / 100);
  }
  if (settings.verticalOffsetPercent) {
    cropY += cropH * (settings.verticalOffsetPercent / 100);
  }

  return {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(cropW),
    height: Math.round(cropH),
  };
}

/**
 * Proportional 8-point handle drag calculation maintaining strict aspect ratio
 */
export function calculateHandleResize(
  initialRect: CropRect,
  handle: ResizeHandlePosition,
  deltaX: number,
  deltaY: number,
  targetRatio: number,
  minDimension: number = 80
): CropRect {
  const { x, y } = initialRect;

  switch (handle) {
    case 'se': {
      const newW = Math.max(minDimension, initialRect.width + deltaX);
      const newH = newW / targetRatio;
      return { x, y, width: Math.round(newW), height: Math.round(newH) };
    }
    case 'nw': {
      const newW = Math.max(minDimension, initialRect.width - deltaX);
      const newH = newW / targetRatio;
      const newX = initialRect.x + (initialRect.width - newW);
      const newY = initialRect.y + (initialRect.height - newH);
      return { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
    }
    case 'ne': {
      const newW = Math.max(minDimension, initialRect.width + deltaX);
      const newH = newW / targetRatio;
      const newY = initialRect.y + (initialRect.height - newH);
      return { x, y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
    }
    case 'sw': {
      const newW = Math.max(minDimension, initialRect.width - deltaX);
      const newH = newW / targetRatio;
      const newX = initialRect.x + (initialRect.width - newW);
      return { x: Math.round(newX), y, width: Math.round(newW), height: Math.round(newH) };
    }
    case 'e':
    case 'w': {
      const factor = handle === 'e' ? 1 : -1;
      const newW = Math.max(minDimension, initialRect.width + deltaX * factor);
      const newH = newW / targetRatio;
      const newX = handle === 'w' ? initialRect.x + (initialRect.width - newW) : initialRect.x;
      const newY = initialRect.y + (initialRect.height - newH) / 2;
      return { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
    }
    case 'n':
    case 's': {
      const factor = handle === 's' ? 1 : -1;
      const newH = Math.max(minDimension, initialRect.height + deltaY * factor);
      const newW = newH * targetRatio;
      const newY = handle === 'n' ? initialRect.y + (initialRect.height - newH) : initialRect.y;
      const newX = initialRect.x + (initialRect.width - newW) / 2;
      return { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
    }
  }
}

/**
 * Get canvas bleed fill color style string
 */
export function getBleedColorStyle(mode: ExtendedCropSettings['bleedFillMode'], customColor?: string): string {
  switch (mode) {
    case 'white':
      return '#ffffff';
    case 'gray':
      return '#1e1e24';
    case 'charcoal':
      return '#0f0f12';
    case 'transparent':
      return 'transparent';
    case 'custom':
      return customColor || '#ffffff';
    default:
      return '#ffffff';
  }
}

/**
 * Render cropped image onto canvas with specified matting background and resampling
 */
export async function renderCroppedImage(
  img: HTMLImageElement,
  cropRect: CropRect,
  settings: ExtendedCropSettings,
  originalFileTypeOrName?: string
): Promise<{ dataUrl: string; blob: Blob }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas 2D context unavailable');

  let exportW = cropRect.width;
  let exportH = cropRect.height;

  // Max dimension scaling if set
  if (settings.exportMaxDimension && settings.exportMaxDimension > 0) {
    const maxDim = settings.exportMaxDimension;
    if (exportW > maxDim || exportH > maxDim) {
      if (exportW >= exportH) {
        exportW = maxDim;
        exportH = Math.round(maxDim * (cropRect.height / cropRect.width));
      } else {
        exportH = maxDim;
        exportW = Math.round(maxDim * (cropRect.width / cropRect.height));
      }
    }
  }

  canvas.width = Math.max(1, exportW);
  canvas.height = Math.max(1, exportH);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const fileIdentifier = (originalFileTypeOrName || img.src).toLowerCase();
  const isSourcePng = fileIdentifier.includes('png') || fileIdentifier === 'image/png';
  const isExportPng = settings.exportFormat === 'image/png';

  // Matting fill
  if (settings.bleedFillMode === 'transparent' && isExportPng) {
    ctx.clearRect(0, 0, exportW, exportH);
  } else {
    ctx.fillStyle = getBleedColorStyle(settings.bleedFillMode, settings.bleedCustomColor);
    ctx.fillRect(0, 0, exportW, exportH);
  }

  // Draw image mapped with scale & offset
  const scaleX = exportW / cropRect.width;
  const scaleY = exportH / cropRect.height;

  const destX = (0 - cropRect.x) * scaleX;
  const destY = (0 - cropRect.y) * scaleY;
  const destW = (img.naturalWidth || img.width) * scaleX;
  const destH = (img.naturalHeight || img.height) * scaleY;

  ctx.drawImage(img, destX, destY, destW, destH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob'));
          return;
        }
        const dataUrl = canvas.toDataURL(settings.exportFormat, settings.quality);
        resolve({ dataUrl, blob });
      },
      settings.exportFormat,
      settings.quality
    );
  });
}

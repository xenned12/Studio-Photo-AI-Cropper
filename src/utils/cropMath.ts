import { AspectRatioOption, AspectRatioType, CropRect, CropSettings, DetectedHead } from '../types';

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: '1:1', label: '1:1 Square', width: 1, height: 1 },
  { id: '4:5', label: '4:5 Portrait', width: 4, height: 5 },
  { id: '5:7', label: '5:7 Print', width: 5, height: 7 },
  { id: '16:9', label: '16:9 Banner', width: 16, height: 9 },
  { id: '3:5', label: '3:5 Mobile', width: 3, height: 5 },
  { id: 'custom', label: 'Custom', width: 1, height: 1 },
];

/**
 * Get numerical width:height ratio considering swap state
 */
export function getNumericAspectRatio(settings: CropSettings): number {
  let w = 1;
  let h = 1;

  if (settings.ratioType === 'custom') {
    w = Math.max(1, settings.customWidth || 1000);
    h = Math.max(1, settings.customHeight || 1000);
  } else {
    const opt = ASPECT_RATIOS.find((r) => r.id === settings.ratioType);
    if (opt) {
      w = opt.width;
      h = opt.height;
    }
  }

  // If swapped, invert width and height ratio
  if (settings.isSwapped) {
    return h / w;
  }
  return w / h;
}

/**
 * Compute pixel crop rectangle centered on detected head with headroom rule-of-thirds
 */
export function calculateCropRect(
  imgWidth: number,
  imgHeight: number,
  head: DetectedHead,
  settings: CropSettings
): CropRect {
  const targetRatio = getNumericAspectRatio(settings);

  // Convert normalized head coords to pixel dimensions
  const headPxX = head.x * imgWidth;
  const headPxY = head.y * imgHeight;
  const headPxW = head.width * imgWidth;
  const headPxH = head.height * imgHeight;

  // Head center X and top Y
  const headCenterX = headPxX + headPxW / 2;

  // Calculate crop window height based on head height and scale factor
  // Scale factor up to 10x allows framing down to waist/torso
  const cropH = Math.max(headPxH * settings.scaleFactor, Math.min(imgWidth, imgHeight) * 0.2);
  const cropW = cropH * targetRatio;

  // Calculate top headroom position: head top should sit settings.headroomPercent from top edge of crop window
  const headroomPx = cropH * (settings.headroomPercent / 100);
  const cropY = headPxY - headroomPx;
  const cropX = headCenterX - cropW / 2;

  // Allow crop to extend beyond original image width and height
  return {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(cropW),
    height: Math.round(cropH),
  };
}

/**
 * Render cropped image onto canvas with white background for JPEG/non-PNG or transparent for PNG
 */
export async function renderCroppedImage(
  img: HTMLImageElement,
  cropRect: CropRect,
  settings: CropSettings,
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

  canvas.width = exportW;
  canvas.height = exportH;

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Determine if source is PNG
  const fileIdentifier = (originalFileTypeOrName || img.src).toLowerCase();
  const isSourcePng = fileIdentifier.includes('png') || fileIdentifier === 'image/png';
  const isExportPng = settings.exportFormat === 'image/png';

  // If source is PNG AND export format is PNG, render transparent extended background.
  // Otherwise (JPEG, WEBP without alpha, or JPEG export), fill extended background with solid white (#ffffff).
  if (isSourcePng && isExportPng) {
    ctx.clearRect(0, 0, exportW, exportH);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportW, exportH);
  }

  // Map image coordinates onto destination canvas with scale and offset
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

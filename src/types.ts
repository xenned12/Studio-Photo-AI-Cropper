export type AspectRatioType = '1:1' | '4:5' | '5:7' | '16:9' | '3:5' | 'custom';

export interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  width: number;
  height: number;
  swapped?: boolean;
}

export interface DetectedHead {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  width: number; // Normalized 0..1
  height: number; // Normalized 0..1
  confidence: number;
  source: 'mediapipe' | 'saliency' | 'manual';
}

export interface CropRect {
  x: number; // Pixel x
  y: number; // Pixel y
  width: number; // Pixel width
  height: number; // Pixel height
}

export interface CropSettings {
  ratioType: AspectRatioType;
  customWidth: number;
  customHeight: number;
  isSwapped: boolean; // Toggles portrait vs landscape (e.g. 4:5 -> 5:4)
  headroomPercent: number; // Vertical offset percentage around head (10% - 50%)
  scaleFactor: number; // Zoom/Padding relative to head size (1.5x - 4.0x)
  exportFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number; // 0.1 .. 1.0
  exportMaxDimension: number; // max edge size in pixels e.g. 2048 or 0 for original scale
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  dimensions: { width: number; height: number };
  originalUrl: string;
  detectedHead: DetectedHead | null;
  manualHead: DetectedHead | null;
  cropRect: CropRect | null;
  croppedUrl: string | null;
  croppedBlob: Blob | null;
  status: 'pending' | 'detecting' | 'cropped' | 'error';
  errorMessage?: string;
  processingTimeMs?: number;
}

export type PresetCategory = 'biometric' | 'studio' | 'social' | 'custom';

export interface AspectRatioProfile {
  id: string;
  label: string;
  category: PresetCategory;
  width: number;
  height: number;
  subLabel?: string;
  description?: string;
  isBiometric?: boolean;
}

export type CanvasBleedFillMode = 'white' | 'gray' | 'charcoal' | 'transparent' | 'custom';

export interface ExtendedCropSettings {
  ratioId: string;
  customWidth: number;
  customHeight: number;
  isSwapped: boolean; // Orientation flip (W ↔ H)
  headroomPercent: number; // 5% - 45%
  scaleFactor: number; // 1.0x - 10.0x
  horizontalOffsetPercent: number; // -50% to +50%
  verticalOffsetPercent: number; // -50% to +50%
  bleedFillMode: CanvasBleedFillMode;
  bleedCustomColor: string;
  exportFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  quality: number; // 0.6 - 1.0
  exportMaxDimension: number; // 0 (original), 3840, 2048, 1080, 800
  filenameTemplate: string; // e.g. "{name}_cropped_{ratio}"
}

// Backwards compatibility alias
export type CropSettings = ExtendedCropSettings;

export interface DetectedHead {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  width: number; // Normalized 0..1
  height: number; // Normalized 0..1
  confidence: number;
  source: 'mediapipe' | 'saliency' | 'manual';
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  dimensions: { width: number; height: number };
  originalUrl: string;
  detectedHead: DetectedHead | null;
  manualHead: DetectedHead | null;
  cropRect: CropRect | null;
  croppedUrl: string | null;
  croppedBlob: Blob | null;
  status: 'idle' | 'detecting' | 'cropped' | 'error';
  errorMessage?: string;
  processingTimeMs?: number;
}

export interface ViewportTransform {
  scale: number;
  x: number;
  y: number;
}

export interface GuidesVisibility {
  ruleOfThirds: boolean;
  biometricGuide: boolean;
  goldenRatio: boolean;
  beforeAfterSplit: boolean;
}

# Pro Studio Cropper Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Studio Photo AI Cropper into a professional Lightroom/Photoshop-style desktop-grade darkroom photo cropping workstation with interactive 8-point bounding handles, composition guides, synchronized filmstrip, preset library, and export engine.

**Architecture:** Modular multi-pane workspace (`WorkspaceHeader`, `PresetSidebar`, `CanvasStage` with `CropBoundingBox` and `CompositionGuides`, `StudioInspector`, `FilmstripQueue`, and `BatchLightTable`). State flows through master workstation controller and custom hooks for transform math and batch processing.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS v4, Lucide React, Motion (Framer Motion), MediaPipe Vision WASM, JSZip, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-18-pro-studio-cropper-redesign-design.md`

## Global Constraints
- Calibrated pro darkroom color tokens: `#09090b` (base background), `#121215` (panel surfaces), `#18181c` (inputs/cards), `#27272a` (borders), `#3b82f6` (primary studio blue), `#06b6d4` (biometric cyan), `#10b981` (success).
- Zero cheesy marketing fluff, zero glowing gradient keywords, zero purple-on-dark clichés.
- Strict aspect ratio preservation during 8-point handle dragging.
- Non-destructive canvas export preserving full sensor resolution or configured resampling dimension.
- Clean TypeScript types with zero `any` and 100% typecheck passing on `npm run lint`.

---

### Task 1: Core Type Definitions & Preset Profiles Engine

**Files:**
- Create: `src/utils/presetLibrary.ts`
- Create: `tests/presetLibrary.test.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Consumes: None
- Produces: `AspectRatioProfile`, `ExtendedCropSettings`, `CanvasBleedFillMode`, `STUDIO_PRESETS`, `getEffectiveAspectRatio()`, `calculateAspectRatioValue()`

- [ ] **Step 1: Write the failing unit test for preset calculations and profiles**

```typescript
// tests/presetLibrary.test.ts
import { describe, it, expect } from 'vitest';
import { STUDIO_PRESETS, getEffectiveAspectRatio, calculateAspectRatioValue } from '../src/utils/presetLibrary';
import { ExtendedCropSettings } from '../src/types';

describe('presetLibrary', () => {
  it('contains essential biometric, studio, and social presets', () => {
    const passport = STUDIO_PRESETS.find(p => p.id === 'us-passport');
    expect(passport).toBeDefined();
    expect(passport?.width).toBe(1);
    expect(passport?.height).toBe(1);
    expect(passport?.isBiometric).toBe(true);

    const schengen = STUDIO_PRESETS.find(p => p.id === 'schengen-visa');
    expect(schengen).toBeDefined();
    expect(schengen?.width).toBe(35);
    expect(schengen?.height).toBe(45);
    expect(schengen?.isBiometric).toBe(true);

    const portrait45 = STUDIO_PRESETS.find(p => p.id === 'studio-4-5');
    expect(portrait45).toBeDefined();
    expect(portrait45?.width).toBe(4);
    expect(portrait45?.height).toBe(5);
  });

  it('computes numeric aspect ratio for standard and swapped orientation', () => {
    const settings: ExtendedCropSettings = {
      ratioId: 'studio-4-5',
      customWidth: 1000,
      customHeight: 1000,
      isSwapped: false,
      headroomPercent: 12,
      scaleFactor: 3.6,
      horizontalOffsetPercent: 0,
      verticalOffsetPercent: 0,
      bleedFillMode: 'white',
      bleedCustomColor: '#ffffff',
      exportFormat: 'image/png',
      quality: 0.92,
      exportMaxDimension: 0,
      filenameTemplate: '{name}_cropped_{ratio}',
    };

    // Standard portrait: 4 / 5 = 0.8
    expect(getEffectiveAspectRatio(settings)).toBeCloseTo(0.8);

    // Swapped landscape: 5 / 4 = 1.25
    expect(getEffectiveAspectRatio({ ...settings, isSwapped: true })).toBeCloseTo(1.25);
  });

  it('computes custom aspect ratio correctly', () => {
    const settings: ExtendedCropSettings = {
      ratioId: 'custom',
      customWidth: 1600,
      customHeight: 900,
      isSwapped: false,
      headroomPercent: 12,
      scaleFactor: 3.6,
      horizontalOffsetPercent: 0,
      verticalOffsetPercent: 0,
      bleedFillMode: 'white',
      bleedCustomColor: '#ffffff',
      exportFormat: 'image/jpeg',
      quality: 0.9,
      exportMaxDimension: 0,
      filenameTemplate: '{name}_cropped',
    };

    expect(calculateAspectRatioValue(1600, 900, false)).toBeCloseTo(16 / 9);
    expect(calculateAspectRatioValue(1600, 900, true)).toBeCloseTo(9 / 16);
    expect(getEffectiveAspectRatio(settings)).toBeCloseTo(16 / 9);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/presetLibrary.test.ts`  
Expected: FAIL with missing module imports.

- [ ] **Step 3: Update `src/types.ts` and create `src/utils/presetLibrary.ts`**

```typescript
// src/types.ts
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
```

```typescript
// src/utils/presetLibrary.ts
import { AspectRatioProfile, ExtendedCropSettings } from '../types';

export const STUDIO_PRESETS: AspectRatioProfile[] = [
  // Biometric & ID Passports
  {
    id: 'us-passport',
    label: '2×2" US Passport',
    subLabel: '1:1 Square',
    category: 'biometric',
    width: 1,
    height: 1,
    description: 'Official US Passport / 2x2 inch Visa spec',
    isBiometric: true,
  },
  {
    id: 'schengen-visa',
    label: '35×45mm Schengen / UK',
    subLabel: '7:9 Biometric',
    category: 'biometric',
    width: 35,
    height: 45,
    description: 'EU Schengen, UK, Singapore & International ICAO Visa',
    isBiometric: true,
  },
  {
    id: 'canada-passport',
    label: '50×70mm Canada / Brazil',
    subLabel: '5:7 Biometric',
    category: 'biometric',
    width: 50,
    height: 70,
    description: 'Canadian Passport & Latin America ID',
    isBiometric: true,
  },
  {
    id: 'id-3x4',
    label: '3×4 cm Standard ID',
    subLabel: '3:4 Portrait',
    category: 'biometric',
    width: 3,
    height: 4,
    description: 'Driver license & corporate badge',
    isBiometric: true,
  },

  // Studio Headshots & Print
  {
    id: 'studio-4-5',
    label: '4:5 Studio Portrait',
    subLabel: '8×10" Print',
    category: 'studio',
    width: 4,
    height: 5,
    description: 'Standard 8x10 print & agency headshots',
  },
  {
    id: 'studio-5-7',
    label: '5:7 Studio Print',
    subLabel: '5×7" Print',
    category: 'studio',
    width: 5,
    height: 7,
    description: 'Standard medium studio print display',
  },
  {
    id: 'studio-3-5',
    label: '3:5 Editorial',
    subLabel: 'Comp Card',
    category: 'studio',
    width: 3,
    height: 5,
    description: 'Model book & fashion comp cards',
  },
  {
    id: 'studio-2-3',
    label: '2:3 Classic 35mm',
    subLabel: '4×6" Print',
    category: 'studio',
    width: 2,
    height: 3,
    description: 'Classic 35mm sensor & 4x6 print',
  },

  // Digital & Social
  {
    id: 'social-1-1',
    label: '1:1 Square Feed',
    subLabel: 'Avatar / Post',
    category: 'social',
    width: 1,
    height: 1,
    description: 'Instagram feed, LinkedIn & profile avatars',
  },
  {
    id: 'social-9-16',
    label: '9:16 Story / Reel',
    subLabel: 'Vertical HD',
    category: 'social',
    width: 9,
    height: 16,
    description: 'TikTok, Instagram Story, Shorts & Reels',
  },
  {
    id: 'social-16-9',
    label: '16:9 Landscape Banner',
    subLabel: 'Wide HD',
    category: 'social',
    width: 16,
    height: 9,
    description: 'YouTube thumbnails & website hero headers',
  },
  {
    id: 'social-4-3',
    label: '4:3 Classic Display',
    subLabel: 'Display 4:3',
    category: 'social',
    width: 4,
    height: 3,
    description: 'Traditional digital display & tablet format',
  },

  // Custom
  {
    id: 'custom',
    label: 'Custom Dimensions',
    subLabel: 'Free / Fixed Ratio',
    category: 'custom',
    width: 1,
    height: 1,
    description: 'Custom pixel or proportional ratio dimensions',
  },
];

export function calculateAspectRatioValue(width: number, height: number, isSwapped: boolean): number {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  if (isSwapped) {
    return h / w;
  }
  return w / h;
}

export function getEffectiveAspectRatio(settings: ExtendedCropSettings): number {
  if (settings.ratioId === 'custom') {
    return calculateAspectRatioValue(settings.customWidth, settings.customHeight, settings.isSwapped);
  }
  const preset = STUDIO_PRESETS.find((p) => p.id === settings.ratioId) || STUDIO_PRESETS[0];
  return calculateAspectRatioValue(preset.width, preset.height, settings.isSwapped);
}

export function getPresetById(ratioId: string): AspectRatioProfile {
  return STUDIO_PRESETS.find((p) => p.id === ratioId) || STUDIO_PRESETS[0];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/presetLibrary.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/utils/presetLibrary.ts tests/presetLibrary.test.ts
git commit -m "feat: add extended studio preset profiles and ratio calculation engine"
```

---

### Task 2: Enhanced Crop Math & Bleed Rendering Engine

**Files:**
- Modify: `src/utils/cropMath.ts`
- Create: `tests/cropMath.test.ts`

**Interfaces:**
- Consumes: `ExtendedCropSettings`, `DetectedHead`, `CropRect`, `getEffectiveAspectRatio()`
- Produces: `calculateCropRect()`, `renderCroppedImage()`, `calculateHandleResize()`

- [ ] **Step 1: Write failing unit test for crop rectangle and handle resize math**

```typescript
// tests/cropMath.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCropRect, calculateHandleResize } from '../src/utils/cropMath';
import { ExtendedCropSettings, DetectedHead, CropRect } from '../src/types';

describe('cropMath', () => {
  const defaultSettings: ExtendedCropSettings = {
    ratioId: 'studio-4-5',
    customWidth: 1000,
    customHeight: 1000,
    isSwapped: false,
    headroomPercent: 10,
    scaleFactor: 3.0,
    horizontalOffsetPercent: 0,
    verticalOffsetPercent: 0,
    bleedFillMode: 'white',
    bleedCustomColor: '#ffffff',
    exportFormat: 'image/png',
    quality: 0.92,
    exportMaxDimension: 0,
    filenameTemplate: '{name}_cropped_{ratio}',
  };

  const sampleHead: DetectedHead = {
    x: 0.4,
    y: 0.2,
    width: 0.2,
    height: 0.2,
    confidence: 0.95,
    source: 'mediapipe',
  };

  it('calculates crop rect centered on head with headroom rule', () => {
    const imgW = 1000;
    const imgH = 1000;
    const rect = calculateCropRect(imgW, imgH, sampleHead, defaultSettings);

    // Head is 200px tall. Scale 3.0 => cropH = 600px
    // Ratio 4:5 => cropW = 600 * 0.8 = 480px
    expect(rect.height).toBe(600);
    expect(rect.width).toBe(480);

    // Head center is 0.4*1000 + 100 = 500px. cropX = 500 - 240 = 260px
    expect(rect.x).toBe(260);

    // Head top is 200px. Headroom 10% of 600 = 60px. cropY = 200 - 60 = 140px
    expect(rect.y).toBe(140);
  });

  it('applies horizontal and vertical offset nudging', () => {
    const imgW = 1000;
    const imgH = 1000;
    const offsetSettings: ExtendedCropSettings = {
      ...defaultSettings,
      horizontalOffsetPercent: 10, // +10% of width = +48px
      verticalOffsetPercent: -5, // -5% of height = -30px
    };

    const rect = calculateCropRect(imgW, imgH, sampleHead, offsetSettings);
    expect(rect.x).toBe(260 + 48);
    expect(rect.y).toBe(140 - 30);
  });

  it('resizes boundary box proportionally maintaining target aspect ratio', () => {
    const initialRect: CropRect = { x: 100, y: 100, width: 400, height: 500 };
    const targetRatio = 0.8; // 4:5

    // Dragging bottom-right handle by +80px width
    const resized = calculateHandleResize(initialRect, 'se', 80, 100, targetRatio);
    expect(resized.width).toBe(480);
    expect(resized.height).toBe(600);
    expect(resized.x).toBe(100);
    expect(resized.y).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/cropMath.test.ts`  
Expected: FAIL due to missing `calculateHandleResize` and offset parameters.

- [ ] **Step 3: Update `src/utils/cropMath.ts`**

```typescript
// src/utils/cropMath.ts
import { CropRect, ExtendedCropSettings, DetectedHead } from '../types';
import { getEffectiveAspectRatio } from './presetLibrary';

export type ResizeHandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

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
  let { x, y, width, height } = initialRect;

  switch (handle) {
    case 'se': {
      let newW = Math.max(minDimension, initialRect.width + deltaX);
      let newH = newW / targetRatio;
      return { x, y, width: Math.round(newW), height: Math.round(newH) };
    }
    case 'nw': {
      let newW = Math.max(minDimension, initialRect.width - deltaX);
      let newH = newW / targetRatio;
      let newX = initialRect.x + (initialRect.width - newW);
      let newY = initialRect.y + (initialRect.height - newH);
      return { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
    }
    case 'ne': {
      let newW = Math.max(minDimension, initialRect.width + deltaX);
      let newH = newW / targetRatio;
      let newY = initialRect.y + (initialRect.height - newH);
      return { x, y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
    }
    case 'sw': {
      let newW = Math.max(minDimension, initialRect.width - deltaX);
      let newH = newW / targetRatio;
      let newX = initialRect.x + (initialRect.width - newW);
      return { x: Math.round(newX), y, width: Math.round(newW), height: Math.round(newH) };
    }
    case 'e':
    case 'w': {
      let factor = handle === 'e' ? 1 : -1;
      let newW = Math.max(minDimension, initialRect.width + deltaX * factor);
      let newH = newW / targetRatio;
      let newX = handle === 'w' ? initialRect.x + (initialRect.width - newW) : initialRect.x;
      let newY = initialRect.y + (initialRect.height - newH) / 2;
      return { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
    }
    case 'n':
    case 's': {
      let factor = handle === 's' ? 1 : -1;
      let newH = Math.max(minDimension, initialRect.height + deltaY * factor);
      let newW = newH * targetRatio;
      let newY = handle === 'n' ? initialRect.y + (initialRect.height - newH) : initialRect.y;
      let newX = initialRect.x + (initialRect.width - newW) / 2;
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cropMath.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/cropMath.ts tests/cropMath.test.ts
git commit -m "feat: implement enhanced crop math with 8-point handle solver and bleed matting"
```

---

### Task 3: Studio Design Tokens & Darkroom Theme in CSS

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: Design tokens from spec
- Produces: CSS utility classes for darkroom surfaces, transparent checkerboards, custom scrollbars, and crosshair/resize cursor helpers.

- [ ] **Step 1: Update `src/index.css` and `index.html`**

```css
/* src/index.css */
@import "tailwindcss";

@layer base {
  :root {
    --bg-base: #09090b;
    --bg-panel: #121215;
    --bg-surface: #18181c;
    --border-subtle: #27272a;
    --border-focus: #3b82f6;
    color-scheme: dark;
  }

  body {
    background-color: var(--bg-base);
    color: #f4f4f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: -0.012em;
    user-select: none;
    -webkit-user-select: none;
    overflow: hidden;
  }
}

/* Studio Canvas Checkerboard */
.checkerboard-pattern {
  background-color: #121215;
  background-image: 
    linear-gradient(45deg, #18181c 25%, transparent 25%), 
    linear-gradient(-45deg, #18181c 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #18181c 75%), 
    linear-gradient(-45deg, transparent 75%, #18181c 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}

/* Sleek Studio Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #121215;
}

::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3f3f46;
}
```

```html
<!-- index.html -->
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Studio Photo Pro Cropper</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  </head>
  <body class="bg-zinc-950 text-zinc-100 antialiased h-screen w-screen overflow-hidden">
    <div id="root" class="h-full w-full"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run lint`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/index.css index.html
git commit -m "style: add pro studio darkroom theme, tokens and typography"
```

---

### Task 4: Composition Guides & Before/After Overlay Components

**Files:**
- Create: `src/components/canvas/CompositionGuides.tsx`
- Create: `src/components/canvas/BeforeAfterSplit.tsx`

**Interfaces:**
- Consumes: `CropRect`, `GuidesVisibility`, original and cropped image data
- Produces: `CompositionGuides` component (Rule of Thirds, Biometric lines, Golden ratio) and `BeforeAfterSplit` interactive slider component.

- [ ] **Step 1: Create `src/components/canvas/CompositionGuides.tsx`**

```tsx
// src/components/canvas/CompositionGuides.tsx
import React from 'react';
import { GuidesVisibility } from '../../types';

interface CompositionGuidesProps {
  guides: GuidesVisibility;
  isBiometricPreset?: boolean;
}

export const CompositionGuides: React.FC<CompositionGuidesProps> = ({ guides, isBiometricPreset }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Rule of Thirds Grid */}
      {guides.ruleOfThirds && (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20">
          <div className="border-r border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-b border-white/20" />
          <div className="border-r border-white/20" />
          <div className="border-r border-white/20" />
          <div />
        </div>
      )}

      {/* Golden Ratio (Phi) Overlay */}
      {guides.goldenRatio && (
        <div className="absolute inset-0 border border-amber-400/30">
          {/* Vertical Golden Split */}
          <div className="absolute top-0 bottom-0 left-[38.2%] w-px bg-amber-400/40 border-r border-amber-400/20" />
          <div className="absolute top-0 bottom-0 left-[61.8%] w-px bg-amber-400/40 border-r border-amber-400/20" />
          {/* Horizontal Golden Split */}
          <div className="absolute left-0 right-0 top-[38.2%] h-px bg-amber-400/40 border-b border-amber-400/20" />
          <div className="absolute left-0 right-0 top-[61.8%] h-px bg-amber-400/40 border-b border-amber-400/20" />
        </div>
      )}

      {/* Biometric Passport & ID Alignment Guidelines */}
      {(guides.biometricGuide || isBiometricPreset) && (
        <div className="absolute inset-0">
          {/* Center Vertical Axis */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-cyan-400/60" />

          {/* Crown Limit Guideline (Top 12%-16%) */}
          <div className="absolute left-4 right-4 top-[14%] border-t border-cyan-400/50 flex justify-between items-center text-[9px] font-mono text-cyan-300">
            <span className="bg-zinc-950/80 px-1 rounded -translate-y-1/2">Crown Limit</span>
            <span className="bg-zinc-950/80 px-1 rounded -translate-y-1/2">ICAO/US</span>
          </div>

          {/* Biometric Eyeline Horizon (56%-60% from bottom / ~40%-44% from top) */}
          <div className="absolute left-4 right-4 top-[42%] border-t-2 border-cyan-400/80 flex justify-between items-center text-[9px] font-mono text-cyan-300">
            <span className="bg-zinc-950/80 px-1 rounded -translate-y-1/2 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Eyeline Horizon
            </span>
            <span className="bg-zinc-950/80 px-1 rounded -translate-y-1/2">Target Eye Level</span>
          </div>

          {/* Chin Base Limit (Bottom 20%-24%) */}
          <div className="absolute left-4 right-4 bottom-[22%] border-t border-cyan-400/50 flex justify-between items-center text-[9px] font-mono text-cyan-300">
            <span className="bg-zinc-950/80 px-1 rounded -translate-y-1/2">Chin Base</span>
            <span className="bg-zinc-950/80 px-1 rounded -translate-y-1/2">Min 31mm</span>
          </div>

          {/* Oval Face Silhouette Guide */}
          <div className="absolute top-[16%] bottom-[22%] left-[22%] right-[22%] border border-dashed border-cyan-400/30 rounded-[50%] pointer-events-none" />
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Create `src/components/canvas/BeforeAfterSplit.tsx`**

```tsx
// src/components/canvas/BeforeAfterSplit.tsx
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
```

- [ ] **Step 3: Run typecheck**

Run: `npm run lint`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/CompositionGuides.tsx src/components/canvas/BeforeAfterSplit.tsx
git commit -m "feat: add composition guide overlays and interactive before/after split slider"
```

---

### Task 5: Interactive 8-Point Crop Bounding Box & Anchor Component

**Files:**
- Create: `src/components/canvas/CropBoundingBox.tsx`

**Interfaces:**
- Consumes: `CropRect`, `DetectedHead`, `GuidesVisibility`, `ResizeHandlePosition`, `calculateHandleResize()`
- Produces: `CropBoundingBox` interactive overlay component with 8 grab handles and draggable head anchor.

- [ ] **Step 1: Create `src/components/canvas/CropBoundingBox.tsx`**

```tsx
// src/components/canvas/CropBoundingBox.tsx
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
```

- [ ] **Step 2: Run typecheck**

Run: `npm run lint`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/CropBoundingBox.tsx
git commit -m "feat: implement interactive 8-point crop bounding box with handle solver and head anchor"
```

---

### Task 6: Central Interactive Canvas Stage & Viewport HUD

**Files:**
- Create: `src/components/layout/ViewportHUD.tsx`
- Create: `src/components/canvas/CanvasDropZone.tsx`
- Create: `src/components/canvas/CanvasStage.tsx`

**Interfaces:**
- Consumes: `ImageItem`, `ExtendedCropSettings`, `GuidesVisibility`, `CropBoundingBox`, `BeforeAfterSplit`
- Produces: `CanvasStage` viewport with smooth pan/zoom, drop ingestion, and interactive HUD.

- [ ] **Step 1: Create `src/components/layout/ViewportHUD.tsx`**

```tsx
// src/components/layout/ViewportHUD.tsx
import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid3X3, Target, Sparkles, Columns, RotateCcw } from 'lucide-react';
import { GuidesVisibility, ViewportTransform } from '../../types';

interface ViewportHUDProps {
  transform: ViewportTransform;
  guides: GuidesVisibility;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onResetPan: () => void;
  onToggleGuide: (key: keyof GuidesVisibility) => void;
}

export const ViewportHUD: React.FC<ViewportHUDProps> = ({
  transform,
  guides,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onResetPan,
  onToggleGuide,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl px-2 py-1.5 shadow-2xl">
      {/* Zoom Controls */}
      <button
        onClick={onZoomOut}
        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Zoom Out (-)"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <span className="text-xs font-mono text-zinc-300 w-12 text-center">
        {Math.round(transform.scale * 100)}%
      </span>

      <button
        onClick={onZoomIn}
        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Zoom In (+)"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        onClick={onZoomFit}
        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Fit to Canvas (Z / F)"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <button
        onClick={onResetPan}
        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Reset Pan & Center"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-zinc-800 mx-1" />

      {/* Guide Toggles */}
      <button
        onClick={() => onToggleGuide('ruleOfThirds')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
          guides.ruleOfThirds ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Toggle Rule of Thirds [G]"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleGuide('biometricGuide')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
          guides.biometricGuide ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Toggle Biometric Eyeline Guide [E]"
      >
        <Target className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleGuide('goldenRatio')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
          guides.goldenRatio ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Toggle Golden Ratio [R]"
      >
        <Sparkles className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggleGuide('beforeAfterSplit')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
          guides.beforeAfterSplit ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Toggle Before / After Split View [B]"
      >
        <Columns className="w-4 h-4" />
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Create `src/components/canvas/CanvasDropZone.tsx`**

```tsx
// src/components/canvas/CanvasDropZone.tsx
import React, { useRef, useState } from 'react';
import { Upload, Sparkles, FolderUp } from 'lucide-react';

interface CanvasDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  isProcessing: boolean;
}

export const CanvasDropZone: React.FC<CanvasDropZoneProps> = ({
  onFilesSelected,
  onLoadSamples,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      const validFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));
      if (validFiles.length > 0) onFilesSelected(validFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const validFiles = Array.from(e.target.files).filter((file) => file.type.startsWith('image/'));
      if (validFiles.length > 0) onFilesSelected(validFiles);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`w-full h-full flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors ${
        isDragOver ? 'bg-blue-600/10 border-2 border-dashed border-blue-500' : 'bg-transparent hover:bg-zinc-900/30'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="max-w-md space-y-4 pointer-events-none">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shadow-xl">
          <Upload className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-zinc-100">Drop Studio Photos to Auto-Crop</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Supports high-res PNG, JPEG, WebP. On-device biometric head detection.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <FolderUp className="w-4 h-4" />
            Browse Files
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSamples();
            }}
            disabled={isProcessing}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            Load Sample Headshots
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create `src/components/canvas/CanvasStage.tsx`**

```tsx
// src/components/canvas/CanvasStage.tsx
import React, { useRef, useState, useCallback } from 'react';
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

  // Pan canvas (Spacebar or Middle Click)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.spaceKey || e.altKey) {
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
```

- [ ] **Step 4: Run typecheck**

Run: `npm run lint`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ViewportHUD.tsx src/components/canvas/CanvasDropZone.tsx src/components/canvas/CanvasStage.tsx
git commit -m "feat: add interactive canvas stage, pan/zoom engine and floating HUD controls"
```

---

### Task 7: Preset Library Sidebar & Orientation Swapper

**Files:**
- Create: `src/components/sidebar/PresetSidebar.tsx`

**Interfaces:**
- Consumes: `ExtendedCropSettings`, `STUDIO_PRESETS`, `getEffectiveAspectRatio()`
- Produces: `PresetSidebar` component with grouped accordions, 1-click `W ↔ H` swap, and custom ratio inputs.

- [ ] **Step 1: Create `src/components/sidebar/PresetSidebar.tsx`**

```tsx
// src/components/sidebar/PresetSidebar.tsx
import React from 'react';
import { ExtendedCropSettings } from '../../types';
import { STUDIO_PRESETS } from '../../utils/presetLibrary';
import { ArrowLeftRight, Sliders, ShieldCheck, Camera, Share2, Sparkles } from 'lucide-react';

interface PresetSidebarProps {
  settings: ExtendedCropSettings;
  onChange: (updated: ExtendedCropSettings) => void;
  disabled?: boolean;
}

export const PresetSidebar: React.FC<PresetSidebarProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  const handleSelectPreset = (id: string) => {
    onChange({ ...settings, ratioId: id });
  };

  const handleToggleSwap = () => {
    onChange({ ...settings, isSwapped: !settings.isSwapped });
  };

  const categories = [
    { id: 'biometric', label: 'Biometric & Passports', icon: ShieldCheck },
    { id: 'studio', label: 'Studio & Portraits', icon: Camera },
    { id: 'social', label: 'Digital & Social Media', icon: Share2 },
  ] as const;

  return (
    <aside className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Header & Orientation Swap */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            Aspect Ratios
          </span>

          <button
            onClick={handleToggleSwap}
            disabled={disabled}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
              settings.isSwapped
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Swap width and height orientation (Portrait ↔ Landscape)"
          >
            <ArrowLeftRight className="w-3 h-3" />
            {settings.isSwapped ? 'Landscape' : 'Portrait'}
          </button>
        </div>

        {/* Categorized Presets */}
        {categories.map((cat) => {
          const presets = STUDIO_PRESETS.filter((p) => p.category === cat.id);
          const Icon = cat.icon;

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {cat.label}
              </div>

              <div className="grid grid-cols-1 gap-1">
                {presets.map((p) => {
                  const isSelected = settings.ratioId === p.id;
                  const displayRatio = settings.isSwapped ? `${p.height}:${p.width}` : `${p.width}:${p.height}`;

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id)}
                      disabled={disabled}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between border ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500/50 text-blue-200 shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-[11px] truncate">{p.label}</p>
                        <p className="text-[9px] text-zinc-500">{p.description}</p>
                      </div>

                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-zinc-950/80 rounded border border-zinc-800/80 text-zinc-400 shrink-0">
                        {displayRatio}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Custom Ratio Block */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <button
            onClick={() => handleSelectPreset('custom')}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between border ${
              settings.ratioId === 'custom'
                ? 'bg-blue-600/15 border-blue-500/50 text-blue-200 shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Custom Dimensions
            </div>
            <span className="font-mono text-[10px] text-zinc-500">Free/Fixed</span>
          </button>

          {settings.ratioId === 'custom' && (
            <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">
                  {settings.isSwapped ? 'Height' : 'Width'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.isSwapped ? settings.customHeight : settings.customWidth}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 100;
                    onChange(
                      settings.isSwapped
                        ? { ...settings, customHeight: val }
                        : { ...settings, customWidth: val }
                    );
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 font-mono text-center text-zinc-200 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">
                  {settings.isSwapped ? 'Width' : 'Height'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.isSwapped ? settings.customWidth : settings.customHeight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 100;
                    onChange(
                      settings.isSwapped
                        ? { ...settings, customWidth: val }
                        : { ...settings, customHeight: val }
                    );
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 font-mono text-center text-zinc-200 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run lint`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/PresetSidebar.tsx
git commit -m "feat: add pro preset sidebar with biometric and studio profiles"
```

---

### Task 8: Precision Studio Inspector Panel & Export Pipeline

**Files:**
- Create: `src/utils/zipExport.ts`
- Create: `tests/zipExport.test.ts`
- Create: `src/components/sidebar/StudioInspector.tsx`

**Interfaces:**
- Consumes: `ExtendedCropSettings`, `ImageItem`, `downloadBatchAsZip()`
- Produces: `StudioInspector` component (framing controls, background bleed matting, export pipeline, apply to all).

- [ ] **Step 1: Write failing unit test for filename template formatting**

```typescript
// tests/zipExport.test.ts
import { describe, it, expect } from 'vitest';
import { formatOutputFilename } from '../src/utils/zipExport';

describe('formatOutputFilename', () => {
  it('formats custom filename template tokens accurately', () => {
    const formatted = formatOutputFilename('portrait.jpg', '{name}_cropped_{ratio}', '4-5', 'image/png');
    expect(formatted).toBe('portrait_cropped_4-5.png');

    const formattedJpeg = formatOutputFilename('model_01.png', '{name}_studio', '1-1', 'image/jpeg');
    expect(formattedJpeg).toBe('model_01_studio.jpg');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/zipExport.test.ts`  
Expected: FAIL

- [ ] **Step 3: Update `src/utils/zipExport.ts`**

```typescript
// src/utils/zipExport.ts
import JSZip from 'jszip';
import { ImageItem } from '../types';

export function formatOutputFilename(
  originalName: string,
  template: string,
  ratioLabel: string,
  format: 'image/png' | 'image/jpeg' | 'image/webp'
): string {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  let ext = '.png';
  if (format === 'image/jpeg') ext = '.jpg';
  else if (format === 'image/webp') ext = '.webp';

  let result = (template || '{name}_cropped_{ratio}')
    .replace(/{name}/g, baseName)
    .replace(/{ratio}/g, ratioLabel.replace(/[:/]/g, '-'));

  return `${result}${ext}`;
}

export async function downloadBatchAsZip(
  items: ImageItem[],
  zipFilename: string = 'studio-cropped-photos.zip',
  template: string = '{name}_cropped_{ratio}',
  ratioLabel: string = 'crop'
): Promise<void> {
  const zip = new JSZip();
  const croppedItems = items.filter((item) => item.status === 'cropped' && item.croppedBlob);

  if (croppedItems.length === 0) {
    throw new Error('No cropped photos available to export');
  }

  for (let i = 0; i < croppedItems.length; i++) {
    const item = croppedItems[i];
    if (item.croppedBlob) {
      const filename = formatOutputFilename(
        item.name,
        template,
        ratioLabel,
        (item.croppedBlob.type as 'image/png' | 'image/jpeg' | 'image/webp') || 'image/png'
      );
      zip.file(filename, item.croppedBlob);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
```

- [ ] **Step 4: Create `src/components/sidebar/StudioInspector.tsx`**

```tsx
// src/components/sidebar/StudioInspector.tsx
import React from 'react';
import { ExtendedCropSettings, ImageItem } from '../../types';
import { Sliders, RefreshCw, Palette, Download, CheckCheck, FileImage } from 'lucide-react';

interface StudioInspectorProps {
  settings: ExtendedCropSettings;
  activeItem: ImageItem | null;
  isProcessing: boolean;
  onChange: (updated: ExtendedCropSettings) => void;
  onReDetectHead: () => void;
  onApplyToAll: () => void;
}

export const StudioInspector: React.FC<StudioInspectorProps> = ({
  settings,
  activeItem,
  isProcessing,
  onChange,
  onReDetectHead,
  onApplyToAll,
}) => {
  const bleedOptions = [
    { id: 'white', label: 'White', color: '#ffffff' },
    { id: 'gray', label: 'Studio Gray', color: '#1e1e24' },
    { id: 'charcoal', label: 'Charcoal', color: '#0f0f12' },
    { id: 'transparent', label: 'Alpha', color: 'transparent' },
  ] as const;

  return (
    <aside className="w-72 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col justify-between overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Section 1: Subject Framing & Headroom */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Framing & Headroom
            </span>

            {activeItem && (
              <button
                onClick={onReDetectHead}
                disabled={isProcessing}
                className="text-[10px] text-zinc-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                title="Re-run ML face detector"
              >
                <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                Re-Detect
              </button>
            )}
          </div>

          {/* Headroom Margin */}
          <div className="space-y-1 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Headroom Margin</span>
              <span className="font-mono text-blue-400">{settings.headroomPercent}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              value={settings.headroomPercent}
              onChange={(e) => onChange({ ...settings, headroomPercent: parseInt(e.target.value) })}
              className="w-full accent-blue-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Subject Frame Scale */}
          <div className="space-y-1 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Subject Scale</span>
              <span className="font-mono text-blue-400">{settings.scaleFactor.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="10.0"
              step="0.1"
              value={settings.scaleFactor}
              onChange={(e) => onChange({ ...settings, scaleFactor: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Section 2: Canvas Bleed & Background Matting */}
        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            Canvas Extended Bleed
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            {bleedOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ ...settings, bleedFillMode: opt.id })}
                className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 border transition-colors ${
                  settings.bleedFillMode === opt.id
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full border border-zinc-700 shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
                <span className="text-[11px] truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Export Pipeline */}
        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <FileImage className="w-3.5 h-3.5 text-blue-400" />
            Export Pipeline
          </span>

          {/* Format & Quality */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">Format</span>
              <div className="flex bg-zinc-900 p-0.5 rounded border border-zinc-800">
                {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => onChange({ ...settings, exportFormat: fmt })}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      settings.exportFormat === fmt ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {fmt.split('/')[1].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">Max Edge</span>
              <select
                value={settings.exportMaxDimension}
                onChange={(e) => onChange({ ...settings, exportMaxDimension: parseInt(e.target.value) })}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-[11px] font-mono focus:outline-none"
              >
                <option value={0}>Original (Sensor 1:1)</option>
                <option value={3840}>3840px (4K Ultra HD)</option>
                <option value={2048}>2048px (Web Pro)</option>
                <option value={1080}>1080px (Full HD)</option>
                <option value={800}>800px (Compact)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Apply to All Batch */}
        <div className="pt-2">
          <button
            onClick={onApplyToAll}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-blue-400" />
            Apply Settings to All Photos
          </button>
        </div>
      </div>
    </aside>
  );
};
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run tests/zipExport.test.ts && npm run lint`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/utils/zipExport.ts tests/zipExport.test.ts src/components/sidebar/StudioInspector.tsx
git commit -m "feat: add pro studio inspector panel and customizable export pipeline"
```

---

### Task 9: Synchronized Bottom Filmstrip Queue & Batch Light Table Grid

**Files:**
- Create: `src/components/filmstrip/FilmstripQueue.tsx`
- Create: `src/components/grid/BatchLightTable.tsx`

**Interfaces:**
- Consumes: `ImageItem[]`, active selection, handlers for download, delete, and mode switch
- Produces: `FilmstripQueue` bottom dock and `BatchLightTable` full-screen grid view.

- [ ] **Step 1: Create `src/components/filmstrip/FilmstripQueue.tsx`**

```tsx
// src/components/filmstrip/FilmstripQueue.tsx
import React from 'react';
import { ImageItem } from '../../types';
import { Download, Trash2, CheckCircle2, AlertCircle, Loader2, Plus, Sparkles, RefreshCw } from 'lucide-react';

interface FilmstripQueueProps {
  items: ImageItem[];
  activeItemId: string | null;
  isProcessing: boolean;
  onSelectItem: (item: ImageItem) => void;
  onDeleteItem: (id: string) => void;
  onDownloadItem: (item: ImageItem) => void;
  onAddFiles: (files: File[]) => void;
  onLoadSamples: () => void;
  onClearQueue: () => void;
}

export const FilmstripQueue: React.FC<FilmstripQueueProps> = ({
  items,
  activeItemId,
  isProcessing,
  onSelectItem,
  onDeleteItem,
  onDownloadItem,
  onAddFiles,
  onLoadSamples,
  onClearQueue,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <footer className="h-24 bg-zinc-950 border-t border-zinc-800 px-4 flex items-center gap-3 overflow-x-auto select-none shrink-0">
      {/* Import & Actions Drop Button */}
      <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-3 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.length) {
              const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
              onAddFiles(files);
            }
          }}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Import additional photos"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>

        {items.length > 0 && (
          <button
            onClick={onClearQueue}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
            title="Clear all queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filmstrip Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {items.map((item) => {
          const isActive = item.id === activeItemId;

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`relative h-18 w-20 rounded-lg overflow-hidden border cursor-pointer shrink-0 transition-all group ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/40'
                  : 'border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={item.croppedUrl || item.originalUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />

              {/* Status Badge */}
              <div className="absolute top-1 left-1">
                {item.status === 'detecting' && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
                {item.status === 'cropped' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {item.status === 'error' && <AlertCircle className="w-3 h-3 text-rose-400" />}
              </div>

              {/* Hover Quick Actions */}
              <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {item.croppedUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadItem(item);
                    }}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                    title="Download trimmed image"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded"
                  title="Remove from batch"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
};
```

- [ ] **Step 2: Create `src/components/grid/BatchLightTable.tsx`**

```tsx
// src/components/grid/BatchLightTable.tsx
import React from 'react';
import { ImageItem } from '../../types';
import { Download, Trash2, Sliders, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BatchLightTableProps {
  items: ImageItem[];
  onSelectAndEdit: (item: ImageItem) => void;
  onDeleteItem: (id: string) => void;
  onDownloadItem: (item: ImageItem) => void;
}

export const BatchLightTable: React.FC<BatchLightTableProps> = ({
  items,
  onSelectAndEdit,
  onDeleteItem,
  onDownloadItem,
}) => {
  return (
    <div className="flex-1 h-full w-full bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Batch Light Table ({items.length} Photos)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div
                onClick={() => onSelectAndEdit(item)}
                className="relative aspect-square bg-zinc-950 p-2 flex items-center justify-center cursor-pointer"
              >
                <img
                  src={item.croppedUrl || item.originalUrl}
                  alt={item.name}
                  className="max-w-full max-h-full object-contain rounded"
                />

                {item.status === 'detecting' && (
                  <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center gap-1.5 text-xs text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Detecting...
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <p className="font-medium text-[11px] text-zinc-200 truncate">{item.name}</p>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {item.dimensions.width}×{item.dimensions.height} px
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectAndEdit(item)}
                    className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition-colors"
                    title="Open in Studio"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  {item.croppedUrl && (
                    <button
                      onClick={() => onDownloadItem(item)}
                      className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Run typecheck**

Run: `npm run lint`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/filmstrip/FilmstripQueue.tsx src/components/grid/BatchLightTable.tsx
git commit -m "feat: add synchronized filmstrip queue and batch light table grid view"
```

---

### Task 10: Top Workspace Header, Keyboard Shortcuts Modal & Main Workstation Controller Integration

**Files:**
- Create: `src/components/layout/WorkspaceHeader.tsx`
- Create: `src/components/common/KeyboardShortcutsModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: All components from Tasks 1-9
- Produces: Master production studio application with hotkey listener, batch pipeline, and state synchronization.

- [ ] **Step 1: Create `src/components/layout/WorkspaceHeader.tsx`**

```tsx
// src/components/layout/WorkspaceHeader.tsx
import React from 'react';
import { Crop, Download, Sparkles, HelpCircle, LayoutGrid, Focus } from 'lucide-react';

interface WorkspaceHeaderProps {
  totalCount: number;
  croppedCount: number;
  viewMode: 'studio' | 'grid';
  isZipping: boolean;
  onToggleViewMode: () => void;
  onDownloadAllZip: () => void;
  onLoadSamples: () => void;
  onOpenShortcuts: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  totalCount,
  croppedCount,
  viewMode,
  isZipping,
  onToggleViewMode,
  onDownloadAllZip,
  onLoadSamples,
  onOpenShortcuts,
}) => {
  return (
    <header className="h-12 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Branding & Mode Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Crop className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-zinc-100 tracking-tight">Studio Pro Cropper</span>
        </div>

        <div className="w-px h-4 bg-zinc-800 mx-1" />

        {/* View Mode Toggle */}
        <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={onToggleViewMode}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'studio' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Focus className="w-3.5 h-3.5" />
            Studio Focus
          </button>
          <button
            onClick={onToggleViewMode}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Light Table ({totalCount})
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {totalCount === 0 && (
          <button
            onClick={onLoadSamples}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Try Samples
          </button>
        )}

        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {croppedCount > 0 && (
          <button
            onClick={onDownloadAllZip}
            disabled={isZipping}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {isZipping ? 'Exporting...' : `Export ZIP (${croppedCount})`}
          </button>
        )}
      </div>
    </header>
  );
};
```

- [ ] **Step 2: Create `src/components/common/KeyboardShortcutsModal.tsx`**

```tsx
// src/components/common/KeyboardShortcutsModal.tsx
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
```

- [ ] **Step 3: Update `src/App.tsx` with complete workstation controller**

```tsx
// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ImageItem, ExtendedCropSettings, GuidesVisibility, CropRect, DetectedHead } from './types';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';
import { PresetSidebar } from './components/sidebar/PresetSidebar';
import { CanvasStage } from './components/canvas/CanvasStage';
import { StudioInspector } from './components/sidebar/StudioInspector';
import { FilmstripQueue } from './components/filmstrip/FilmstripQueue';
import { BatchLightTable } from './components/grid/BatchLightTable';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { detectHeadInImage } from './utils/faceDetector';
import { calculateCropRect, renderCroppedImage } from './utils/cropMath';
import { downloadBatchAsZip, formatOutputFilename } from './utils/zipExport';
import { generateSamplePhotos } from './utils/sampleImages';

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'studio' | 'grid'>('studio');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Master Studio Crop Settings
  const [cropSettings, setCropSettings] = useState<ExtendedCropSettings>({
    ratioId: 'studio-4-5',
    customWidth: 1000,
    customHeight: 1000,
    isSwapped: false,
    headroomPercent: 12,
    scaleFactor: 3.6,
    horizontalOffsetPercent: 0,
    verticalOffsetPercent: 0,
    bleedFillMode: 'white',
    bleedCustomColor: '#ffffff',
    exportFormat: 'image/png',
    quality: 0.92,
    exportMaxDimension: 0,
    filenameTemplate: '{name}_cropped_{ratio}',
  });

  // Guides state
  const [guides, setGuides] = useState<GuidesVisibility>({
    ruleOfThirds: false,
    biometricGuide: false,
    goldenRatio: false,
    beforeAfterSplit: false,
  });

  const activeItem = items.find((i) => i.id === activeItemId) || items[0] || null;

  // Process a single image through detection & cropping pipeline
  const processImageItem = useCallback(
    async (item: ImageItem, settings: ExtendedCropSettings): Promise<ImageItem> => {
      const startTime = performance.now();

      return new Promise<ImageItem>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
          try {
            const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
            let head = item.manualHead || item.detectedHead;
            if (!head) {
              head = await detectHeadInImage(img);
            }

            const rect = calculateCropRect(dimensions.width, dimensions.height, head, settings);
            const fileIdentifier = item.file?.type || item.name;
            const { dataUrl, blob } = await renderCroppedImage(img, rect, settings, fileIdentifier);
            const endTime = performance.now();

            resolve({
              ...item,
              dimensions,
              detectedHead: item.detectedHead || head,
              cropRect: rect,
              croppedUrl: dataUrl,
              croppedBlob: blob,
              status: 'cropped',
              processingTimeMs: Math.round(endTime - startTime),
            });
          } catch (err) {
            console.error('Error processing photo:', err);
            resolve({ ...item, status: 'error', errorMessage: 'Failed to process crop' });
          }
        };

        img.onerror = () => {
          resolve({ ...item, status: 'error', errorMessage: 'Failed loading image' });
        };

        img.src = item.originalUrl;
      });
    },
    []
  );

  // Ingest new files
  const handleAddFiles = useCallback(
    async (files: File[]) => {
      setIsProcessing(true);

      const newItems: ImageItem[] = files.map((file, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        name: file.name,
        size: file.size,
        dimensions: { width: 0, height: 0 },
        originalUrl: URL.createObjectURL(file),
        detectedHead: null,
        manualHead: null,
        cropRect: null,
        croppedUrl: null,
        croppedBlob: null,
        status: 'detecting',
      }));

      setItems((prev) => [...prev, ...newItems]);
      if (!activeItemId && newItems.length > 0) {
        setActiveItemId(newItems[0].id);
      }

      for (const item of newItems) {
        const processed = await processImageItem(item, cropSettings);
        setItems((prev) => prev.map((p) => (p.id === processed.id ? processed : p)));
      }

      setIsProcessing(false);
    },
    [activeItemId, cropSettings, processImageItem]
  );

  // Reprocess active item or all when settings change
  const handleSettingsChange = (newSettings: ExtendedCropSettings) => {
    setCropSettings(newSettings);
    if (activeItem) {
      processImageItem(activeItem, newSettings).then((updated) => {
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      });
    }
  };

  // Re-run crop across entire queue
  const handleApplyToAll = async () => {
    setIsProcessing(true);
    for (const item of items) {
      if (item.originalUrl) {
        const updated = await processImageItem(item, cropSettings);
        setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    }
    setIsProcessing(false);
  };

  // Interactive crop rect update
  const handleCropRectChange = async (newRect: CropRect) => {
    if (!activeItem) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const fileIdentifier = activeItem.file?.type || activeItem.name;
      const { dataUrl, blob } = await renderCroppedImage(img, newRect, cropSettings, fileIdentifier);
      setItems((prev) =>
        prev.map((i) =>
          i.id === activeItem.id
            ? { ...i, cropRect: newRect, croppedUrl: dataUrl, croppedBlob: blob, status: 'cropped' }
            : i
        )
      );
    };
    img.src = activeItem.originalUrl;
  };

  // Head anchor position change
  const handleHeadAnchorChange = (newHead: DetectedHead) => {
    if (!activeItem) return;
    const updated = { ...activeItem, manualHead: newHead };
    processImageItem(updated, cropSettings).then((res) => {
      setItems((prev) => prev.map((i) => (i.id === res.id ? res : i)));
    });
  };

  // Re-detect head on active item
  const handleReDetectHead = async () => {
    if (!activeItem) return;
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const head = await detectHeadInImage(img);
      const updated = { ...activeItem, detectedHead: head, manualHead: null };
      const processed = await processImageItem(updated, cropSettings);
      setItems((prev) => prev.map((i) => (i.id === processed.id ? processed : i)));
      setIsProcessing(false);
    };
    img.src = activeItem.originalUrl;
  };

  // Download single item
  const handleDownloadSingle = (item: ImageItem) => {
    if (!item.croppedBlob || !item.croppedUrl) return;
    const filename = formatOutputFilename(
      item.name,
      cropSettings.filenameTemplate,
      cropSettings.ratioId,
      cropSettings.exportFormat
    );
    const a = document.createElement('a');
    a.href = item.croppedUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download batch zip
  const handleDownloadBatchZip = async () => {
    try {
      setIsZipping(true);
      await downloadBatchAsZip(
        items,
        'studio-pro-cropped-photos.zip',
        cropSettings.filenameTemplate,
        cropSettings.ratioId
      );
    } catch (e) {
      console.error('Failed zipping batch:', e);
    } finally {
      setIsZipping(false);
    }
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.originalUrl) URL.revokeObjectURL(item.originalUrl);
      const filtered = prev.filter((i) => i.id !== id);
      if (activeItemId === id) {
        setActiveItemId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  // Clear queue
  const handleClearQueue = () => {
    items.forEach((i) => {
      if (i.originalUrl) URL.revokeObjectURL(i.originalUrl);
    });
    setItems([]);
    setActiveItemId(null);
  };

  // Load sample photos
  const handleLoadSamples = async () => {
    const samples = await generateSamplePhotos();
    handleAddFiles(samples);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case 'g':
          setGuides((g) => ({ ...g, ruleOfThirds: !g.ruleOfThirds }));
          break;
        case 'e':
          setGuides((g) => ({ ...g, biometricGuide: !g.biometricGuide }));
          break;
        case 'r':
          setGuides((g) => ({ ...g, goldenRatio: !g.goldenRatio }));
          break;
        case 'b':
          setGuides((g) => ({ ...g, beforeAfterSplit: !g.beforeAfterSplit }));
          break;
        case '?':
          setShowShortcuts((s) => !s);
          break;
        case 'arrowright':
          if (items.length > 0) {
            const idx = items.findIndex((i) => i.id === activeItemId);
            const next = items[(idx + 1) % items.length];
            if (next) setActiveItemId(next.id);
          }
          break;
        case 'arrowleft':
          if (items.length > 0) {
            const idx = items.findIndex((i) => i.id === activeItemId);
            const prev = items[(idx - 1 + items.length) % items.length];
            if (prev) setActiveItemId(prev.id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, activeItemId]);

  const croppedCount = items.filter((i) => i.status === 'cropped').length;

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Application Header */}
      <WorkspaceHeader
        totalCount={items.length}
        croppedCount={croppedCount}
        viewMode={viewMode}
        isZipping={isZipping}
        onToggleViewMode={() => setViewMode((m) => (m === 'studio' ? 'grid' : 'studio'))}
        onDownloadAllZip={handleDownloadBatchZip}
        onLoadSamples={handleLoadSamples}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />

      {/* Main Multi-Pane Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'studio' ? (
          <>
            {/* Left Sidebar: Presets */}
            <PresetSidebar
              settings={cropSettings}
              onChange={handleSettingsChange}
              disabled={isProcessing}
            />

            {/* Central Canvas Stage */}
            <CanvasStage
              activeItem={activeItem}
              settings={cropSettings}
              guides={guides}
              isProcessing={isProcessing}
              onFilesSelected={handleAddFiles}
              onLoadSamples={handleLoadSamples}
              onCropRectChange={handleCropRectChange}
              onHeadAnchorChange={handleHeadAnchorChange}
              onToggleGuide={(key) => setGuides((g) => ({ ...g, [key]: !g[key] }))}
            />

            {/* Right Sidebar: Inspector */}
            <StudioInspector
              settings={cropSettings}
              activeItem={activeItem}
              isProcessing={isProcessing}
              onChange={handleSettingsChange}
              onReDetectHead={handleReDetectHead}
              onApplyToAll={handleApplyToAll}
            />
          </>
        ) : (
          /* Full Screen Batch Light Table Grid */
          <BatchLightTable
            items={items}
            onSelectAndEdit={(item) => {
              setActiveItemId(item.id);
              setViewMode('studio');
            }}
            onDeleteItem={handleDeleteItem}
            onDownloadItem={handleDownloadSingle}
          />
        )}
      </div>

      {/* Synchronized Bottom Filmstrip */}
      {viewMode === 'studio' && (
        <FilmstripQueue
          items={items}
          activeItemId={activeItemId}
          isProcessing={isProcessing}
          onSelectItem={(item) => setActiveItemId(item.id)}
          onDeleteItem={handleDeleteItem}
          onDownloadItem={handleDownloadSingle}
          onAddFiles={handleAddFiles}
          onLoadSamples={handleLoadSamples}
          onClearQueue={handleClearQueue}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
```

- [ ] **Step 4: Run typecheck and tests**

Run: `npm run lint && npx vitest run`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/WorkspaceHeader.tsx src/components/common/KeyboardShortcutsModal.tsx src/App.tsx
git commit -m "feat: integrate main studio pro workspace controller and keyboard shortcuts"
```

---

### Task 11: End-to-End Verification & Production Build

**Files:**
- Modify: `package.json` (ensure test script and clean scripts)
- Run tests and build check

- [ ] **Step 1: Add test script to `package.json`**

```json
"scripts": {
  "dev": "vite --port=3000 --host=0.0.0.0",
  "build": "vite build",
  "preview": "vite preview",
  "clean": "rm -rf dist server.js",
  "lint": "tsc --noEmit",
  "test": "vitest run"
}
```

- [ ] **Step 2: Run test suite**

Run: `npm run test`  
Expected: All tests pass.

- [ ] **Step 3: Run typecheck**

Run: `npm run lint`  
Expected: Zero type errors.

- [ ] **Step 4: Run production build**

Run: `npm run build`  
Expected: Successful Vite production bundle creation.

- [ ] **Step 5: Final Commit**

```bash
git add package.json
git commit -m "chore: add test script and complete production build verification"
```

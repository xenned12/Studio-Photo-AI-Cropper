# Studio Photo Pro Cropper — System Redesign Specification

**Date:** 2026-08-18  
**Status:** Approved for Implementation Planning  
**Target Branch:** `redesign/pro-studio-workstation`

---

## 1. Executive Summary & Goals

### 1.1 Objective
Redesign the Studio Photo AI Cropper into an elite, desktop-grade darkroom photo cropping workstation inspired by Lightroom Classic and Photoshop. The redesign eliminates generic SaaS/AI template tropes (cheesy purple gradients, marketing bento cards, clunky modal workflows) and replaces them with a high-density, performant, professional creative workspace.

### 1.2 Key Pillars
1. **Photoshop / Lightroom Workstation Architecture**: Full-viewport application layout with top workspace toolbar, collapsible left preset library, high-performance central zoom/pan canvas stage with 8-point draggable handles and composition guides, right fine-tuning inspector, and bottom synchronized filmstrip queue.
2. **Interactive Canvas Engine**: Real-time pan & zoom, 8-point draggable crop bounding box with ratio locking, draggable subject anchor point, toggleable composition guides (**Rule of Thirds**, **Biometric Passport / Eyeline Guide**, **Golden Ratio**), and Before/After split view.
3. **Studio Preset Profiles**: Comprehensive presets spanning Biometric Passports & Visas (US 2x2", Schengen 35x45mm, Canadian 50x70mm, 3x4 ID), Studio Headshots (4:5, 5:7, 3:5, 2:3), Digital/Social formats, and custom dimensions with 1-click orientation swapping (`W ↔ H`).
4. **Matting & Extended Bleed Engine**: Configurable canvas fill colors (Studio Pure White `#ffffff`, Neutral Gray `#1e1e24`, Deep Charcoal `#0f0f12`, Transparent Alpha, and Custom Color) when crops extend past original frame edges.
5. **Pro Export & Batch Pipeline**: Format conversion (PNG, JPEG, WebP), compression quality tuning, max edge resampling (Original, 4K, 2048px, 1080px, 800px), customizable filename token templates (`[name]_cropped_[ratio]`), and batch ZIP exporting.
6. **Dual Workspace View Modes**: Instant switching between **Focus Studio Mode** (interactive canvas + filmstrip) and **Batch Light Table Mode** (multi-card grid view for batch verification).

---

## 2. Workspace Layout & Component Architecture

```
+---------------------------------------------------------------------------------------------------+
| Top Workspace Toolbar (48px)                                                                      |
| [Logo] Studio Pro Cropper | [Focus / Light Table] | [Zoom Controls] | [Guides: G,E,R,B] | [Export ZIP] |
+-----------------------+---------------------------------------------------+-----------------------+
| Left Preset Sidebar   | Central Interactive Canvas Stage (Flex-1)         | Right Inspector       |
| (260px Collapsible)   |                                                   | (300px Collapsible)   |
|                       |  - Pan & Zoom Viewport (Wheel / Drag)             |                       |
|  * Biometric & ID     |  - 8-Point Draggable Crop Box with Aspect Lock    |  * Subject Alignment  |
|    - US 2x2" Passport |  - Composition Guides (Thirds, Biometric, Golden) |    - Headroom %       |
|    - Schengen 35x45mm |  - Subject Head Target Anchor                     |    - Scale Multiplier |
|    - Canada 50x70mm   |  - Before/After Split Curtain Slider              |    - Offset Bias      |
|    - 3x4 ID           |  - Drag & Drop Dropzone Overlay                   |  * Matting & Bleed    |
|  * Studio Headshots   |                                                   |    - White, Gray, etc.|
|    - 4:5 Portrait     |                                                   |  * Export Engine      |
|    - 5:7 Print        |                                                   |    - PNG/JPEG/WebP    |
|    - 3:5 Editorial    |                                                   |    - Resampling Dim   |
|    - 2:3 Classic      |                                                   |    - Name Template    |
|  * Digital & Social   |                                                   |  * Sync to Batch All  |
|  * Custom Ratio & Swap|                                                   |                       |
+-----------------------+---------------------------------------------------+-----------------------+
| Bottom Synchronized Filmstrip Queue (100px)                                                      |
| [Thumb 1 (Active)] [Thumb 2] [Thumb 3] [Thumb 4] ... | [+ Add Photos] [Clear Queue] [Apply All]   |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Subsystem Specifications

### 3.1 Data Types & State Architecture (`src/types.ts`)

```typescript
export type PresetCategory = 'biometric' | 'studio' | 'social' | 'custom';

export interface AspectRatioProfile {
  id: string;
  label: string;
  category: PresetCategory;
  width: number;
  height: number;
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
```

### 3.2 Interactive Canvas Engine (`src/components/canvas/`)
* **`CanvasStage.tsx`**:
  * Viewport coordinate math translating between screen coordinate space `(clientX, clientY)`, viewport pan/zoom transform space `(x, y, scale)`, and image sensor pixel space `(imgW, imgH)`.
  * Renders base image layer with crisp pixel interpolation.
  * Renders extended matting bleed preview with chosen background color.
* **`CropBoundingBox.tsx`**:
  * 8 grab handles (Top-Left, Top-Center, Top-Right, Middle-Left, Middle-Right, Bottom-Left, Bottom-Center, Bottom-Right) + inner move area.
  * Real-time constraint solver keeping boundary within or beyond canvas according to aspect ratio.
  * Draggable Head Anchor point reticle (`DetectedHead` marker).
* **`CompositionGuides.tsx`**:
  * **Rule of Thirds**: 3x3 line matrix with intersection tick marks.
  * **Biometric Guide**: Overlay lines showing the standard ICAO / ISO biometric passport facial zones (top crown safety margin, eye-level line, chin base line).
  * **Golden Ratio (Phi)**: 1 : 0.618 : 1 proportion lines.
* **`BeforeAfterSplit.tsx`**:
  * Draggable vertical divider handle allowing real-time side-by-side comparison between original uncropped photo and the cropped framing.

### 3.3 Presets & Ratio Library (`src/components/sidebar/PresetSidebar.tsx`)
* Categorized accordion groups with quick-selection pills and descriptive tags.
* 1-click **Orientation Swap (`W ↔ H`)** button with visual icon transition.
* Numeric custom width and height inputs with real-time decimal ratio calculation.

### 3.4 Precision Inspector (`src/components/sidebar/StudioInspector.tsx`)
* **Subject Framing Controls**:
  * Headroom slider (`5%` to `45%`), Scale multiplier slider (`1.0x` to `10.0x`), Horizontal/Vertical nudge sliders.
  * "Re-Detect Head" trigger invoking MediaPipe WASM BlazeFace / Canvas Saliency detector.
  * "Apply Settings to All Batch Photos" button.
* **Canvas Matting & Bleed Fill**:
  * 5 fill mode options with color swatches and hex input.
* **Export Pipeline Engine**:
  * Format selector (PNG, JPEG, WebP).
  * Quality slider (60%–100%).
  * Max Edge downsampling dropdown (Original, 4K UHD 3840px, 2048px, 1080px, 800px).
  * Filename token template input (`{name}_cropped_{ratio}`).

### 3.5 Synchronized Filmstrip & Queue Manager (`src/components/filmstrip/FilmstripQueue.tsx`)
* Horizontal thumbnail carousel showing all items in queue.
* Active photo highlight with keyboard navigation (`Left / Right Arrow`).
* Quick badge indicators: `ML Head`, `Manual`, `Ready`, `Error`.
* Action toolbar: `+ Add Photos`, `Try Demo Photos`, `Clear Queue`, `Download Active Photo`, `Download All ZIP`.

### 3.6 Batch Light Table Grid (`src/components/grid/BatchLightTable.tsx`)
* Responsive multi-column light table view for bulk review.
* Zoom slider for thumbnail density (Compact, Normal, Large).
* Quick actions per card: Single download, Edit in Focus Studio, Delete.

---

## 4. UI/UX Design System & Aesthetics

### 4.1 Color Palette
* Background Canvas Base: `#09090b` (Obsidian Zinc)
* Panel Surfaces: `#121215` (Darkroom Charcoal)
* Input Surfaces: `#18181c` (Zinc 900)
* Precision Hairlines: `#27272a` (Zinc 800) / `#3f3f46` (Active Zinc 700)
* Primary Accent: `#3b82f6` (Pro Studio Blue)
* Biometric Guide Accent: `#06b6d4` (Cyan)
* Success State: `#10b981` (Emerald)

### 4.2 Typography
* UI Sans: System Pro font stack (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`) with tight tracking (`-0.015em`).
* Data & Dimension Readouts: Monospaced font stack (`ui-monospace`, `JetBrains Mono`, `monospace`).

### 4.3 Micro-Interactions & Keyboard Shortcuts
* `Spacebar + Drag`: Pan canvas
* `Mouse Wheel`: Zoom in/out
* `G`: Toggle Rule of Thirds
* `E`: Toggle Biometric Eyeline Guide
* `R`: Toggle Golden Ratio Guide
* `B`: Toggle Before / After Split View
* `Z` / `F`: Fit to Viewport
* `ArrowLeft / ArrowRight`: Previous / Next photo in filmstrip

---

## 5. Implementation File Organization Plan

```
src/
├── types.ts                              # Extended TypeScript data types & profiles
├── index.css                             # Precision design tokens & darkroom styling
├── main.tsx                              # Application entry point
├── App.tsx                               # Master workstation state & controller
├── components/
│   ├── layout/
│   │   ├── WorkspaceHeader.tsx           # Top navigation & action toolbar
│   │   └── ViewportHUD.tsx               # Floating canvas zoom & guide controls
│   ├── canvas/
│   │   ├── CanvasStage.tsx               # Core interactive pan/zoom canvas
│   │   ├── CropBoundingBox.tsx           # 8-point interactive draggable boundary
│   │   ├── CompositionGuides.tsx         # Rule of thirds, Biometric, Golden ratio
│   │   ├── BeforeAfterSplit.tsx          # Interactive split curtain slider
│   │   └── CanvasDropZone.tsx            # Seamless drag-and-drop ingestion overlay
│   ├── sidebar/
│   │   ├── PresetSidebar.tsx             # Preset library & aspect ratio selector
│   │   └── StudioInspector.tsx           # Framing, background matting & export settings
│   ├── filmstrip/
│   │   └── FilmstripQueue.tsx            # Synchronized bottom queue strip
│   ├── grid/
│   │   └── BatchLightTable.tsx           # Batch full-screen light table grid mode
│   └── common/
│       └── KeyboardShortcutsModal.tsx    # Cheat sheet modal for studio shortcuts
└── utils/
    ├── cropMath.ts                       # Precision crop math, transforms & rendering
    ├── presetLibrary.ts                  # Biometric, studio, social & print presets
    ├── faceDetector.ts                   # MediaPipe WASM BlazeFace + Saliency fallback
    ├── zipExport.ts                      # Template-based batch ZIP packager
    └── sampleImages.ts                   # Studio headshot test samples
```

---

## 6. Verification & Acceptance Criteria
1. **Layout Fidelity**: The application renders as an edge-to-edge pro studio workspace with persistent docks, responsive resizing, and zero generic marketing badges.
2. **Interactive Canvas**: Pan & zoom runs smoothly; 8-point crop boundary box maintains strict aspect ratio lock; subject anchor reticle correctly centers the crop window.
3. **Guide Overlays**: Rule of Thirds, Biometric Passport zones, and Golden Ratio toggle reliably with keyboard shortcuts and HUD buttons.
4. **Matting Bleed**: Cropping beyond image bounds fills with selected background color without visual artifacts.
5. **Export Fidelity**: Single download and Batch ZIP download respect chosen format (PNG/JPEG/WebP), max dimension scaling, and custom filename patterns.
6. **Zero TypeScript/Lint Errors**: Passes `tsc --noEmit` and Vite production build cleanly.

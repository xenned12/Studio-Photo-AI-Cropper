// tests/canvasStage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ViewportHUD } from '../src/components/layout/ViewportHUD';
import { CanvasDropZone } from '../src/components/canvas/CanvasDropZone';
import { CanvasStage } from '../src/components/canvas/CanvasStage';
import { ImageItem, ExtendedCropSettings, GuidesVisibility } from '../src/types';

describe('ViewportHUD', () => {
  const defaultGuides: GuidesVisibility = {
    ruleOfThirds: false,
    biometricGuide: false,
    goldenRatio: false,
    beforeAfterSplit: false,
  };

  it('renders zoom controls and scale percentage correctly', () => {
    const html = renderToStaticMarkup(
      <ViewportHUD
        transform={{ scale: 1.5, x: 100, y: 50 }}
        guides={defaultGuides}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onZoomFit={() => {}}
        onResetPan={() => {}}
        onToggleGuide={() => {}}
      />
    );
    expect(html).toContain('150%');
    expect(html).toContain('Zoom Out (-)');
    expect(html).toContain('Zoom In (+)');
    expect(html).toContain('Fit to Canvas (Z / F)');
    expect(html).toContain('Reset Pan &amp; Center');
  });

  it('highlights active guides correctly', () => {
    const activeGuides: GuidesVisibility = {
      ruleOfThirds: true,
      biometricGuide: true,
      goldenRatio: false,
      beforeAfterSplit: false,
    };
    const html = renderToStaticMarkup(
      <ViewportHUD
        transform={{ scale: 1, x: 0, y: 0 }}
        guides={activeGuides}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onZoomFit={() => {}}
        onResetPan={() => {}}
        onToggleGuide={() => {}}
      />
    );
    expect(html).toContain('bg-blue-600/30 text-blue-400');
    expect(html).toContain('bg-cyan-600/30 text-cyan-400');
  });
});

describe('CanvasDropZone', () => {
  it('renders dropzone prompt and action buttons', () => {
    const html = renderToStaticMarkup(
      <CanvasDropZone
        onFilesSelected={() => {}}
        onLoadSamples={() => {}}
        isProcessing={false}
      />
    );
    expect(html).toContain('Drop Studio Photos to Auto-Crop');
    expect(html).toContain('Browse Files');
    expect(html).toContain('Load Sample Headshots');
  });
});

describe('CanvasStage', () => {
  const mockSettings: ExtendedCropSettings = {
    ratioId: 'studio-4-5',
    customWidth: 1000,
    customHeight: 1250,
    isSwapped: false,
    headroomPercent: 15,
    scaleFactor: 1.0,
    horizontalOffsetPercent: 0,
    verticalOffsetPercent: 0,
    bleedFillMode: 'charcoal',
    bleedCustomColor: '#18181b',
    exportFormat: 'image/jpeg',
    quality: 0.92,
    exportMaxDimension: 0,
    filenameTemplate: '{name}_cropped_{ratio}',
  };

  const defaultGuides: GuidesVisibility = {
    ruleOfThirds: false,
    biometricGuide: false,
    goldenRatio: false,
    beforeAfterSplit: false,
  };

  it('renders CanvasDropZone when activeItem is null', () => {
    const html = renderToStaticMarkup(
      <CanvasStage
        activeItem={null}
        settings={mockSettings}
        guides={defaultGuides}
        isProcessing={false}
        onFilesSelected={() => {}}
        onLoadSamples={() => {}}
        onCropRectChange={() => {}}
        onHeadAnchorChange={() => {}}
        onToggleGuide={() => {}}
      />
    );
    expect(html).toContain('Drop Studio Photos to Auto-Crop');
    expect(html).toContain('Browse Files');
  });

  it('renders image, CropBoundingBox, and ViewportHUD when activeItem is present', () => {
    const mockItem: ImageItem = {
      id: 'test-1',
      name: 'model.jpg',
      size: 1024000,
      dimensions: { width: 2000, height: 3000 },
      originalUrl: 'blob:http://localhost/orig.jpg',
      detectedHead: { x: 0.3, y: 0.1, width: 0.4, height: 0.3, confidence: 0.95, source: 'mediapipe' },
      manualHead: null,
      cropRect: { x: 200, y: 100, width: 1600, height: 2000 },
      croppedUrl: 'blob:http://localhost/cropped.jpg',
      croppedBlob: null,
      status: 'cropped',
    };

    const html = renderToStaticMarkup(
      <CanvasStage
        activeItem={mockItem}
        settings={mockSettings}
        guides={defaultGuides}
        isProcessing={false}
        onFilesSelected={() => {}}
        onLoadSamples={() => {}}
        onCropRectChange={() => {}}
        onHeadAnchorChange={() => {}}
        onToggleGuide={() => {}}
      />
    );
    expect(html).toContain('src="blob:http://localhost/orig.jpg"');
    expect(html).toContain('1600 × 2000 px');
    expect(html).toContain('100%'); // ViewportHUD zoom scale
  });

  it('renders BeforeAfterSplit when split guide is enabled and croppedUrl exists', () => {
    const mockItem: ImageItem = {
      id: 'test-2',
      name: 'model.jpg',
      size: 1024000,
      dimensions: { width: 2000, height: 3000 },
      originalUrl: 'blob:http://localhost/orig.jpg',
      detectedHead: null,
      manualHead: null,
      cropRect: { x: 200, y: 100, width: 1600, height: 2000 },
      croppedUrl: 'blob:http://localhost/cropped.jpg',
      croppedBlob: null,
      status: 'cropped',
    };

    const splitGuides: GuidesVisibility = {
      ...defaultGuides,
      beforeAfterSplit: true,
    };

    const html = renderToStaticMarkup(
      <CanvasStage
        activeItem={mockItem}
        settings={mockSettings}
        guides={splitGuides}
        isProcessing={false}
        onFilesSelected={() => {}}
        onLoadSamples={() => {}}
        onCropRectChange={() => {}}
        onHeadAnchorChange={() => {}}
        onToggleGuide={() => {}}
      />
    );
    expect(html).toContain('Original (Left)');
    expect(html).toContain('Framed Crop (Right)');
  });
});

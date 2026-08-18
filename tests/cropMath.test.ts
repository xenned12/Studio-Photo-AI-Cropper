// tests/cropMath.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCropRect, calculateHandleResize, getBleedColorStyle } from '../src/utils/cropMath';
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

  it('handles all 8 resize handle directions with aspect ratio locking', () => {
    const initialRect: CropRect = { x: 200, y: 200, width: 400, height: 500 };
    const targetRatio = 0.8; // 4:5

    // NW handle: deltaX = -80 => newW = 400 - (-80) = 480, newH = 600, newX = 200 + (400-480) = 120, newY = 200 + (500-600) = 100
    const nw = calculateHandleResize(initialRect, 'nw', -80, -100, targetRatio);
    expect(nw).toEqual({ x: 120, y: 100, width: 480, height: 600 });

    // NE handle: deltaX = +80 => newW = 480, newH = 600, newX = 200, newY = 200 + (500-600) = 100
    const ne = calculateHandleResize(initialRect, 'ne', 80, -100, targetRatio);
    expect(ne).toEqual({ x: 200, y: 100, width: 480, height: 600 });

    // SW handle: deltaX = -80 => newW = 480, newH = 600, newX = 120, newY = 200
    const sw = calculateHandleResize(initialRect, 'sw', -80, 100, targetRatio);
    expect(sw).toEqual({ x: 120, y: 200, width: 480, height: 600 });

    // SE handle: deltaX = +80 => newW = 480, newH = 600, newX = 200, newY = 200
    const se = calculateHandleResize(initialRect, 'se', 80, 100, targetRatio);
    expect(se).toEqual({ x: 200, y: 200, width: 480, height: 600 });

    // E handle: deltaX = +80 => newW = 480, newH = 600, newX = 200, newY = 200 + (500-600)/2 = 150
    const e = calculateHandleResize(initialRect, 'e', 80, 0, targetRatio);
    expect(e).toEqual({ x: 200, y: 150, width: 480, height: 600 });

    // W handle: deltaX = -80 => newW = 400 + (-80 * -1) = 480, newH = 600, newX = 200 + (400-480) = 120, newY = 150
    const w = calculateHandleResize(initialRect, 'w', -80, 0, targetRatio);
    expect(w).toEqual({ x: 120, y: 150, width: 480, height: 600 });

    // S handle: deltaY = +100 => newH = 500 + 100 = 600, newW = 480, newX = 200 + (400-480)/2 = 160, newY = 200
    const s = calculateHandleResize(initialRect, 's', 0, 100, targetRatio);
    expect(s).toEqual({ x: 160, y: 200, width: 480, height: 600 });

    // N handle: deltaY = -100 => newH = 500 + (-100 * -1) = 600, newW = 480, newX = 160, newY = 200 + (500-600) = 100
    const n = calculateHandleResize(initialRect, 'n', 0, -100, targetRatio);
    expect(n).toEqual({ x: 160, y: 100, width: 480, height: 600 });
  });

  it('respects minDimension constraint during resize', () => {
    const initialRect: CropRect = { x: 100, y: 100, width: 200, height: 200 };
    const targetRatio = 1.0;
    const minDimension = 100;

    const resized = calculateHandleResize(initialRect, 'se', -150, -150, targetRatio, minDimension);
    expect(resized.width).toBe(100);
    expect(resized.height).toBe(100);
  });

  it('returns correct bleed fill color styles', () => {
    expect(getBleedColorStyle('white')).toBe('#ffffff');
    expect(getBleedColorStyle('gray')).toBe('#1e1e24');
    expect(getBleedColorStyle('charcoal')).toBe('#0f0f12');
    expect(getBleedColorStyle('transparent')).toBe('transparent');
    expect(getBleedColorStyle('custom', '#ff0000')).toBe('#ff0000');
    expect(getBleedColorStyle('custom')).toBe('#ffffff');
    // @ts-expect-error test fallback
    expect(getBleedColorStyle('unknown')).toBe('#ffffff');
  });
});

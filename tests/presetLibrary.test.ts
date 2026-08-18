// tests/presetLibrary.test.ts
import { describe, it, expect } from 'vitest';
import { STUDIO_PRESETS, getEffectiveAspectRatio, calculateAspectRatioValue, getPresetById } from '../src/utils/presetLibrary';
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

  it('retrieves preset by id or falls back to first preset', () => {
    const p = getPresetById('schengen-visa');
    expect(p.id).toBe('schengen-visa');

    const fallback = getPresetById('non-existent');
    expect(fallback.id).toBe(STUDIO_PRESETS[0].id);
  });
});

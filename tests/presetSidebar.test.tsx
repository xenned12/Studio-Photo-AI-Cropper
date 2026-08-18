// tests/presetSidebar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PresetSidebar } from '../src/components/sidebar/PresetSidebar';
import { ExtendedCropSettings } from '../src/types';

const defaultSettings: ExtendedCropSettings = {
  ratioId: 'us-passport',
  customWidth: 1000,
  customHeight: 1000,
  isSwapped: false,
  headroomPercent: 20,
  scaleFactor: 2.2,
  horizontalOffsetPercent: 0,
  verticalOffsetPercent: 0,
  bleedFillMode: 'white',
  bleedCustomColor: '#FFFFFF',
  exportFormat: 'image/jpeg',
  quality: 0.95,
  exportMaxDimension: 0,
  filenameTemplate: '{name}_cropped_{ratio}',
};

describe('PresetSidebar', () => {
  it('renders aspect ratio categories and presets', () => {
    const html = renderToStaticMarkup(
      <PresetSidebar
        settings={defaultSettings}
        onChange={() => {}}
      />
    );

    expect(html).toContain('Aspect Ratios');
    expect(html).toContain('Biometric &amp; Passports');
    expect(html).toContain('Studio &amp; Portraits');
    expect(html).toContain('Digital &amp; Social Media');
    expect(html).toContain('2×2&quot; US Passport');
    expect(html).toContain('Custom Dimensions');
  });

  it('reflects orientation swap state in buttons', () => {
    const swappedSettings: ExtendedCropSettings = {
      ...defaultSettings,
      isSwapped: true,
      ratioId: 'studio-4-5',
    };

    const html = renderToStaticMarkup(
      <PresetSidebar
        settings={swappedSettings}
        onChange={() => {}}
      />
    );

    expect(html).toContain('Landscape');
    // 4:5 swapped should display as 5:4
    expect(html).toContain('5:4');
  });

  it('renders custom dimension inputs when custom is selected', () => {
    const customSettings: ExtendedCropSettings = {
      ...defaultSettings,
      ratioId: 'custom',
      customWidth: 1200,
      customHeight: 800,
    };

    const html = renderToStaticMarkup(
      <PresetSidebar
        settings={customSettings}
        onChange={() => {}}
      />
    );

    expect(html).toContain('value="1200"');
    expect(html).toContain('value="800"');
  });
});

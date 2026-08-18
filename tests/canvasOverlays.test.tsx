// tests/canvasOverlays.test.tsx
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CompositionGuides } from '../src/components/canvas/CompositionGuides';
import { BeforeAfterSplit } from '../src/components/canvas/BeforeAfterSplit';
import { GuidesVisibility } from '../src/types';

describe('CompositionGuides', () => {
  const allFalseGuides: GuidesVisibility = {
    ruleOfThirds: false,
    biometricGuide: false,
    goldenRatio: false,
    beforeAfterSplit: false,
  };

  it('renders rule of thirds grid when ruleOfThirds is true', () => {
    const guides: GuidesVisibility = { ...allFalseGuides, ruleOfThirds: true };
    const html = renderToStaticMarkup(<CompositionGuides guides={guides} />);
    expect(html).toContain('grid-cols-3');
    expect(html).toContain('grid-rows-3');
    expect(html).not.toContain('Crown Limit');
    expect(html).not.toContain('left-[38.2%]');
  });

  it('renders golden ratio overlay when goldenRatio is true', () => {
    const guides: GuidesVisibility = { ...allFalseGuides, goldenRatio: true };
    const html = renderToStaticMarkup(<CompositionGuides guides={guides} />);
    expect(html).toContain('left-[38.2%]');
    expect(html).toContain('left-[61.8%]');
    expect(html).toContain('top-[38.2%]');
    expect(html).toContain('top-[61.8%]');
    expect(html).not.toContain('grid-cols-3');
    expect(html).not.toContain('Crown Limit');
  });

  it('renders biometric guides when biometricGuide is true', () => {
    const guides: GuidesVisibility = { ...allFalseGuides, biometricGuide: true };
    const html = renderToStaticMarkup(<CompositionGuides guides={guides} />);
    expect(html).toContain('Crown Limit');
    expect(html).toContain('Eyeline Horizon');
    expect(html).toContain('Chin Base');
    expect(html).toContain('ICAO/US');
  });

  it('renders biometric guides when isBiometricPreset is true even if biometricGuide is false', () => {
    const html = renderToStaticMarkup(
      <CompositionGuides guides={allFalseGuides} isBiometricPreset={true} />
    );
    expect(html).toContain('Crown Limit');
    expect(html).toContain('Eyeline Horizon');
    expect(html).toContain('Chin Base');
  });

  it('renders empty container when all guides are disabled', () => {
    const html = renderToStaticMarkup(<CompositionGuides guides={allFalseGuides} />);
    expect(html).toBe('<div class="absolute inset-0 pointer-events-none overflow-hidden"></div>');
  });
});

describe('BeforeAfterSplit', () => {
  it('renders original image and cropped image layers with slider divider', () => {
    const html = renderToStaticMarkup(
      <BeforeAfterSplit
        originalUrl="blob:http://localhost/orig.jpg"
        croppedUrl="blob:http://localhost/crop.jpg"
      />
    );
    expect(html).toContain('src="blob:http://localhost/orig.jpg"');
    expect(html).toContain('src="blob:http://localhost/crop.jpg"');
    expect(html).toContain('Original (Left)');
    expect(html).toContain('Framed Crop (Right)');
    expect(html).toContain('clip-path:polygon(50% 0, 100% 0, 100% 100%, 50% 100%)');
  });
});

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

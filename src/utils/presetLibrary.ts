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

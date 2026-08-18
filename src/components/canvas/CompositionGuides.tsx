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
          <div className="border-r border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
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

import React from 'react';
import { MaterialProperties } from '../types/material';
import { Grid, Check, Sparkles } from 'lucide-react';

interface CompactSlotVisualizerProps {
  properties: MaterialProperties;
  onSelectSlot: (slotIndex: number) => void;
}

export const CompactSlotVisualizer: React.FC<CompactSlotVisualizerProps> = ({
  properties,
  onSelectSlot,
}) => {
  // Generate 24 slots (4 rows of 6 slots, classic 3ds Max layout)
  const slots = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <div className="w-full bg-[#13161D] rounded-lg border border-[#222731] p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-[#222731] pb-2">
        <div className="flex items-center gap-1.5">
          <Grid className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">Compact Medit (1–24 Slot)</span>
        </div>
        <div className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
          Aktif Slot: #{properties.compactSlotIndex} ({properties.name})
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Click any slot to specify where the generated material will be assigned in 3ds Max <code className="text-slate-300 font-mono">meditMaterials[slot]</code>.
      </p>

      {/* 4x6 Grid of 3ds Max Material Sample Spheres */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 p-2 bg-[#0E1015] rounded border border-[#1E232D]">
        {slots.map((slotNum) => {
          const isSelected = slotNum === properties.compactSlotIndex;

          return (
            <button
              key={slotNum}
              type="button"
              onClick={() => onSelectSlot(slotNum)}
              className={`relative aspect-square rounded-full flex items-center justify-center transition-all ${
                isSelected
                  ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0E1015] scale-105'
                  : 'hover:border-slate-500 opacity-75 hover:opacity-100'
              }`}
              style={{
                background: isSelected
                  ? properties.metalnessMode
                    ? 'radial-gradient(circle at 35% 35%, #fef08a 0%, #ca8a04 50%, #422006 100%)'
                    : 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 45%, #1e293b 100%)'
                  : 'radial-gradient(circle at 35% 35%, #94a3b8 0%, #475569 55%, #0f172a 100%)',
                boxShadow: isSelected
                  ? '0 0 12px rgba(245, 158, 11, 0.4), inset -2px -2px 6px rgba(0,0,0,0.6)'
                  : 'inset -2px -2px 5px rgba(0,0,0,0.7)',
              }}
            >
              <span
                className={`text-[10px] font-mono font-bold drop-shadow ${
                  isSelected ? 'text-black font-extrabold' : 'text-white/80'
                }`}
              >
                {slotNum}
              </span>
              {isSelected && (
                <div className="absolute -top-1 -right-1 bg-amber-400 text-black rounded-full p-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

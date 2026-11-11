import React from 'react';
import { MaterialProperties, TextureMapSlot } from '../types/material';
import { Layers, Sliders, CheckCircle2, AlertCircle, ArrowRight, Wand2 } from 'lucide-react';

interface SlateNodeVisualizerProps {
  properties: MaterialProperties;
  slots: Record<string, TextureMapSlot>;
  onOpenProperties: () => void;
  onSlotClick?: (channelKey: string) => void;
}

export const SlateNodeVisualizer: React.FC<SlateNodeVisualizerProps> = ({
  properties,
  slots,
  onOpenProperties,
  onSlotClick,
}) => {
  const isCorona = properties.engine === 'corona';

  return (
    <div className="w-full bg-[#13161D] rounded-lg border border-[#222731] p-3 flex flex-col gap-3">
      {/* SME Header Bar */}
      <div className="flex items-center justify-between border-b border-[#222731] pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">Slate SME Düğüm Ağacı Simülasyonu</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-[10px] font-mono text-slate-400">PBR Studio Auto</span>
        </div>
        <button
          onClick={onOpenProperties}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded transition-colors"
        >
          <Sliders className="w-3 h-3" />
          <span>Material Özellikleri</span>
        </button>
      </div>

      {/* Interactive Node Graph Area */}
      <div className="relative bg-[#0E1015] rounded border border-[#1E232D] p-5 min-h-[300px] overflow-x-auto flex items-center justify-between gap-6">
        {/* Subtle grid background to look like 3ds Max SME canvas */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(#3B4455 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* LEFT COLUMN: Input Bitmap & Generator Nodes */}
        <div className="flex flex-col gap-3 min-w-[210px] z-10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1">Source Map Nodes</span>

          {/* Diffuse Node */}
          {slots['diffuse']?.isAssigned ? (
            <div
              onClick={() => onSlotClick?.('diffuse')}
              className="bg-[#1C2029] border border-amber-500/40 rounded p-2.5 shadow-sm hover:border-amber-400 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                <span className="truncate max-w-[130px]">{slots['diffuse'].fileName}</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1 rounded">sRGB</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{isCorona ? 'CoronaBitmap' : 'VRayBitmap'}</span>
                <span className="text-emerald-400 text-[10px]">Diffuse ➔</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#151820] border border-dashed border-slate-700 rounded p-2 text-xs text-slate-500">
              No Diffuse Map
            </div>
          )}

          {/* Roughness Node (Raw or Derived) */}
          {slots['roughness']?.isAssigned ? (
            slots['roughness'].isDerived ? (
              <div
                onClick={onOpenProperties}
                className="bg-[#211E2B] border border-purple-500/50 rounded p-2.5 shadow-sm hover:border-purple-400 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-purple-200">
                  <Wand2 className="w-3 h-3 text-purple-400" />
                  <span>CoronaColorCorrect</span>
                </div>
                <div className="text-[10px] text-purple-300/80 mt-1">
                  Derived from Diffuse (Invert: ON, Contrast: +{slots['roughness'].colorCorrect.contrast})
                </div>
                <div className="text-[10px] font-mono text-amber-300 mt-0.5 text-right">Roughness ➔</div>
              </div>
            ) : (
              <div
                onClick={() => onSlotClick?.('roughness')}
                className="bg-[#1C2029] border border-slate-700 rounded p-2.5 shadow-sm hover:border-amber-400 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                  <span className="truncate max-w-[130px]">{slots['roughness'].fileName}</span>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1 rounded">Raw 1.0</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{isCorona ? 'CoronaBitmap' : 'VRayBitmap'}</span>
                  <span className="text-amber-400 text-[10px]">Roughness ➔</span>
                </div>
              </div>
            )
          ) : (
            <div
              onClick={onOpenProperties}
              className="bg-[#151820] border border-dashed border-purple-800/60 rounded p-2 text-xs text-purple-300/70 cursor-pointer hover:border-purple-500 transition-colors flex items-center justify-between"
            >
              <span>+ Derive with CoronaColorCorrect</span>
              <Wand2 className="w-3 h-3 text-purple-400" />
            </div>
          )}

          {/* Normal Node */}
          {slots['normal']?.isAssigned ? (
            <div
              onClick={() => onSlotClick?.('normal')}
              className="bg-[#1C2029] border border-blue-500/40 rounded p-2.5 shadow-sm hover:border-blue-400 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                <span className="truncate max-w-[130px]">{slots['normal'].fileName}</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1 rounded">Raw 1.0</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{isCorona ? 'CoronaNormal' : 'VRayNormalMap'}</span>
                <span className="text-blue-400 text-[10px]">Normal/Bump ➔</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#151820] border border-dashed border-slate-700 rounded p-2 text-xs text-slate-500">
              No Normal Map
            </div>
          )}

          {/* Displacement Node (Raw or Derived) */}
          {slots['height']?.isAssigned ? (
            slots['height'].isDerived ? (
              <div
                onClick={onOpenProperties}
                className="bg-[#211E2B] border border-purple-500/50 rounded p-2 shadow-sm hover:border-purple-400 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1 text-[11px] font-medium text-purple-200">
                  <Wand2 className="w-3 h-3 text-purple-400" />
                  <span>CoronaColorCorrect (Disp)</span>
                </div>
                <div className="text-[9px] text-purple-300/80 mt-0.5">
                  Depth: {properties.displacementAmount}cm · Contrast: +{slots['height'].colorCorrect.contrast}
                </div>
                <div className="text-[9px] font-mono text-purple-300 mt-0.5 text-right">Displacement ➔</div>
              </div>
            ) : (
              <div
                onClick={() => onSlotClick?.('height')}
                className="bg-[#1C2029] border border-slate-700 rounded p-2 shadow-sm hover:border-amber-400 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                  <span className="truncate max-w-[120px]">{slots['height'].fileName}</span>
                  <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1 rounded">Raw 1.0</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                  <span>{isCorona ? 'CoronaBitmap' : 'VRayBitmap'}</span>
                  <span className="text-purple-400 text-[9px]">Disp ➔</span>
                </div>
              </div>
            )
          ) : null}

          {/* Metalness if present */}
          {slots['metalness']?.isAssigned && (
            <div
              onClick={() => onSlotClick?.('metalness')}
              className="bg-[#1C2029] border border-slate-700 rounded p-2 shadow-sm hover:border-amber-400 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                <span className="truncate max-w-[120px]">{slots['metalness'].fileName}</span>
                <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1 rounded">Raw 1.0</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                <span>{isCorona ? 'CoronaBitmap' : 'VRayBitmap'}</span>
                <span className="text-slate-300 text-[9px]">Metalness ➔</span>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE: Visual Connection Flow Wire Indicators */}
        <div className="flex flex-col items-center justify-center gap-4 text-slate-600">
          <ArrowRight className="w-5 h-5 text-amber-500/40 animate-pulse" />
          <ArrowRight className="w-5 h-5 text-purple-500/40" />
          <ArrowRight className="w-5 h-5 text-blue-500/40" />
        </div>

        {/* RIGHT COLUMN: Master 3ds Max Material Node */}
        <div className="min-w-[240px] bg-[#181B22] border-2 border-amber-500/80 rounded-md shadow-xl overflow-hidden z-10">
          {/* Node Title Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-white tracking-wide truncate">
              {properties.name}
            </span>
            <span className="text-[10px] font-mono bg-black/30 text-amber-200 px-1.5 py-0.5 rounded uppercase">
              {properties.engine === 'corona' ? 'CoronaPhysicalMtl' : 'VRayMtl'}
            </span>
          </div>

          {/* Node Channel Input Slots */}
          <div className="p-2.5 flex flex-col gap-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between py-0.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${slots['diffuse']?.isAssigned ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                Base Color (Diffuse)
              </span>
              <span className="text-slate-400 text-[10px]">{slots['diffuse']?.isAssigned ? 'Connected' : 'Default'}</span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${slots['roughness']?.isAssigned ? (slots['roughness'].isDerived ? 'bg-purple-400' : 'bg-amber-400') : 'bg-slate-600'}`} />
                Roughness
              </span>
              <span className="text-[10px]">
                {slots['roughness']?.isDerived ? (
                  <span className="text-purple-400">ColorCorrect</span>
                ) : slots['roughness']?.isAssigned ? (
                  <span className="text-emerald-400">Map</span>
                ) : (
                  <span className="text-slate-500">{properties.roughnessMode === 'roughness' ? '0.35' : '0.65'}</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${slots['normal']?.isAssigned ? 'bg-blue-400' : 'bg-slate-600'}`} />
                Base Bump (Normal)
              </span>
              <span className="text-slate-400 text-[10px]">{slots['normal']?.isAssigned ? properties.normalType.toUpperCase() : 'None'}</span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${slots['metalness']?.isAssigned ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                Metalness
              </span>
              <span className="text-slate-400 text-[10px]">{slots['metalness']?.isAssigned ? 'Map' : properties.metalnessMode ? '1.0' : '0.0'}</span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${slots['height']?.isAssigned ? 'bg-orange-400' : 'bg-slate-600'}`} />
                Displacement
              </span>
              <span className="text-slate-400 text-[10px]">{slots['height']?.isAssigned ? `${properties.displacementAmount}cm` : 'Off'}</span>
            </div>
          </div>

          {/* Node Footer */}
          <div className="bg-[#111317] px-3 py-1.5 text-[10px] text-slate-400 border-t border-slate-800 flex items-center justify-between">
            <span>IOR: {properties.ior.toFixed(2)}</span>
            <span className="text-amber-400">Auto-Layout Node</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  MaterialProperties,
  TextureMapSlot,
  PbrChannel,
  AiAnalysisResult,
  RenderEngine,
} from '../types/material';
import { AiTextureInspector } from './AiTextureInspector';
import {
  Folder,
  FolderUp,
  Sliders,
  FileCode,
  Wand2,
  Trash2,
  Zap,
  Play,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Download,
  CheckCircle2,
} from 'lucide-react';

interface PresetItem {
  name: string;
  category: string;
  engine: RenderEngine;
  ior: number;
  metalnessMode: boolean;
  textureGenerator: 'wood' | 'metal' | 'marble';
  files: { name: string; channel: PbrChannel; path: string }[];
  deriveRoughness: boolean;
  deriveDisplacement: boolean;
}

const PRESET_LIST = [
  { name: 'Mtl_Nordic_Natural_Oak', label: 'Nordic Oak' },
  { name: 'Mtl_Industrial_Steel_Brushed', label: 'Brushed Steel' },
  { name: 'Mtl_Carrara_Marble_Polished', label: 'Carrara Marble' },
];

interface WizardPbrStudioProps {
  properties: MaterialProperties;
  setProperties: React.Dispatch<React.SetStateAction<MaterialProperties>>;
  slots: Record<string, TextureMapSlot>;
  setSlots: React.Dispatch<React.SetStateAction<Record<string, TextureMapSlot>>>;
  activeSelectedChannel: string;
  setActiveSelectedChannel: (chan: string) => void;
  targetFolderPath: string;
  setTargetFolderPath: (path: string) => void;
  allUploadedFileNames: string[];
  unmatchedFiles: { file: File; previewUrl: string }[];
  processFileList: (files: File[]) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSingleSlotUpload: (channel: PbrChannel, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearSlot: (channel: PbrChannel, e?: React.MouseEvent) => void;
  handleClearAll: () => void;
  handleAssignUnmatched: (channel: PbrChannel, item: { file: File; previewUrl: string }) => void;
  handleDirectAutoDisplacement: () => void;
  handleCopyDirectScript: () => void;
  handleCopyRolloutScript?: () => void;
  handleDownloadDirectMs: () => void;
  setIsPropertiesOpen: (open: boolean) => void;
  setIsScriptModalOpen: (open: boolean) => void;
  loadPresetByName: (presetName: string) => void;
  handleApplyAiResult: (res: AiAnalysisResult) => void;
}

export const WizardPbrStudio: React.FC<WizardPbrStudioProps> = ({
  properties,
  setProperties,
  slots,
  activeSelectedChannel,
  setActiveSelectedChannel,
  targetFolderPath,
  setTargetFolderPath,
  allUploadedFileNames,
  unmatchedFiles,
  processFileList,
  handleFileUpload,
  handleSingleSlotUpload,
  handleClearSlot,
  handleClearAll,
  handleAssignUnmatched,
  handleDirectAutoDisplacement,
  handleCopyDirectScript,
  handleCopyRolloutScript,
  handleDownloadDirectMs,
  setIsPropertiesOpen,
  setIsScriptModalOpen,
  loadPresetByName,
  handleApplyAiResult,
}) => {
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  return (
    <div className="flex flex-col gap-2 font-sans select-none text-[#d6dae2]">
      {/* =======================================================================
          3-STEP WIZARD NAVIGATION HEADER (3DS MAX COMPACT BEVELED TABS)
         ======================================================================= */}
      <div className="flex items-center bg-[#1c1e25] border border-[#14161c] p-1 rounded-[2px] gap-1 shadow-inner">
        <button
          onClick={() => setWizardStep(1)}
          className={`flex-1 py-1 px-2 rounded-[2px] text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all ${
            wizardStep === 1
              ? 'bg-amber-500 text-black border border-amber-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.25)]'
              : 'bg-[#2b2e38] text-slate-300 hover:bg-[#383d47] border border-[#1e2026]'
          }`}
        >
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono ${wizardStep === 1 ? 'bg-black/30 text-amber-100 font-black' : 'bg-black/40 text-slate-400'}`}>
            1
          </span>
          <span>1. Dokular & Haritalar</span>
        </button>

        <button
          onClick={() => setWizardStep(2)}
          className={`flex-1 py-1 px-2 rounded-[2px] text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all ${
            wizardStep === 2
              ? 'bg-amber-500 text-black border border-amber-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.25)]'
              : 'bg-[#2b2e38] text-slate-300 hover:bg-[#383d47] border border-[#1e2026]'
          }`}
        >
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono ${wizardStep === 2 ? 'bg-black/30 text-amber-100 font-black' : 'bg-black/40 text-slate-400'}`}>
            2
          </span>
          <span>2. PBR & CC Ayarları</span>
        </button>

        <button
          onClick={() => setWizardStep(3)}
          className={`flex-1 py-1 px-2 rounded-[2px] text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all ${
            wizardStep === 3
              ? 'bg-amber-500 text-black border border-amber-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.25)]'
              : 'bg-[#2b2e38] text-slate-300 hover:bg-[#383d47] border border-[#1e2026]'
          }`}
        >
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono ${wizardStep === 3 ? 'bg-black/30 text-amber-100 font-black' : 'bg-black/40 text-slate-400'}`}>
            3
          </span>
          <span>3. Sahneye Aktar (.ms)</span>
        </button>
      </div>

      {/* =======================================================================
          AŞAMA 1: DOKULAR & HARİTALAR (SOURCE MAPS & SLOTS)
         ======================================================================= */}
      {wizardStep === 1 && (
        <div className="flex flex-col gap-2 animate-fadeIn">
          {/* Windows Folder Path & File Pickers */}
          <div className="border border-[#1f2228] bg-[#24272f] p-2 rounded-[2px] shadow flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#1b1d22] pb-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>Doku Klasörü & Dosya Yolu:</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">
                {allUploadedFileNames.length > 0 ? `${allUploadedFileNames.length} Dosya Yüklendi` : 'Boş'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#181a1f] p-1 rounded-[2px] border border-[#323640]">
              <input
                type="text"
                value={targetFolderPath}
                onChange={(e) => setTargetFolderPath(e.target.value)}
                placeholder="C:\Textures\Material_Set_01"
                className="flex-1 bg-transparent border-none outline-none font-mono text-amber-300 text-[11px] px-1"
              />
              <div className="flex items-center gap-1 shrink-0">
                <label className="cursor-pointer px-2 py-0.5 bg-[#31353e] hover:bg-[#3d424e] text-slate-200 hover:text-white border border-[#202227] rounded-[2px] text-[10px] font-medium transition-all shadow-sm flex items-center gap-1">
                  <FolderUp className="w-3 h-3 text-cyan-400" />
                  <span>📁 Klasör Seç</span>
                  <input
                    type="file"
                    // @ts-expect-error webkitdirectory standard
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <label className="cursor-pointer px-2 py-0.5 bg-[#31353e] hover:bg-[#3d424e] text-slate-200 hover:text-white border border-[#202227] rounded-[2px] text-[10px] font-medium transition-all shadow-sm flex items-center gap-1">
                  <span>📄 Toplu Seç</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.png,.jpg,.jpeg,.exr,.tif,.tiff"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Drag & Drop Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processFileList(Array.from(e.dataTransfer.files));
                }
              }}
              className={`border rounded-[2px] p-1.5 text-center transition-all ${
                isDraggingOver
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-dashed border-[#3a3f4c] bg-[#1a1c22]'
              }`}
            >
              <div className="text-[10px] text-slate-300">
                Kaplama dosyalarını buraya bırakın; doğru isme gelerek kutular otomatik dolar.
              </div>
            </div>
          </div>

          {/* 6 PBR Map Slots */}
          <div className="border border-[#1f2228] bg-[#24272f] p-2 rounded-[2px] shadow flex flex-col gap-1.5">
            <div className="flex items-center justify-between border-b border-[#1b1d22] pb-1 text-[11px]">
              <span className="font-bold text-slate-200">PBR Map Slotları (Kutucuklar)</span>
              <span className="text-[9px] font-mono text-slate-400">
                Tıkla: 3D Önizle | Değiştir: Yeni Dosya Seç
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
              {(
                [
                  { key: 'diffuse', label: 'DIFFUSE', desc: 'BaseColor / Renk' },
                  { key: 'roughness', label: 'ROUGHNESS', desc: 'Pürüzlülük' },
                  { key: 'normal', label: 'NORMAL', desc: 'Bump / Eğim' },
                  { key: 'height', label: 'DISPLACEMENT', desc: 'Derinlik' },
                  { key: 'metalness', label: 'METALLIC', desc: 'Metalik' },
                  { key: 'ao', label: 'AO', desc: 'Ortam Gölgesi' },
                ] as { key: PbrChannel; label: string; desc: string }[]
              ).map(({ key: cKey, label, desc }) => {
                const s = slots[cKey];
                const isFilled = Boolean(s?.previewUrl || (s?.isAssigned && s?.fileName));
                const isSelected = activeSelectedChannel === cKey;

                return (
                  <div
                    key={cKey}
                    onClick={() => {
                      if (isFilled) setActiveSelectedChannel(cKey);
                    }}
                    className={`flex flex-col gap-1 p-1 rounded-[2px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-400 border-amber-400 bg-[#292c34]'
                        : isFilled
                        ? s?.isDerived
                          ? 'bg-[#23202b] border-purple-500/50 hover:border-purple-400 shadow-sm'
                          : 'bg-[#22252c] border-[#383d47] hover:border-amber-400 shadow-sm'
                        : 'bg-[#181a1f] border-dashed border-[#333742] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-slate-200 truncate">
                        {label}
                      </span>
                      {isFilled && (
                        <button
                          onClick={(e) => handleClearSlot(cKey, e)}
                          title="Bu kutuyu temizle"
                          className="text-slate-500 hover:text-red-400 text-[10px] p-0.5 rounded transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {isFilled ? (
                      <div className="relative w-full aspect-square rounded-[2px] border border-[#3b404d] bg-black/80 overflow-hidden group">
                        {s.previewUrl ? (
                          <img
                            src={s.previewUrl}
                            alt={label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-purple-950/40">
                            <Wand2 className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
                            <span className="text-[7px] font-mono text-purple-300">Corona CC</span>
                          </div>
                        )}

                        <div className="absolute top-0.5 left-0.5 bg-amber-500 text-black font-bold text-[7px] font-mono px-0.5 rounded-[1px] shadow">
                          M
                        </div>

                        {s?.isDerived && (
                          <div className="absolute top-0.5 right-0.5 bg-purple-900 text-purple-200 text-[7px] font-mono px-0.5 rounded-[1px] shadow">
                            CC
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                          <label
                            onClick={(e) => e.stopPropagation()}
                            className="cursor-pointer px-1 py-0.5 bg-amber-500 text-black text-[8px] font-bold rounded-[2px] shadow hover:bg-amber-400 transition-colors"
                          >
                            Değiştir
                            <input
                              type="file"
                              accept="image/*,.png,.jpg,.jpeg,.exr,.tif,.tiff"
                              onChange={(e) => handleSingleSlotUpload(cKey, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full aspect-square rounded-[2px] border border-dashed border-[#383d49] hover:border-amber-400 bg-[#16181d] hover:bg-amber-500/5 cursor-pointer flex flex-col items-center justify-center p-1 text-center transition-all group"
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-[#262932] group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition-colors mb-0.5 text-[9px]">
                          +
                        </div>
                        <span className="text-[8px] font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                          [ None ]
                        </span>
                        <input
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg,.exr,.tif,.tiff"
                          onChange={(e) => handleSingleSlotUpload(cKey, e)}
                          className="hidden"
                        />
                      </label>
                    )}

                    <div className="text-[8px] font-mono text-slate-400 truncate mt-0.5">
                      {isFilled ? (
                        cKey === 'diffuse' ? (
                          <span className="text-emerald-400 font-semibold truncate flex items-center gap-1">
                            <span className="truncate">{s?.fileName || 'Yüklendi'}</span>
                            <span className="shrink-0 text-[7px] px-1 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                              Saf RGB
                            </span>
                          </span>
                        ) : s?.isDerived ? (
                          <span className="text-purple-300 font-semibold truncate flex items-center gap-0.5">
                            <Wand2 className="w-2 h-2 text-purple-400 shrink-0" />
                            <span className="truncate">Oto CC</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 truncate">{s?.fileName || 'Yüklendi'}</span>
                        )
                      ) : (
                        <span className="text-slate-500 italic truncate">{desc}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Presets & Clear Toolbar */}
          <div className="border border-[#1f2228] bg-[#24272f] p-2 rounded-[2px] shadow flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-medium text-[10px]">Hızlı Test Şablonları:</span>
              {PRESET_LIST.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPresetByName(preset.name)}
                  className={`px-1.5 py-0.5 text-[9.5px] rounded-[2px] transition-all border ${
                    properties.name === preset.name
                      ? 'bg-amber-500 text-black border-amber-600 font-bold'
                      : 'bg-[#31353e] hover:bg-[#3c414c] text-slate-200 border-[#1f2127]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleClearAll}
              className="text-[9px] text-slate-400 hover:text-red-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#1a1c22] border border-transparent hover:border-[#2e3340]"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>Slotları Temizle</span>
            </button>
          </div>

          {/* Unmatched Files Tray if any */}
          {unmatchedFiles.length > 0 && (
            <div className="p-2 bg-[#202228] border border-[#2d313c] rounded-[2px] flex flex-col gap-1.5 text-xs">
              <span className="text-[10px] font-semibold text-amber-300">
                Eşleşmeyen {unmatchedFiles.length} görsel bulundu (Tek tıkla ata):
              </span>
              <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1">
                {unmatchedFiles.map((item, idx) => (
                  <div
                    key={`${item.file.name}-${idx}`}
                    className="flex items-center justify-between gap-2 p-1 bg-[#181a1f] border border-[#2d313c] rounded-[2px] text-xs"
                  >
                    <span className="font-mono text-slate-300 truncate text-[10px]" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {(['diffuse', 'roughness', 'normal', 'height'] as PbrChannel[]).map((ch) => (
                        <button
                          key={ch}
                          onClick={() => handleAssignUnmatched(ch, item)}
                          className="px-1 py-0.2 text-[8px] font-semibold bg-[#31353e] hover:bg-amber-500 hover:text-black text-slate-300 rounded-[1px]"
                        >
                          +{ch.slice(0, 4)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 Footer: Advance to Step 2 */}
          <div className="flex items-center justify-end pt-1">
            <button
              onClick={() => setWizardStep(2)}
              className="px-3.5 py-1.5 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-[2px] shadow flex items-center gap-1.5 transition-all"
            >
              <span>Sonraki: 2. PBR & CC Ayarları</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =======================================================================
          AŞAMA 2: PBR & CORONA COLOR CORRECT AYARLARI (TUNING & PHYSICAL)
         ======================================================================= */}
      {wizardStep === 2 && (
        <div className="flex flex-col gap-2 animate-fadeIn">
          {/* Architecture note */}
          <div className="border border-[#1f2228] bg-[#24272f] p-2 rounded-[2px] shadow flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div className="text-[10px] text-slate-300">
                <span className="font-semibold text-white">Saf Diffuse Koruması:</span> Orijinal Diffuse dokusu %100 saf kalır. Roughness ve Displacement bağımsız <code className="text-purple-300">CoronaColorCorrect</code> düğümleriyle türetilir.
              </div>
            </div>
            <button
              onClick={handleDirectAutoDisplacement}
              className="shrink-0 px-2 py-0.5 text-[9px] font-semibold bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 border border-purple-500/50 rounded-[2px] flex items-center gap-1"
            >
              <Zap className="w-2.5 h-2.5 text-purple-400 fill-purple-400" />
              <span>Oto Displacement</span>
            </button>
          </div>

          {/* Corona Color Correct Tuning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Roughness Node Preview */}
            <div className="border border-[#1f2228] bg-[#24272f] p-2 rounded-[2px] shadow flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-200 border-b border-[#1b1d22] pb-0.5">
                <span>Roughness (Pürüzlülük Düğümü):</span>
                <span className="text-purple-300 font-mono text-[9px]">
                  {slots['roughness']?.isDerived ? 'CoronaColorCorrect (Oto)' : 'Özel Harita'}
                </span>
              </div>
              <div className="text-[9.5px] font-mono text-slate-300 space-y-1">
                <label className="flex items-center justify-between">
                  <span className="text-slate-400">Invert (Ahşap/Taş için Ters):</span>
                  <span className="text-amber-400 font-bold">{slots['roughness']?.colorCorrect?.invert ? 'AÇIK (ON)' : 'KAPALI'}</span>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-slate-400">Gamma:</span>
                  <span className="text-amber-400 font-bold">{slots['roughness']?.colorCorrect?.gamma || 0.85}</span>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-slate-400">Contrast:</span>
                  <span className="text-amber-400 font-bold">{slots['roughness']?.colorCorrect?.contrast || 0.25}</span>
                </label>
              </div>
            </div>

            {/* Displacement Node Preview */}
            <div className="border border-[#1f2228] bg-[#24272f] p-2 rounded-[2px] shadow flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-200 border-b border-[#1b1d22] pb-0.5">
                <span>Displacement (Derinlik Düğümü):</span>
                <span className="text-purple-300 font-mono text-[9px]">
                  {slots['height']?.isDerived ? 'CoronaColorCorrect (Oto)' : 'Özel Harita'}
                </span>
              </div>
              <div className="text-[9.5px] font-mono text-slate-300 space-y-1">
                <label className="flex items-center justify-between">
                  <span className="text-slate-400">Maks Derinlik (cm):</span>
                  <span className="text-purple-300 font-bold">{properties.displacementAmount} cm</span>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-slate-400">Gamma:</span>
                  <span className="text-amber-400 font-bold">{slots['height']?.colorCorrect?.gamma || 0.95}</span>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-slate-400">Contrast:</span>
                  <span className="text-amber-400 font-bold">{slots['height']?.colorCorrect?.contrast || 0.55}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Physical Material Spinners */}
          <div className="border border-[#1f2228] bg-[#24272f] p-2 rounded-[2px] shadow flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between border-b border-[#1b1d22] pb-1">
              <span className="font-bold text-slate-200 text-[11px]">Fiziksel Parametreler (CoronaPhysicalMtl)</span>
              <button
                onClick={() => setIsPropertiesOpen(true)}
                className="text-[9px] text-amber-400 hover:text-white flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-[#202227]"
              >
                <Sliders className="w-2.5 h-2.5" />
                <span>Gelişmiş Ayarlar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span>IOR (Kırılma):</span>
                  <span className="text-amber-400 font-bold">{properties.ior.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.01"
                  value={properties.ior}
                  onChange={(e) => setProperties((p) => ({ ...p, ior: parseFloat(e.target.value) }))}
                  className="accent-amber-500 cursor-pointer h-1.5 bg-[#181a1f] rounded"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span>Displacement (cm):</span>
                  <span className="text-purple-300 font-bold">{properties.displacementAmount.toFixed(1)} cm</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="10.0"
                  step="0.5"
                  value={properties.displacementAmount}
                  onChange={(e) => setProperties((p) => ({ ...p, displacementAmount: parseFloat(e.target.value) }))}
                  className="accent-purple-400 cursor-pointer h-1.5 bg-[#181a1f] rounded"
                />
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={() => setProperties((p) => ({ ...p, metalnessMode: !p.metalnessMode }))}
                  className={`py-1 px-1.5 rounded-[2px] border text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    properties.metalnessMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-[#181a1f] text-slate-400 border-[#323640] hover:text-slate-200'
                  }`}
                >
                  <span>Metalik Mod:</span>
                  <span className="font-bold">{properties.metalnessMode ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 Footer: Back to Step 1 or Advance to Step 3 */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setWizardStep(1)}
              className="px-3 py-1 bg-[#2b2e38] hover:bg-[#383d47] text-slate-200 border border-[#1e2026] text-xs font-semibold rounded-[2px] flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Geri: Dokular</span>
            </button>

            <button
              onClick={() => setWizardStep(3)}
              className="px-3.5 py-1.5 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-[2px] shadow flex items-center gap-1.5 transition-all"
            >
              <span>Sonraki: 3. Sahneye Aktar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =======================================================================
          AŞAMA 3: SAHNEYE AKTAR (.MS) (OUTPUT & SCENE APPLY)
         ======================================================================= */}
      {wizardStep === 3 && (
        <div className="flex flex-col gap-2 animate-fadeIn">
          {/* Material Identity & Engine Choice */}
          <div className="border border-[#1f2228] bg-[#24272f] p-2.5 rounded-[2px] shadow flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between border-b border-[#1b1d22] pb-1">
              <span className="font-bold text-slate-200 text-[11px]">Materyal Kimliği & Render Motoru</span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1 py-0.2 rounded">
                Hazır
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9.5px] font-mono text-slate-400">Materyal Adı:</label>
                <input
                  type="text"
                  value={properties.name}
                  onChange={(e) => setProperties((p) => ({ ...p, name: e.target.value }))}
                  className="bg-[#181a1f] border border-[#363a45] rounded-[2px] px-2 py-1 text-slate-200 font-mono text-[11px] focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[9.5px] font-mono text-slate-400">Render Motoru:</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setProperties((p) => ({ ...p, engine: 'corona' }))}
                    className={`flex-1 py-1 rounded-[2px] font-bold text-[10.5px] transition-all border ${
                      properties.engine === 'corona'
                        ? 'bg-amber-500 text-black border-amber-600 shadow-sm'
                        : 'bg-[#181a1f] text-slate-400 border-[#323640]'
                    }`}
                  >
                    Corona 11/12
                  </button>
                  <button
                    onClick={() => setProperties((p) => ({ ...p, engine: 'vray' }))}
                    className={`flex-1 py-1 rounded-[2px] font-bold text-[10.5px] transition-all border ${
                      properties.engine === 'vray'
                        ? 'bg-cyan-500 text-black border-cyan-600 shadow-sm'
                        : 'bg-[#181a1f] text-slate-400 border-[#323640]'
                    }`}
                  >
                    Chaos V-Ray
                  </button>
                </div>
              </div>
            </div>

            {/* Target Editor options */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#1e2026]">
              <span>Editör Hedefi: <strong className="text-slate-200">Slate SME (Node) & Compact Slot {properties.compactSlotIndex}</strong></span>
              <label className="flex items-center gap-1 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={properties.applyToSelected}
                  onChange={(e) => setProperties((p) => ({ ...p, applyToSelected: e.target.checked }))}
                  className="accent-amber-500 rounded-[1px]"
                />
                <span>Seçili Nesneye Ata</span>
              </label>
            </div>
          </div>

          {/* Big Direct Scene Apply Action Buttons */}
          <div className="border border-[#1f2228] bg-[#24272f] p-3 rounded-[2px] shadow flex flex-col gap-2.5">
            {/* Primary: Full 3ds Max Rollout UI + Slate SME Node Distribution */}
            <button
              onClick={handleCopyRolloutScript || handleCopyDirectScript}
              className="w-full py-2.5 bg-gradient-to-b from-[#e5a017] via-[#d68e0d] to-[#b87604] hover:brightness-110 active:translate-y-0.5 text-black font-extrabold rounded-[2px] border border-[#8f5902] text-xs shadow-[inset_1px_1px_0px_rgba(255,255,255,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span className="tracking-wide">✦ 3DS MAX ARAYÜZÜ & SLATE DÜĞÜM AĞACI (.MS) KOPYALA</span>
            </button>

            {/* Secondary: Direct Fast Silent Scene Apply */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={handleCopyDirectScript}
                className="px-2 py-1.5 bg-[#20232a] hover:bg-[#2b303a] text-cyan-300 border border-[#2d3340] rounded-[2px] text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                title="Pencere açmadan arka planda sessizce oluşturur ve Slate SME'de serer"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hızlı Sahneye Ata</span>
              </button>

              <button
                onClick={handleDownloadDirectMs}
                className="px-2 py-1.5 bg-[#2c3039] hover:bg-[#383e4a] text-slate-200 border border-[#1b1d24] rounded-[2px] text-[10px] font-medium flex items-center justify-center gap-1.5 shadow-sm"
                title="3ds Max'e sürükleyip bırakabileceğiniz .ms dosyası indirir"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Script (.ms) İndir</span>
              </button>

              <button
                onClick={() => setIsScriptModalOpen(true)}
                className="px-2 py-1.5 bg-[#2c3039] hover:bg-[#383e4a] text-slate-200 border border-[#1b1d24] rounded-[2px] text-[10px] font-medium flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-300" />
                <span>Kodu İncele</span>
              </button>
            </div>

            {/* 3ds Max Running & Layout Instructions Guide Card */}
            <div className="bg-[#181a20] border border-amber-500/40 p-2.5 rounded-[2px] flex flex-col gap-1.5 text-[10px] text-slate-300 mt-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10.5px]">
                <Zap className="w-3.5 h-3.5" />
                <span>3ds Max İçinde Çalıştırma & Görüntüleme Rehberi:</span>
              </div>
              <ul className="space-y-1 list-disc list-inside text-slate-300 leading-normal pl-0.5">
                <li>
                  <strong className="text-amber-200">Arayüz Penceresi:</strong> Scripti 3ds Max viewport penceresine sürükleyip bıraktığınızda (veya <em>Scripting &gt; Run Script</em> dediğinizde) 3ds Max içinde <strong>"3ds Max PBR Material Studio"</strong> açılır arayüz penceresi gelir.
                </li>
                <li>
                  <strong className="text-amber-200">Düğüm Dağılımları (Slate SME):</strong> Script çalıştığında Slate Material Editor otomatik açılarak <em>Diffuse ➔ CoronaColorCorrect ➔ Roughness/Normal/Displacement</em> bağlantı düğümleri şematik olarak serilir ve ekrana ortalanır.
                </li>
              </ul>
            </div>
          </div>

          {/* AI Texture Inspector collapsible */}
          <AiTextureInspector
            properties={properties}
            slots={slots}
            onApplyAiResult={handleApplyAiResult}
            fileNames={allUploadedFileNames}
          />

          {/* Step 3 Footer: Back to Step 2 or Reset to Step 1 */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setWizardStep(2)}
              className="px-3 py-1 bg-[#2b2e38] hover:bg-[#383d47] text-slate-200 border border-[#1e2026] text-xs font-semibold rounded-[2px] flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Geri: Ayarlar</span>
            </button>

            <button
              onClick={() => setWizardStep(1)}
              className="px-3 py-1 bg-[#2b2e38] hover:bg-[#383d47] text-amber-400 border border-[#1e2026] text-xs font-semibold rounded-[2px] flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Başa Dön (Yeni Materyal)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

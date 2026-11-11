import React, { useState } from 'react';
import {
  MaterialProperties,
  TextureMapSlot,
  PbrChannel,
  ColorCorrectSettings,
  NormalFormat,
} from '../types/material';
import {
  X,
  Sliders,
  Wand2,
  Check,
  RefreshCw,
  Info,
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';

interface MaterialPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: MaterialProperties;
  onUpdateProperties: (newProps: MaterialProperties) => void;
  slots: Record<string, TextureMapSlot>;
  onUpdateSlot: (channel: PbrChannel, updatedSlot: TextureMapSlot) => void;
}

export const MaterialPropertiesModal: React.FC<MaterialPropertiesModalProps> = ({
  isOpen,
  onClose,
  properties,
  onUpdateProperties,
  slots,
  onUpdateSlot,
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'physical' | 'engine'>('channels');
  const [selectedChannel, setSelectedChannel] = useState<PbrChannel>('height');

  if (!isOpen) return null;

  const currentSlot = slots[selectedChannel];

  // Auto-tune Corona Color Correct specifically for Displacement/Height!
  const handleAutoTuneDisplacement = () => {
    const dispSlot = slots['height'];
    if (!dispSlot) return;

    const source: PbrChannel = slots['diffuse']?.isAssigned ? 'diffuse' : 'normal';

    const autoDisplacementCC: ColorCorrectSettings = {
      enabled: true,
      sourceChannel: source,
      invert: false,
      gamma: 0.95,
      contrast: 0.55, // Strong contrast to isolate relief
      saturation: -1.0, // 100% desaturated monochrome for displacement
      brightness: -0.05,
    };

    onUpdateSlot('height', {
      ...dispSlot,
      isDerived: true,
      isAssigned: true,
      colorCorrect: autoDisplacementCC,
    });

    onUpdateProperties({
      ...properties,
      displacementAmount: 2.5,
    });
  };

  const handleApplyDisplacementPreset = (contrast: number, gamma: number, invert: boolean, depthCm: number) => {
    const dispSlot = slots['height'];
    if (!dispSlot) return;

    const source: PbrChannel = slots['diffuse']?.isAssigned ? 'diffuse' : 'normal';

    onUpdateSlot('height', {
      ...dispSlot,
      isDerived: true,
      isAssigned: true,
      colorCorrect: {
        enabled: true,
        sourceChannel: source,
        invert,
        gamma,
        contrast,
        saturation: -1.0,
        brightness: 0.0,
      },
    });

    onUpdateProperties({
      ...properties,
      displacementAmount: depthCm,
    });
  };

  const handleToggleDerive = (channel: PbrChannel) => {
    const slot = slots[channel];
    if (!slot) return;

    const isNowDerived = !slot.isDerived;
    const defaultSource: PbrChannel = slots['diffuse']?.isAssigned ? 'diffuse' : 'normal';

    const updatedColorCorrect: ColorCorrectSettings = {
      enabled: isNowDerived,
      sourceChannel: slot.colorCorrect.sourceChannel || defaultSource,
      invert: channel === 'roughness',
      gamma: channel === 'roughness' ? 0.85 : 0.95,
      contrast: channel === 'roughness' ? 0.25 : 0.55,
      saturation: -1.0,
      brightness: 0.0,
    };

    onUpdateSlot(channel, {
      ...slot,
      isDerived: isNowDerived,
      isAssigned: isNowDerived ? true : Boolean(slot.fileName),
      colorCorrect: updatedColorCorrect,
    });
  };

  const handleUpdateColorCorrect = (field: keyof ColorCorrectSettings, value: any) => {
    if (!currentSlot) return;
    const updated = {
      ...currentSlot,
      colorCorrect: {
        ...currentSlot.colorCorrect,
        [field]: value,
      },
    };
    onUpdateSlot(selectedChannel, updated);
  };

  const iorPresets = [
    { label: 'Cam (Crown)', val: 1.52 },
    { label: 'Su', val: 1.33 },
    { label: 'Plastik / Akrilik', val: 1.49 },
    { label: 'Ahşap / Vernikli', val: 1.55 },
    { label: 'Beton / Taş', val: 1.54 },
    { label: 'Elmas', val: 2.42 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#14171E] border border-[#2B313E] rounded-xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Modal Header (Compact & Tidy) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#242A36] bg-[#101217]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Material Özellikleri & Corona Color Correct</h2>
              <p className="text-[11px] text-slate-400">
                Eksik kaplamalarda Displacement ve Roughness dokusunu otomatik ayarlar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs (Compact) */}
        <div className="flex items-center gap-1 px-5 pt-2 border-b border-[#242A36] bg-[#12141B]">
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'channels'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Kanal & Corona Color Correct
          </button>
          <button
            onClick={() => setActiveTab('physical')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'physical'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Fiziksel Ayarlar (IOR, Metalness)
          </button>
          <button
            onClick={() => setActiveTab('engine')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'engine'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Render Motoru & Editör
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'channels' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left Column: Channel Selector List (Compact) */}
              <div className="md:col-span-5 flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 mb-0.5">
                  PBR Kaplama Slotları
                </span>

                {(['height', 'roughness', 'diffuse', 'normal', 'metalness', 'ao', 'specular'] as PbrChannel[]).map(
                  (chan) => {
                    const slot = slots[chan];
                    const isSelected = selectedChannel === chan;

                    return (
                      <button
                        key={chan}
                        onClick={() => setSelectedChannel(chan)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-[#1C202B] border-amber-500/80 shadow-sm text-white'
                            : 'bg-[#12141A] border-[#222731] hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              slot?.isDerived
                                ? 'bg-purple-400 ring-2 ring-purple-900'
                                : slot?.isAssigned
                                ? 'bg-emerald-400'
                                : 'bg-slate-600'
                            }`}
                          />
                          <div>
                            <div className="text-xs font-medium capitalize">{slot?.label || chan}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {slot?.isDerived
                                ? `CoronaColorCorrect (${slot.colorCorrect.sourceChannel})`
                                : slot?.fileName || 'Harita yok'}
                            </div>
                          </div>
                        </div>

                        {slot?.isDerived && (
                          <span className="text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-800/60 px-1.5 py-0.5 rounded">
                            Derived
                          </span>
                        )}
                        {!slot?.isDerived && slot?.isAssigned && (
                          <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                            Mapped
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Right Column: Detailed Configuration (Compact & High-Density) */}
              <div className="md:col-span-7 bg-[#101217] border border-[#222731] rounded-lg p-4 flex flex-col gap-3.5">
                <div className="flex items-center justify-between border-b border-[#222731] pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-white capitalize">
                      {currentSlot?.label || selectedChannel} Ayarları
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {currentSlot?.isAssigned
                        ? `Mevcut: ${currentSlot.fileName || 'Corona Color Correct'}`
                        : 'Bu kanala henüz görsel dosya atanmadı.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Auto-Tune Displacement Special Button */}
                    {selectedChannel === 'height' && (
                      <button
                        onClick={handleAutoTuneDisplacement}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded transition-all shadow-sm"
                        title="CoronaColorCorrect dokusunu otomatik ayarla"
                      >
                        <Zap className="w-3 h-3 text-black fill-black" />
                        <span>Otomatik Doku Ayarla</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleDerive(selectedChannel)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded transition-all ${
                        currentSlot?.isDerived
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-slate-800 hover:bg-purple-900/40 text-purple-300 border border-purple-700/50'
                      }`}
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>{currentSlot?.isDerived ? 'Türetmeyi Kaldır' : 'CoronaColorCorrect ile Türet'}</span>
                    </button>
                  </div>
                </div>

                {/* Displacement Quick Presets Strip */}
                {selectedChannel === 'height' && currentSlot?.isDerived && (
                  <div className="bg-[#161822] border border-purple-800/40 rounded p-2.5 flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-purple-300 font-semibold">
                      Displacement Hazır Doku Şablonları:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleApplyDisplacementPreset(0.4, 0.95, false, 1.2)}
                        className="px-2 py-0.5 text-[10px] bg-[#1F2330] hover:bg-purple-900/40 text-slate-300 border border-slate-700 rounded transition-colors"
                      >
                        Ahşap Damar (1.2 cm)
                      </button>
                      <button
                        onClick={() => handleApplyDisplacementPreset(0.65, 0.9, false, 3.5)}
                        className="px-2 py-0.5 text-[10px] bg-[#1F2330] hover:bg-purple-900/40 text-slate-300 border border-slate-700 rounded transition-colors"
                      >
                        Taş / Tuğla Derz (3.5 cm)
                      </button>
                      <button
                        onClick={() => handleApplyDisplacementPreset(0.3, 1.05, false, 0.6)}
                        className="px-2 py-0.5 text-[10px] bg-[#1F2330] hover:bg-purple-900/40 text-slate-300 border border-slate-700 rounded transition-colors"
                      >
                        Beton / Sıva (0.6 cm)
                      </button>
                    </div>
                  </div>
                )}

                {/* If Derived with Corona Color Correct */}
                {currentSlot?.isDerived ? (
                  <div className="space-y-3 pt-0.5">
                    {/* Source Channel Picker */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Kaynak Kaplama Kanalı (Source Texmap):
                      </label>
                      <select
                        value={currentSlot.colorCorrect.sourceChannel}
                        onChange={(e) => handleUpdateColorCorrect('sourceChannel', e.target.value)}
                        className="w-full bg-[#161820] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                      >
                        <option value="diffuse">Diffuse / Base Color Map</option>
                        <option value="normal">Normal Map</option>
                        <option value="metalness">Metalness Map</option>
                      </select>
                    </div>

                    {/* Invert Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer bg-[#161820] border border-slate-800 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={currentSlot.colorCorrect.invert}
                        onChange={(e) => handleUpdateColorCorrect('invert', e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-slate-200 font-medium">Invert (Renkleri Ters Çevir)</span>
                      <span className="text-[10px] text-slate-500 ml-auto">
                        {selectedChannel === 'height' ? 'Çatlakları/derzleri içeri batırır' : 'Açık alanları mat yapar'}
                      </span>
                    </label>

                    {/* Sliders: Contrast, Gamma, Saturation, Brightness */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Contrast */}
                      <div className="bg-[#161820] border border-slate-800 p-2.5 rounded">
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Kontrast</span>
                          <span className="font-mono text-amber-400">
                            {currentSlot.colorCorrect.contrast.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-1.0"
                          max="1.0"
                          step="0.05"
                          value={currentSlot.colorCorrect.contrast}
                          onChange={(e) => handleUpdateColorCorrect('contrast', parseFloat(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Gamma */}
                      <div className="bg-[#161820] border border-slate-800 p-2.5 rounded">
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Gama</span>
                          <span className="font-mono text-amber-400">
                            {currentSlot.colorCorrect.gamma.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="2.5"
                          step="0.05"
                          value={currentSlot.colorCorrect.gamma}
                          onChange={(e) => handleUpdateColorCorrect('gamma', parseFloat(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="bg-[#161820] border border-slate-800 p-2.5 rounded">
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Doygunluk</span>
                          <span className="font-mono text-amber-400">
                            {currentSlot.colorCorrect.saturation.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-1.0"
                          max="1.0"
                          step="0.1"
                          value={currentSlot.colorCorrect.saturation}
                          onChange={(e) => handleUpdateColorCorrect('saturation', parseFloat(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Displacement Depth if Height */}
                      {selectedChannel === 'height' ? (
                        <div className="bg-[#161820] border border-slate-800 p-2.5 rounded">
                          <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                            <span>Maks Derinlik</span>
                            <span className="font-mono text-amber-400">
                              {properties.displacementAmount.toFixed(1)} cm
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="10.0"
                            step="0.1"
                            value={properties.displacementAmount}
                            onChange={(e) =>
                              onUpdateProperties({ ...properties, displacementAmount: parseFloat(e.target.value) })
                            }
                            className="w-full accent-amber-500 cursor-pointer h-1.5"
                          />
                        </div>
                      ) : (
                        <div className="bg-[#161820] border border-slate-800 p-2.5 rounded">
                          <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                            <span>Parlaklık</span>
                            <span className="font-mono text-amber-400">
                              {currentSlot.colorCorrect.brightness.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-1.0"
                            max="1.0"
                            step="0.05"
                            value={currentSlot.colorCorrect.brightness}
                            onChange={(e) => handleUpdateColorCorrect('brightness', parseFloat(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer h-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard Mapped Slot */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Dosya Yolu / Adı:</label>
                      <input
                        type="text"
                        value={currentSlot?.filePath || currentSlot?.fileName || ''}
                        onChange={(e) =>
                          onUpdateSlot(selectedChannel, {
                            ...currentSlot,
                            fileName: e.target.value,
                            filePath: e.target.value,
                            isAssigned: Boolean(e.target.value),
                          })
                        }
                        placeholder="Örn: C:\Textures\Wood\Wood_Displacement.jpg"
                        className="w-full bg-[#161820] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'physical' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Materyal Adı (3ds Max ID):</label>
                <input
                  type="text"
                  value={properties.name}
                  onChange={(e) => onUpdateProperties({ ...properties, name: e.target.value })}
                  className="w-full bg-[#101217] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>

              {/* IOR Presets */}
              <div className="bg-[#101217] border border-[#222731] p-3.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">Index of Refraction (IOR):</span>
                  <span className="font-mono font-bold text-amber-400">{properties.ior.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.01"
                  value={properties.ior}
                  onChange={(e) => onUpdateProperties({ ...properties, ior: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1.5"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {iorPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onUpdateProperties({ ...properties, ior: preset.val })}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        Math.abs(properties.ior - preset.val) < 0.01
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-[#161820] text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {preset.label} ({preset.val})
                    </button>
                  ))}
                </div>
              </div>

              {/* Metalness Mode Toggle */}
              <div className="bg-[#101217] border border-[#222731] p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Metallic Workflow</div>
                  <div className="text-[10px] text-slate-400">
                    {properties.metalnessMode ? 'Metalik (Metalness = 1.0)' : 'Dielektrik (Ahşap, plastik, taş vb.)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateProperties({ ...properties, metalnessMode: !properties.metalnessMode })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    properties.metalnessMode
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {properties.metalnessMode ? 'Metalik (1.0)' : 'Dielektrik (0.0)'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'engine' && (
            <div className="space-y-4 max-w-xl">
              <div className="bg-[#101217] border border-[#222731] p-3.5 rounded-lg space-y-2">
                <span className="text-xs font-semibold text-slate-200">Render Motoru:</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onUpdateProperties({ ...properties, engine: 'corona' })}
                    className={`p-2.5 rounded border text-left transition-all ${
                      properties.engine === 'corona'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                        : 'bg-[#161820] border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Chaos Corona</div>
                    <div className="text-[10px] text-slate-400">CoronaPhysicalMtl & CoronaColorCorrect</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateProperties({ ...properties, engine: 'vray' })}
                    className={`p-2.5 rounded border text-left transition-all ${
                      properties.engine === 'vray'
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                        : 'bg-[#161820] border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Chaos V-Ray</div>
                    <div className="text-[10px] text-slate-400">VRayMtl & Microfacet GGX</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Compact) */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#242A36] bg-[#101217]">
          <span className="text-[11px] text-slate-400">
            Değişiklikler anında 3D önizlemeye ve MaxScript koduna aktarılır.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded transition-colors shadow-sm"
          >
            Kaydet & Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

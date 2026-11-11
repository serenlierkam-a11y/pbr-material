import React, { useState } from 'react';
import { MaterialProperties, TextureMapSlot } from '../types/material';
import { generateMaxScript } from '../utils/maxScriptGenerator';
import { Copy, Download, Check, FileCode, Sliders, ExternalLink, Sparkles, Monitor, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScriptOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: MaterialProperties;
  slots: Record<string, TextureMapSlot>;
}

export const ScriptOutputModal: React.FC<ScriptOutputModalProps> = ({
  isOpen,
  onClose,
  properties,
  slots,
}) => {
  const [includeRollout, setIncludeRollout] = useState<boolean>(true);
  const [applySelection, setApplySelection] = useState<boolean>(properties.applyToSelected);
  const [viewportShow, setViewportShow] = useState<boolean>(properties.showInViewport);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const scriptCode = generateMaxScript(properties, slots, {
    includeRolloutUI: includeRollout,
    applyToSelection: applySelection,
    viewportDisplay: viewportShow,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setIsCopied(true);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = (isMacro: boolean = false) => {
    const fileName = isMacro
      ? `Macro_${properties.name}.mcr`
      : `${properties.name}_PBR_Studio.ms`;

    let finalCode = scriptCode;
    if (isMacro) {
      finalCode = `macroScript ${properties.name}
category:"PBR Studio"
tooltip:"Launch ${properties.name} PBR Studio"
buttonText:"PBR Studio"
(
${scriptCode}
)
`;
    }

    const blob = new Blob([finalCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-[#12141A] border border-[#2B313E] rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header (Compact) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#242A36] bg-[#0E1015]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">3ds Max PBR MaxScript Kodu</h2>
                <span className="text-[9px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/60 px-1 py-0.2 rounded uppercase">
                  {properties.engine === 'corona' ? 'Corona Renderer' : 'V-Ray'}
                </span>
                <span className="text-[9px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1 py-0.2 rounded">
                  {includeRollout ? '3ds Max Floater Arayüzlü' : 'Doğrudan Çalışan'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                3ds Max içine sürükleyip bıraktığınızda tam arayüzlü bir araç penceresi olarak açılır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-all shadow-sm ${
                isCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-black'
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Kopyalandı!' : 'Scripti Kopyala'}</span>
            </button>
            <button
              onClick={() => handleDownload(false)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#1A1E26] hover:bg-[#252B37] text-slate-200 border border-slate-700 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.ms İndir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Script Mode & Options Bar (Compact) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2 bg-[#101217] border-b border-[#242A36] text-[11px]">
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Mod:</span>
            <div className="flex items-center bg-[#181B22] border border-slate-700 rounded p-0.5">
              <button
                onClick={() => setIncludeRollout(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  includeRollout
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>3ds Max Floater Arayüzü</span>
              </button>
              <button
                onClick={() => setIncludeRollout(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  !includeRollout
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Tek Tık Doğrudan Oluştur</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={applySelection}
                onChange={(e) => setApplySelection(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <span>Seçili Nesnelere Ata</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={viewportShow}
                onChange={(e) => setViewportShow(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <span>Viewport Önizlemesini Aç</span>
            </label>

            <button
              onClick={() => handleDownload(true)}
              className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2 ml-2"
            >
              <span>MacroScript (.mcr) İndir</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* MaxScript Code View with Line Numbers */}
        <div className="flex-1 overflow-auto bg-[#08090D] p-3.5 text-xs font-mono text-slate-200 selection:bg-amber-500/30 selection:text-amber-200">
          <pre className="leading-relaxed">
            <code>
              {scriptCode.split('\n').map((line, idx) => {
                const lineNum = idx + 1;
                const isComment =
                  line.trim().startsWith('--') || line.trim().startsWith('/*') || line.trim().startsWith('*');
                const isKeyword =
                  line.includes('rollout ') ||
                  line.includes('button ') ||
                  line.includes('CoronaPhysicalMtl()') ||
                  line.includes('CoronaColorCorrect()') ||
                  line.includes('VRayMtl()') ||
                  line.includes('sme.createView');

                return (
                  <div key={idx} className="flex hover:bg-[#101217]">
                    <span className="w-10 shrink-0 select-none text-slate-600 text-right pr-3 text-[11px]">
                      {lineNum}
                    </span>
                    <span
                      className={
                        isComment
                          ? 'text-emerald-500/80 italic'
                          : isKeyword
                          ? 'text-amber-400 font-semibold'
                          : 'text-slate-300'
                      }
                    >
                      {line}
                    </span>
                  </div>
                );
              })}
            </code>
          </pre>
        </div>

        {/* Modal Footer (Compact) */}
        <div className="px-5 py-2.5 border-t border-[#242A36] bg-[#0E1015] flex items-center justify-between text-[11px] text-slate-400">
          <div>
            <span className="text-amber-400 font-semibold">Kullanım:</span>{' '}
            <span>Kodu kopyalayıp 3ds Max içine sürükleyin veya Scripting &gt; "Run Script" yapın. 3ds Max içinde arayüz otomatik açılacaktır.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

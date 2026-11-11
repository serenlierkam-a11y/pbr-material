import React, { useState } from 'react';
import { MaterialProperties, TextureMapSlot, AiAnalysisResult } from '../types/material';
import { Sparkles, Brain, Loader2, CheckCircle2, AlertTriangle, Cpu, Terminal, Plus } from 'lucide-react';

interface AiTextureInspectorProps {
  properties: MaterialProperties;
  slots: Record<string, TextureMapSlot>;
  onApplyAiResult: (result: AiAnalysisResult) => void;
  fileNames: string[];
}

export const AiTextureInspector: React.FC<AiTextureInspectorProps> = ({
  properties,
  slots,
  onApplyAiResult,
  fileNames,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [modelTag, setModelTag] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const quickChips = [
    "Eksik Displacement'ı Diffuse üzerinden CoronaColorCorrect ile otomatik ayarla",
    "Pürüzlülük (Roughness) haritası için Invert ve yüksek kontrast uygula",
    "Vernikli ahşap IOR 1.55 ve mikro-pürüzlülük ayarla",
    "Normal haritasını DirectX olarak kilitle",
  ];

  const handleRunAiAnalysis = async (overridePrompt?: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    const promptToSend = overridePrompt !== undefined ? overridePrompt : customPrompt;

    try {
      const activeFileNames = fileNames.length > 0
        ? fileNames
        : Object.values(slots)
            .filter((s) => s.fileName)
            .map((s) => s.fileName);

      const res = await fetch('/api/analyze-textures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileNames: activeFileNames,
          userCustomRequirements: promptToSend || "Displacement ve eksik kanalları CoronaColorCorrect ile otomatik hesapla.",
          contextNotes: `Material Name: ${properties.name}, Engine: ${properties.engine}`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Yapay zeka derin taraması sırasında bir hata oluştu.");
      }

      setAnalysisResult(json.data);
      setModelTag(json.modelUsed || "gemini-4-argon (ThinkingLevel.HIGH)");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Analiz başarısız oldu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full bg-[#13161D] rounded-lg border border-[#222731] p-3.5 flex flex-col gap-3">
      {/* Header (Clean, Compact) */}
      <div className="flex items-center justify-between border-b border-[#222731] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                Derin Tarama & Kaplama Paketi Analizi
              </span>
              <span className="text-[9px] font-mono text-purple-400 bg-purple-950/80 border border-purple-800/60 px-1 rounded">
                gemini-4-argon · HIGH THINKING
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Kaplama klasörünü tarar, eksik kanalları ve özel isteklerinizi CoronaColorCorrect ile kurgular.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleRunAiAnalysis()}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded transition-all shadow-sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Derin Düşünülüyor...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-purple-200" />
              <span>Derin Tarama Başlat</span>
            </>
          )}
        </button>
      </div>

      {/* Custom User Instructions Input ("Eklemek istediklerim") */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Terminal className="w-3 h-3 text-amber-400" />
            <span>Eklemek İstedikleriniz / Özel İstekler:</span>
          </span>
          <span className="text-[10px] text-slate-500">Doğal dille yazabilirsiniz</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Örn: 'Displacement'ı Diffuse'dan CoronaColorCorrect ile türet, IOR 1.62 olsun, derzleri derinleştir'"
            className="flex-1 bg-[#0E1015] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-400 placeholder:text-slate-600 font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunAiAnalysis();
            }}
          />
          <button
            onClick={() => handleRunAiAnalysis()}
            disabled={isAnalyzing}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors shrink-0"
          >
            Uygula
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCustomPrompt(chip);
                handleRunAiAnalysis(chip);
              }}
              className="text-[10px] px-2 py-0.5 bg-[#171B24] hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 border border-slate-800 rounded transition-colors"
            >
              + {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Analysis Result Box */}
      {analysisResult && (
        <div className="space-y-3 bg-[#0E1015] border border-purple-500/30 rounded-lg p-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-white">{analysisResult.materialName}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                {analysisResult.materialCategory}
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded">
                IOR: {analysisResult.recommendedIOR.toFixed(2)}
              </span>
              {analysisResult.recommendedDisplacementAmount && (
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.5 rounded">
                  Disp: {analysisResult.recommendedDisplacementAmount}cm
                </span>
              )}
            </div>

            <button
              onClick={() => onApplyAiResult(analysisResult)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Parametreleri Sahneye Uygula</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {analysisResult.aiExpertSummary}
          </p>

          {/* Fallback Channels Grid */}
          {analysisResult.suggestedColorCorrectFallbacks?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {analysisResult.suggestedColorCorrectFallbacks.map((fb, idx) => (
                <div key={idx} className="bg-[#14171E] border border-purple-900/40 rounded p-2 text-[11px]">
                  <div className="flex items-center justify-between font-semibold text-purple-200">
                    <span className="capitalize">{fb.missingChannel}</span>
                    <span className="text-[9px] font-mono text-purple-400">
                      Kaynak: {fb.deriveFromChannel}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{fb.explanation}</p>
                  <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-500">
                    <span>Invert: {fb.coronaColorCorrectParams.invert ? 'ON' : 'OFF'}</span>
                    <span>·</span>
                    <span>Contrast: +{fb.coronaColorCorrectParams.contrast}</span>
                    <span>·</span>
                    <span>Gamma: {fb.coronaColorCorrectParams.gamma}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

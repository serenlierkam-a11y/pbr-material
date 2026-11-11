/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MaterialProperties,
  TextureMapSlot,
  PbrChannel,
  AiAnalysisResult,
  RenderEngine,
} from './types/material';
import {
  detectChannelFromFileName,
  analyzeBatchFiles,
  detectNormalFormat,
  extractBaseMaterialName,
} from './utils/filenameParser';
import {
  createProceduralWoodTexture,
  createProceduralMetalTexture,
  createProceduralMarbleTexture,
  generateCoronaColorCorrectPreview,
} from './utils/textureGenerator';
import { ViewportPreview } from './components/ViewportPreview';
import { SlateNodeVisualizer } from './components/SlateNodeVisualizer';
import { CompactSlotVisualizer } from './components/CompactSlotVisualizer';
import { MaterialLibraryManager, SavedLibraryMaterial } from './components/MaterialLibraryManager';
import { WizardPbrStudio } from './components/WizardPbrStudio';
import { MaterialPropertiesModal } from './components/MaterialPropertiesModal';
import { AiTextureInspector } from './components/AiTextureInspector';
import { ScriptOutputModal } from './components/ScriptOutputModal';
import { generateMaxScript } from './utils/maxScriptGenerator';
import {
  FolderUp,
  Sliders,
  FileCode,
  Wand2,
  Layers,
  Grid,
  CheckCircle2,
  Trash2,
  Zap,
  Sparkles,
  Eye,
  ImageIcon,
  FolderArchive,
  Minus,
  Square,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Play,
  Search,
  Folder,
  HelpCircle,
  User,
  Monitor,
  Settings,
  RefreshCw,
  Undo,
  Redo,
  MousePointer,
  Move,
  RotateCcw,
  Download,
  Flame,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

const createDefaultSlots = (): Record<string, TextureMapSlot> => ({
  diffuse: {
    channel: 'diffuse',
    label: 'Diffuse / Base Color',
    fileName: '',
    filePath: '',
    isAssigned: false,
    isDerived: false,
    colorSpace: 'sRGB',
    colorCorrect: {
      enabled: false,
      sourceChannel: 'diffuse',
      invert: false,
      gamma: 1.0,
      contrast: 0.0,
      saturation: 0.0,
      brightness: 0.0,
    },
  },
  roughness: {
    channel: 'roughness',
    label: 'Roughness / Pürüzlülük',
    fileName: '',
    filePath: '',
    isAssigned: false,
    isDerived: false,
    colorSpace: 'Linear_RAW',
    colorCorrect: {
      enabled: true,
      sourceChannel: 'diffuse',
      invert: true,
      gamma: 0.85,
      contrast: 0.25,
      saturation: -1.0,
      brightness: 0.0,
    },
  },
  normal: {
    channel: 'normal',
    label: 'Normal Map / Bump',
    fileName: '',
    filePath: '',
    isAssigned: false,
    isDerived: false,
    colorSpace: 'Linear_RAW',
    colorCorrect: {
      enabled: false,
      sourceChannel: 'diffuse',
      invert: false,
      gamma: 1.0,
      contrast: 0.35,
      saturation: -1.0,
      brightness: 0.0,
    },
  },
  height: {
    channel: 'height',
    label: 'Displacement / Derinlik',
    fileName: '',
    filePath: '',
    isAssigned: false,
    isDerived: false,
    colorSpace: 'Linear_RAW',
    colorCorrect: {
      enabled: true,
      sourceChannel: 'diffuse',
      invert: false,
      gamma: 0.95,
      contrast: 0.55,
      saturation: -1.0,
      brightness: 0.0,
    },
  },
  metalness: {
    channel: 'metalness',
    label: 'Metalness / Metalik',
    fileName: '',
    filePath: '',
    isAssigned: false,
    isDerived: false,
    colorSpace: 'Linear_RAW',
    colorCorrect: {
      enabled: false,
      sourceChannel: 'diffuse',
      invert: false,
      gamma: 1.0,
      contrast: 0.0,
      saturation: -1.0,
      brightness: 0.0,
    },
  },
  ao: {
    channel: 'ao',
    label: 'Ambient Occlusion (AO)',
    fileName: '',
    filePath: '',
    isAssigned: false,
    isDerived: false,
    colorSpace: 'Linear_RAW',
    colorCorrect: {
      enabled: false,
      sourceChannel: 'diffuse',
      invert: false,
      gamma: 1.0,
      contrast: 0.0,
      saturation: -1.0,
      brightness: 0.0,
    },
  },
});

const PRESETS = [
  {
    name: 'Mtl_Nordic_Oak_Parquet',
    category: 'Wood',
    engine: 'corona' as RenderEngine,
    ior: 1.55,
    metalnessMode: false,
    textureGenerator: 'wood',
    files: [
      { name: 'Nordic_Oak_01_Diffuse.jpg', channel: 'diffuse', path: 'C:\\Textures\\Wood\\Nordic_Oak_01_Diffuse.jpg' },
      { name: 'Nordic_Oak_01_Normal_DirectX.png', channel: 'normal', path: 'C:\\Textures\\Wood\\Nordic_Oak_01_Normal_DirectX.png' },
      { name: 'Nordic_Oak_01_AO.jpg', channel: 'ao', path: 'C:\\Textures\\Wood\\Nordic_Oak_01_AO.jpg' },
    ],
    deriveRoughness: true,
    deriveDisplacement: true,
  },
  {
    name: 'Mtl_Industrial_Steel_Brushed',
    category: 'Metal',
    engine: 'corona' as RenderEngine,
    ior: 2.85,
    metalnessMode: true,
    textureGenerator: 'metal',
    files: [
      { name: 'Brushed_Steel_BaseColor.jpg', channel: 'diffuse', path: 'C:\\Textures\\Metal\\Brushed_Steel_BaseColor.jpg' },
      { name: 'Brushed_Steel_Roughness.jpg', channel: 'roughness', path: 'C:\\Textures\\Metal\\Brushed_Steel_Roughness.jpg' },
      { name: 'Brushed_Steel_Metallic.jpg', channel: 'metalness', path: 'C:\\Textures\\Metal\\Brushed_Steel_Metallic.jpg' },
      { name: 'Brushed_Steel_Normal.jpg', channel: 'normal', path: 'C:\\Textures\\Metal\\Brushed_Steel_Normal.jpg' },
    ],
    deriveRoughness: false,
    deriveDisplacement: false,
  },
  {
    name: 'Mtl_Carrara_Marble_Polished',
    category: 'Stone',
    engine: 'vray' as RenderEngine,
    ior: 1.54,
    metalnessMode: false,
    textureGenerator: 'marble',
    files: [
      { name: 'Carrara_Marble_Albedo.png', channel: 'diffuse', path: 'D:\\Archviz\\Textures\\Marble\\Carrara_Marble_Albedo.png' },
      { name: 'Carrara_Marble_Normal.png', channel: 'normal', path: 'D:\\Archviz\\Textures\\Marble\\Carrara_Marble_Normal.png' },
    ],
    deriveRoughness: true,
    deriveDisplacement: true,
  },
];

export default function App() {
  const [properties, setProperties] = useState<MaterialProperties>({
    name: 'Mtl_PBR_Custom',
    category: 'Generic',
    engine: 'corona',
    editorTarget: 'both_rollout',
    compactSlotIndex: 1,
    roughnessMode: 'roughness',
    normalType: 'directx',
    ior: 1.52,
    metalnessMode: false,
    baseColorHex: '#888888',
    displacementAmount: 2.0,
    applyToSelected: true,
    showInViewport: true,
    useCoronaColorCorrectFallback: true,
  });

  const [slots, setSlots] = useState<Record<string, TextureMapSlot>>(createDefaultSlots());
  const [allUploadedFileNames, setAllUploadedFileNames] = useState<string[]>([]);
  const [unmatchedFiles, setUnmatchedFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'slate' | 'compact' | 'library'>('slate');
  const [activeSelectedChannel, setActiveSelectedChannel] = useState<string>('combined');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Modals & 3ds Max UI States
  const [isPropertiesOpen, setIsPropertiesOpen] = useState<boolean>(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [activeMaxMenu, setActiveMaxMenu] = useState<string | null>(null);
  const [targetFolderPath, setTargetFolderPath] = useState<string>('C:\\Textures\\PBR_Maps');
  const [collapsedRollouts, setCollapsedRollouts] = useState<Record<string, boolean>>({
    presets: false,
    scanner: false,
    slots: false,
    unmatched: false,
    coronaCc: false,
    physical: false,
  });

  const toggleRollout = (key: string) => {
    setCollapsedRollouts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy full 3ds Max Rollout UI Script (Pops up dialog window + Slate SME node distribution in 3ds Max)
  const handleCopyRolloutScript = () => {
    const code = generateMaxScript(properties, slots, {
      includeRolloutUI: true,
      applyToSelection: true,
      viewportDisplay: true,
    });
    navigator.clipboard.writeText(code);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Direct fast scene apply script (silent execution + Slate SME node distribution)
  const handleCopyDirectScript = () => {
    const code = generateMaxScript(properties, slots, {
      includeRolloutUI: false,
      applyToSelection: true,
      viewportDisplay: true,
    });
    navigator.clipboard.writeText(code);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const handleDownloadDirectMs = () => {
    const code = generateMaxScript(properties, slots, {
      includeRolloutUI: true,
      applyToSelection: true,
      viewportDisplay: true,
    });
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${properties.name || 'PBR_Material'}.ms`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // App starts with empty boxes as requested by user. Presets can still be chosen via toolbar.

  const loadPreset = (preset: typeof PRESETS[0]) => {
    const newSlots = createDefaultSlots();
    const names: string[] = [];
    setUnmatchedFiles([]);

    let diffUrl = '';
    let roughUrl = '';
    let normUrl = '';
    let dispUrl = '';

    if (preset.textureGenerator === 'wood') {
      diffUrl = createProceduralWoodTexture('diffuse');
      roughUrl = createProceduralWoodTexture('roughness');
      normUrl = createProceduralWoodTexture('normal');
      dispUrl = createProceduralWoodTexture('displacement');
    } else if (preset.textureGenerator === 'metal') {
      diffUrl = createProceduralMetalTexture('diffuse');
      roughUrl = createProceduralMetalTexture('roughness');
      normUrl = createProceduralMetalTexture('normal');
    } else if (preset.textureGenerator === 'marble') {
      diffUrl = createProceduralMarbleTexture('diffuse');
      roughUrl = createProceduralMarbleTexture('roughness');
      normUrl = createProceduralMarbleTexture('normal');
      dispUrl = createProceduralMarbleTexture('displacement');
    }

    preset.files.forEach((f) => {
      names.push(f.name);
      if (newSlots[f.channel]) {
        let pUrl = '';
        if (f.channel === 'diffuse') pUrl = diffUrl;
        else if (f.channel === 'roughness') pUrl = roughUrl;
        else if (f.channel === 'normal') pUrl = normUrl;
        else if (f.channel === 'height') pUrl = dispUrl;

        newSlots[f.channel] = {
          ...newSlots[f.channel],
          fileName: f.name,
          filePath: f.path,
          previewUrl: pUrl,
          isAssigned: true,
          isDerived: false,
        };
      }
    });

    if (preset.deriveRoughness) {
      newSlots['roughness'] = {
        ...newSlots['roughness'],
        fileName: '',
        filePath: '',
        previewUrl: roughUrl,
        isAssigned: true,
        isDerived: true,
        colorCorrect: {
          enabled: true,
          sourceChannel: 'diffuse',
          invert: true,
          gamma: 0.85,
          contrast: 0.25,
          saturation: -1.0,
          brightness: 0.0,
        },
      };
    }

    if (preset.deriveDisplacement) {
      newSlots['height'] = {
        ...newSlots['height'],
        fileName: '',
        filePath: '',
        previewUrl: dispUrl,
        isAssigned: true,
        isDerived: true,
        colorCorrect: {
          enabled: true,
          sourceChannel: 'diffuse',
          invert: false,
          gamma: 0.95,
          contrast: 0.55,
          saturation: -1.0,
          brightness: -0.05,
        },
      };
    }

    setSlots(newSlots);
    setAllUploadedFileNames(names);
    setProperties((prev) => ({
      ...prev,
      name: preset.name,
      category: preset.category,
      engine: preset.engine,
      ior: preset.ior,
      metalnessMode: preset.metalnessMode,
      baseColorHex: preset.category === 'Metal' ? '#a0a5ad' : preset.category === 'Stone' ? '#e2e8f0' : '#b48a60',
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFileList(Array.from(files));
    e.target.value = ''; // Reset file input so re-selecting same folder works cleanly
  };

  const processFileList = (fileArray: File[]) => {
    const newSlots = { ...slots };
    const uploadedNames: string[] = [];
    const baseNames: string[] = [];
    const unmatched: { file: File; previewUrl: string }[] = [];
    let matchedCount = 0;

    // Use smart batch analyzer to recognize files even if diffuse lacks explicit suffix
    const batchAnalysis = analyzeBatchFiles(fileArray.map((f) => f.name));

    fileArray.forEach((file) => {
      uploadedNames.push(file.name);
      baseNames.push(file.name);
      const batchResult = batchAnalysis[file.name] || detectChannelFromFileName(file.name);
      const targetChannel = batchResult.channel === 'glossiness' ? 'roughness' : batchResult.channel;
      const objectUrl = URL.createObjectURL(file);

      if (targetChannel !== 'unknown' && newSlots[targetChannel]) {
        newSlots[targetChannel] = {
          ...newSlots[targetChannel],
          fileName: file.name,
          filePath: `C:\\Textures\\${file.name}`,
          previewUrl: objectUrl,
          isAssigned: true,
          isDerived: false,
          colorSpace: batchResult.colorSpace,
          confidence: batchResult.confidence,
        };
        matchedCount++;

        if (batchResult.channel === 'glossiness') {
          setProperties((prev) => ({ ...prev, roughnessMode: 'glossiness' }));
        }
      } else {
        // Collect unmatched files so user can assign them with 1 click
        unmatched.push({ file, previewUrl: objectUrl });
      }
    });

    // Auto-derive missing maps (Roughness, Displacement) from Diffuse WITHOUT modifying the original Diffuse
    const diffSlot = newSlots['diffuse'];
    let autoDerivedCount = 0;

    if (diffSlot && diffSlot.isAssigned && diffSlot.previewUrl) {
      // 1. Missing Roughness -> Auto-derive
      if (!newSlots['roughness']?.isAssigned || newSlots['roughness']?.isDerived) {
        const roughParams = newSlots['roughness']?.colorCorrect || {
          enabled: true,
          sourceChannel: 'diffuse',
          invert: true,
          gamma: 0.85,
          contrast: 0.25,
          saturation: -1.0,
          brightness: 0.0,
        };

        newSlots['roughness'] = {
          ...newSlots['roughness'],
          fileName: `CC_Roughness (${diffSlot.fileName})`,
          filePath: '',
          previewUrl: diffSlot.previewUrl,
          isAssigned: true,
          isDerived: true,
          colorSpace: 'Linear_RAW',
          colorCorrect: roughParams,
        };
        autoDerivedCount++;

        generateCoronaColorCorrectPreview(diffSlot.previewUrl, roughParams).then((ccUrl) => {
          setSlots((prev) => {
            if (prev.roughness && prev.roughness.isDerived) {
              return {
                ...prev,
                roughness: { ...prev.roughness, previewUrl: ccUrl },
              };
            }
            return prev;
          });
        });
      }

      // 2. Missing Displacement -> Auto-derive
      if (!newSlots['height']?.isAssigned || newSlots['height']?.isDerived) {
        const dispParams = newSlots['height']?.colorCorrect || {
          enabled: true,
          sourceChannel: 'diffuse',
          invert: false,
          gamma: 0.95,
          contrast: 0.55,
          saturation: -1.0,
          brightness: -0.05,
        };

        newSlots['height'] = {
          ...newSlots['height'],
          fileName: `CC_Displacement (${diffSlot.fileName})`,
          filePath: '',
          previewUrl: diffSlot.previewUrl,
          isAssigned: true,
          isDerived: true,
          colorSpace: 'Linear_RAW',
          colorCorrect: dispParams,
        };
        autoDerivedCount++;

        generateCoronaColorCorrectPreview(diffSlot.previewUrl, dispParams).then((ccUrl) => {
          setSlots((prev) => {
            if (prev.height && prev.height.isDerived) {
              return {
                ...prev,
                height: { ...prev.height, previewUrl: ccUrl },
              };
            }
            return prev;
          });
        });
      }
    }

    const normalSlot = Object.values(newSlots).find((s) => s.channel === 'normal' && s.fileName);
    if (normalSlot) {
      const detectedNorm = detectNormalFormat(normalSlot.fileName);
      setProperties((prev) => ({ ...prev, normalType: detectedNorm }));
    }

    const autoMaterialName = extractBaseMaterialName(baseNames);

    setSlots(newSlots);
    setAllUploadedFileNames((prev) => Array.from(new Set([...prev, ...uploadedNames])));
    setUnmatchedFiles((prev) => [...prev, ...unmatched]);

    if (autoMaterialName && autoMaterialName !== 'Mtl_PBR_Custom') {
      setProperties((prev) => ({ ...prev, name: autoMaterialName }));
    }

    if (matchedCount > 0) {
      const derivedNote =
        autoDerivedCount > 0
          ? ` Orijinal Diffuse korunarak eksik ${autoDerivedCount} kanal (Roughness / Displacement) Corona Color Correct ile otomatik türetildi.`
          : '';
      setUploadFeedback(`${matchedCount} kaplama görseli kutulara yerleştirildi.${derivedNote}${unmatched.length > 0 ? ` (${unmatched.length} tanesi manuel atama için hazır)` : ''}`);
      setTimeout(() => setUploadFeedback(null), 6500);
    } else if (fileArray.length > 0) {
      setUploadFeedback(`${fileArray.length} dosya yüklendi. Görselleri aşağıdaki butonlarla dilediğiniz kutuya tek tıkla atayabilirsiniz.`);
      setTimeout(() => setUploadFeedback(null), 6000);
    }
  };

  // Assign an unmatched file directly to a channel
  const handleAssignUnmatched = (channel: PbrChannel, item: { file: File; previewUrl: string }) => {
    setSlots((prev) => {
      const updated = {
        ...prev,
        [channel]: {
          ...prev[channel],
          fileName: item.file.name,
          filePath: `C:\\Textures\\${item.file.name}`,
          previewUrl: item.previewUrl,
          isAssigned: true,
          isDerived: false,
          colorSpace: channel === 'diffuse' ? ('sRGB' as const) : ('Linear_RAW' as const),
        },
      };

      // If diffuse is assigned, auto-derive missing roughness / displacement
      if (channel === 'diffuse') {
        if (!updated.roughness?.isAssigned || updated.roughness?.isDerived) {
          const roughParams = updated.roughness?.colorCorrect || {
            enabled: true,
            sourceChannel: 'diffuse',
            invert: true,
            gamma: 0.85,
            contrast: 0.25,
            saturation: -1.0,
            brightness: 0.0,
          };
          updated.roughness = {
            ...updated.roughness,
            fileName: `CC_Roughness (${item.file.name})`,
            filePath: '',
            previewUrl: item.previewUrl,
            isAssigned: true,
            isDerived: true,
            colorSpace: 'Linear_RAW',
            colorCorrect: roughParams,
          };
          generateCoronaColorCorrectPreview(item.previewUrl, roughParams).then((ccUrl) => {
            setSlots((s) => s.roughness?.isDerived ? { ...s, roughness: { ...s.roughness, previewUrl: ccUrl } } : s);
          });
        }

        if (!updated.height?.isAssigned || updated.height?.isDerived) {
          const dispParams = updated.height?.colorCorrect || {
            enabled: true,
            sourceChannel: 'diffuse',
            invert: false,
            gamma: 0.95,
            contrast: 0.55,
            saturation: -1.0,
            brightness: -0.05,
          };
          updated.height = {
            ...updated.height,
            fileName: `CC_Displacement (${item.file.name})`,
            filePath: '',
            previewUrl: item.previewUrl,
            isAssigned: true,
            isDerived: true,
            colorSpace: 'Linear_RAW',
            colorCorrect: dispParams,
          };
          generateCoronaColorCorrectPreview(item.previewUrl, dispParams).then((ccUrl) => {
            setSlots((s) => s.height?.isDerived ? { ...s, height: { ...s.height, previewUrl: ccUrl } } : s);
          });
        }
      }

      return updated;
    });

    setUnmatchedFiles((prev) => prev.filter((u) => u.file.name !== item.file.name));
  };

  // Upload an individual texture directly to a specific slot
  const handleSingleSlotUpload = (channel: PbrChannel, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const detection = detectChannelFromFileName(file.name);

    setSlots((prev) => {
      const updated = {
        ...prev,
        [channel]: {
          ...prev[channel],
          fileName: file.name,
          filePath: `C:\\Textures\\${file.name}`,
          previewUrl: objectUrl,
          isAssigned: true,
          isDerived: false,
          colorSpace: (detection.channel === channel ? detection.colorSpace : channel === 'diffuse' ? 'sRGB' : 'Linear_RAW') as 'sRGB' | 'Linear_RAW',
        },
      };

      if (channel === 'diffuse') {
        if (!updated.roughness?.isAssigned || updated.roughness?.isDerived) {
          const roughParams = updated.roughness?.colorCorrect || {
            enabled: true,
            sourceChannel: 'diffuse',
            invert: true,
            gamma: 0.85,
            contrast: 0.25,
            saturation: -1.0,
            brightness: 0.0,
          };
          updated.roughness = {
            ...updated.roughness,
            fileName: `CC_Roughness (${file.name})`,
            filePath: '',
            previewUrl: objectUrl,
            isAssigned: true,
            isDerived: true,
            colorSpace: 'Linear_RAW',
            colorCorrect: roughParams,
          };
          generateCoronaColorCorrectPreview(objectUrl, roughParams).then((ccUrl) => {
            setSlots((s) => s.roughness?.isDerived ? { ...s, roughness: { ...s.roughness, previewUrl: ccUrl } } : s);
          });
        }

        if (!updated.height?.isAssigned || updated.height?.isDerived) {
          const dispParams = updated.height?.colorCorrect || {
            enabled: true,
            sourceChannel: 'diffuse',
            invert: false,
            gamma: 0.95,
            contrast: 0.55,
            saturation: -1.0,
            brightness: -0.05,
          };
          updated.height = {
            ...updated.height,
            fileName: `CC_Displacement (${file.name})`,
            filePath: '',
            previewUrl: objectUrl,
            isAssigned: true,
            isDerived: true,
            colorSpace: 'Linear_RAW',
            colorCorrect: dispParams,
          };
          generateCoronaColorCorrectPreview(objectUrl, dispParams).then((ccUrl) => {
            setSlots((s) => s.height?.isDerived ? { ...s, height: { ...s.height, previewUrl: ccUrl } } : s);
          });
        }
      }

      return updated;
    });

    setAllUploadedFileNames((prev) => Array.from(new Set([...prev, file.name])));
  };

  // Clear an individual slot back to an empty box
  const handleClearSlot = (channel: PbrChannel, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setSlots((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        fileName: '',
        filePath: '',
        previewUrl: undefined,
        isAssigned: false,
        isDerived: false,
      },
    }));
  };

  // 1-Click Displacement Auto-Tune
  const handleDirectAutoDisplacement = () => {
    const source: PbrChannel = slots['diffuse']?.isAssigned ? 'diffuse' : 'normal';
    const sourceUrl = slots[source]?.previewUrl || createProceduralWoodTexture('displacement');

    setSlots((prev) => ({
      ...prev,
      height: {
        ...prev.height,
        previewUrl: sourceUrl,
        isAssigned: true,
        isDerived: true,
        colorCorrect: {
          enabled: true,
          sourceChannel: source,
          invert: false,
          gamma: 0.95,
          contrast: 0.55,
          saturation: -1.0,
          brightness: -0.05,
        },
      },
    }));

    setProperties((prev) => ({
      ...prev,
      displacementAmount: 2.5,
    }));
  };

  const handleUpdateSlot = (channel: PbrChannel, updatedSlot: TextureMapSlot) => {
    setSlots((prev) => ({
      ...prev,
      [channel]: updatedSlot,
    }));
  };

  const handleApplyAiResult = (result: AiAnalysisResult) => {
    setProperties((prev) => ({
      ...prev,
      name: result.materialName || prev.name,
      category: result.materialCategory || prev.category,
      ior: result.recommendedIOR || prev.ior,
      displacementAmount: result.recommendedDisplacementAmount || prev.displacementAmount,
      metalnessMode: result.isMetallic,
      normalType: result.normalMapFormat?.toLowerCase().includes('opengl') ? 'opengl' : 'directx',
      roughnessMode: result.roughnessInvertedToGlossiness ? 'glossiness' : 'roughness',
    }));

    const newSlots = { ...slots };

    result.channelAssignments?.forEach((assign) => {
      if (newSlots[assign.channel]) {
        newSlots[assign.channel] = {
          ...newSlots[assign.channel],
          fileName: assign.matchedFileName,
          filePath: `C:\\Textures\\${assign.matchedFileName}`,
          isAssigned: true,
          isDerived: false,
          colorSpace: assign.colorSpace === 'sRGB' ? 'sRGB' : 'Linear_RAW',
        };
      }
    });

    result.suggestedColorCorrectFallbacks?.forEach((fb) => {
      if (newSlots[fb.missingChannel]) {
        const sourceUrl = newSlots[fb.deriveFromChannel]?.previewUrl || '';
        newSlots[fb.missingChannel] = {
          ...newSlots[fb.missingChannel],
          previewUrl: sourceUrl,
          isAssigned: true,
          isDerived: true,
          colorCorrect: {
            enabled: true,
            sourceChannel: (fb.deriveFromChannel as PbrChannel) || 'diffuse',
            invert: fb.coronaColorCorrectParams.invert,
            gamma: fb.coronaColorCorrectParams.gamma,
            contrast: fb.coronaColorCorrectParams.contrast,
            saturation: fb.coronaColorCorrectParams.saturation,
            brightness: fb.coronaColorCorrectParams.brightness,
          },
        };
      }
    });

    setSlots(newSlots);
  };

  const handleClearAll = () => {
    setSlots(createDefaultSlots());
    setAllUploadedFileNames([]);
    setProperties((prev) => ({ ...prev, name: 'Mtl_New_Material' }));
  };

  return (
    <div className="min-h-screen bg-[#181a1f] text-[#d6dae2] flex flex-col font-sans select-none">
      {/* =========================================================================
          1. AUTODESK 3DS MAX 2026 DESKTOP APPLICATION TITLEBAR
         ========================================================================= */}
      <div className="bg-[#1e2026] border-b border-[#14151a] px-3 py-1 flex items-center justify-between text-xs text-slate-300 z-50">
        {/* Left: 3ds Max Brand Icon & Active Scene Title */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[2px] bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center font-bold text-black text-[10px] shadow-sm">
            3ds
          </div>
          <span className="font-semibold text-slate-200 tracking-tight text-[11px] font-mono">
            Autodesk 3ds Max 2026 - [Scene_LivingRoom_01.max*] - PBR Material Studio & Project Manager Floater
          </span>
        </div>

        {/* Center: 3ds Max InfoCenter Search Bar */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#14161a] px-2.5 py-0.5 rounded-[2px] border border-[#2b2e36] text-[11px] text-slate-400 w-80">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            placeholder="Type a keyword or command (F1 for help)..."
            className="bg-transparent border-none outline-none text-slate-200 text-[11px] w-full placeholder:text-slate-600"
          />
        </div>

        {/* Right: Autodesk Account & Window Control Buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-[#252830] px-2 py-0.5 rounded-[2px] border border-[#323640]">
            <User className="w-3 h-3 text-amber-400" />
            <span className="text-slate-300 font-medium">Archviz User (PRO)</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <button className="w-5 h-5 flex items-center justify-center hover:bg-[#323640] hover:text-white rounded-[2px] transition-colors" title="Minimize">
              <Minus className="w-3 h-3" />
            </button>
            <button className="w-5 h-5 flex items-center justify-center hover:bg-[#323640] hover:text-white rounded-[2px] transition-colors" title="Maximize">
              <Square className="w-2.5 h-2.5" />
            </button>
            <button className="w-5 h-5 flex items-center justify-center hover:bg-red-600 hover:text-white rounded-[2px] transition-colors" title="Close">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. AUTODESK 3DS MAX NATIVE MENU BAR
         ========================================================================= */}
      <div className="bg-[#26282f] border-b border-[#1b1d22] px-2 py-0.5 flex items-center gap-0.5 text-[11px] text-[#c8ccd6] relative z-40">
        {[
          { label: 'File', items: ['New Scene', 'Open...', 'Save [Ctrl+S]', 'Save As...', 'Import Textures...', 'Exit'] },
          { label: 'Edit', items: ['Undo Build [Ctrl+Z]', 'Redo [Ctrl+Y]', 'Hold', 'Fetch', 'Select All [Ctrl+A]', 'Select Invert'] },
          { label: 'Tools', items: ['Asset Tracking [Shift+T]', 'Scene Explorer', 'Layer Explorer', 'Manage Materials'] },
          { label: 'Group', items: ['Group', 'Ungroup', 'Open', 'Close'] },
          { label: 'Views', items: ['Viewport Configuration', 'Show Grid [G]', 'ViewCube Settings', 'Nitrous Rendering Quality'] },
          { label: 'Create', items: ['Standard Primitives', 'Extended Primitives', 'Corona Lights', 'Corona Camera'] },
          { label: 'Modifiers', items: ['UVW Map', 'Unwrap UVW', 'CoronaDisplacementMod', 'Subdivide'] },
          { label: 'Animation', items: ['Turntable Animation', 'Auto Key [N]', 'Set Key'] },
          { label: 'Rendering', items: ['Render Setup... [F10]', 'Render [Shift+Q]', 'Corona VFB [Ctrl+F]', 'Environment [8]'] },
          { label: 'Customize', items: ['Preferences...', 'Configure User Paths', 'Units Setup (Centimeters)', 'Custom UI & Defaults'] },
          { label: 'MAXScript', items: ['New Script', 'Open Script...', 'Run Script... (.ms)', 'MAXScript Listener [F11]'] },
          { label: 'Help', items: ['3ds Max Help [F1]', 'Corona Renderer Documentation', 'PBR Material Guide', 'About'] },
        ].map((menu) => (
          <div key={menu.label} className="relative">
            <button
              onClick={() => setActiveMaxMenu(activeMaxMenu === menu.label ? null : menu.label)}
              className={`px-2 py-0.5 rounded-[2px] transition-colors ${
                activeMaxMenu === menu.label
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'hover:bg-[#383c46] hover:text-white'
              }`}
            >
              {menu.label}
            </button>

            {activeMaxMenu === menu.label && (
              <div
                className="absolute top-full left-0 mt-0.5 w-48 bg-[#202228] border border-[#3b404d] shadow-2xl rounded-[2px] py-1 text-slate-200 z-50 animate-fadeIn"
                onMouseLeave={() => setActiveMaxMenu(null)}
              >
                {menu.items.map((subItem) => (
                  <button
                    key={subItem}
                    onClick={() => {
                      setActiveMaxMenu(null);
                      if (subItem.includes('Render Setup')) setIsPropertiesOpen(true);
                      else if (subItem.includes('Run Script') || subItem.includes('New Script')) setIsScriptModalOpen(true);
                      else if (subItem.includes('Asset Tracking')) setActiveEditorTab('library');
                    }}
                    className="w-full text-left px-3 py-1 text-[11px] hover:bg-amber-500 hover:text-black flex items-center justify-between transition-colors"
                  >
                    <span>{subItem}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* =========================================================================
          3. AUTODESK 3DS MAX QUICK ACCESS RIBBON / MAIN TOOLBAR
         ========================================================================= */}
      <div className="bg-[#2c2f37] border-b border-[#1e2025] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Transformation & Selection Tools */}
        <div className="flex items-center gap-1">
          <button className="p-1 rounded-[2px] hover:bg-[#3b404c] text-slate-300 hover:text-white border border-transparent hover:border-[#4b5160]" title="Undo [Ctrl+Z]">
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded-[2px] hover:bg-[#3b404c] text-slate-300 hover:text-white border border-transparent hover:border-[#4b5160]" title="Redo [Ctrl+Y]">
            <Redo className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-[#3d424e] mx-1" />

          <button className="px-1.5 py-0.5 rounded-[2px] bg-[#383d47] border border-[#202227] text-slate-200 hover:bg-[#434955] flex items-center gap-1 text-[10px]" title="Select Object [Q]">
            <MousePointer className="w-3 h-3 text-amber-400" />
            <span>Select</span>
          </button>
          <button className="px-1.5 py-0.5 rounded-[2px] bg-[#383d47] border border-[#202227] text-slate-200 hover:bg-[#434955] flex items-center gap-1 text-[10px]" title="Select and Move [W]">
            <Move className="w-3 h-3 text-cyan-400" />
            <span>Move</span>
          </button>
          <button className="px-1.5 py-0.5 rounded-[2px] bg-[#383d47] border border-[#202227] text-slate-200 hover:bg-[#434955] flex items-center gap-1 text-[10px]" title="Select and Rotate [E]">
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span>Rotate</span>
          </button>

          <div className="w-[1px] h-4 bg-[#3d424e] mx-1" />

          {/* Reference Coordinate System */}
          <div className="flex items-center gap-1 bg-[#1e2026] px-2 py-0.5 rounded-[2px] border border-[#3b404c] text-[10px] text-slate-300">
            <span className="text-slate-500">Coord:</span>
            <span className="font-semibold text-amber-400">View ▾</span>
          </div>

          {/* Snaps */}
          <div className="flex items-center gap-0.5 bg-[#1e2026] px-1.5 py-0.5 rounded-[2px] border border-[#3b404c] text-[10px] text-slate-300">
            <span className="font-bold text-amber-400">3</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">🧲 Angle</span>
          </div>
        </div>

        {/* Center: Editor Mode & Engine Selectors */}
        <div className="flex items-center gap-2">
          {/* Material Editor [M] Active Button */}
          <button
            onClick={() => setActiveEditorTab('slate')}
            className={`px-2 py-1 rounded-[2px] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[inset_1px_1px_0px_rgba(255,255,255,0.15)] ${
              activeEditorTab === 'slate'
                ? 'bg-amber-500 text-black border border-amber-600 font-bold'
                : 'bg-[#373b45] text-slate-200 border border-[#202227] hover:bg-[#434855]'
            }`}
            title="Slate Material Editor [M]"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Material Editor [M]</span>
          </button>

          {/* Render Engine Switcher */}
          <div className="flex items-center bg-[#1e2026] p-0.5 rounded-[2px] border border-[#3b404c] text-[10px]">
            <button
              onClick={() => setProperties((p) => ({ ...p, engine: 'corona' }))}
              className={`px-2 py-0.5 rounded-[2px] font-bold transition-all ${
                properties.engine === 'corona'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Corona 11/12
            </button>
            <button
              onClick={() => setProperties((p) => ({ ...p, engine: 'vray' }))}
              className={`px-2 py-0.5 rounded-[2px] font-bold transition-all ${
                properties.engine === 'vray'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chaos V-Ray 6/7
            </button>
          </div>
        </div>

        {/* Right: Render Setup & Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPropertiesOpen(true)}
            className="px-2 py-1 bg-[#373b45] hover:bg-[#434855] text-slate-200 border border-[#202227] rounded-[2px] text-[11px] font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Render Setup [F10]</span>
          </button>

          <button
            onClick={handleCopyDirectScript}
            className="px-2.5 py-1 bg-gradient-to-b from-[#e5a017] to-[#c78206] hover:from-[#f3b028] hover:to-[#d68e0d] text-black font-bold border border-[#9a6403] rounded-[2px] text-[11px] flex items-center gap-1.5 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] transition-all"
            title="MaxScript'i panoya kopyala ve 3ds Max'te seçili nesneye uygula"
          >
            <Play className="w-3 h-3 fill-black" />
            <span>Sahneye Ata (.ms)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          4. 3DS MAX FLOATER HEADER BAR & ACTION STRIP
         ========================================================================= */}
      <div className="bg-[#24272f] border-b border-[#1a1c22] px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        {/* Floater Window Badge */}
        <div className="flex items-center gap-2">
          <div className="px-1.5 py-0.5 bg-[#383d47] border border-[#202227] rounded-[2px] text-[10px] font-mono text-amber-400 font-bold">
            FLOATER
          </div>
          <span className="font-bold text-slate-200 text-xs">
            PBR Material Studio & Project Manager Floater
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-[#191b20] px-1.5 py-0.5 rounded border border-[#2a2d36]">
            Mtl: {properties.name}
          </span>
        </div>

        {/* Action Buttons in 3ds Max Beveled Style */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyDirectScript}
            className="px-3 py-1 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-[2px] border border-amber-700 text-xs shadow flex items-center gap-1.5 transition-all"
          >
            <Play className="w-3 h-3 fill-black" />
            <span>✦ SEÇİLİ OBJEYE ATA (ASSIGN MATERIAL)</span>
          </button>

          <button
            onClick={handleDownloadDirectMs}
            className="px-2.5 py-1 bg-[#373b45] hover:bg-[#434855] text-slate-200 border border-[#202227] rounded-[2px] text-xs font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>MaxScript (.ms) İndir</span>
          </button>

          <button
            onClick={() => setIsScriptModalOpen(true)}
            className="px-2.5 py-1 bg-[#373b45] hover:bg-[#434855] text-slate-200 border border-[#202227] rounded-[2px] text-xs font-medium flex items-center gap-1.5 shadow-sm"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kodu İncele</span>
          </button>
        </div>
      </div>

      {/* Copy / Direct Execution Notification Toast */}
      {copiedToast && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 text-emerald-200 text-xs px-4 py-2 flex items-center justify-between shadow-lg animate-fadeIn z-50">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">
              3ds Max Scripti Panoya Kopyalandı! 3ds Max içinde MAXScript Listener (F11) veya Script Editor (Ctrl+E) ile doğrudan çalıştırıp seçili objeye atayabilirsiniz.
            </span>
          </div>
          <button onClick={() => setCopiedToast(false)} className="text-emerald-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Upload Feedback Banner */}
      {uploadFeedback && (
        <div className="bg-[#182822] border-b border-emerald-600/40 text-emerald-200 text-xs px-4 py-2 flex items-center justify-between shadow-lg animate-fadeIn z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadFeedback}</span>
          </div>
          <button onClick={() => setUploadFeedback(null)} className="text-emerald-400 hover:text-white text-xs px-1">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          5. MAIN WORKSPACE: 3DS MAX DOCKED/FLOATING ROLLOUTS & VIEWPORT
         ========================================================================= */}
      <main className="flex-1 w-full p-2.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-x-hidden">
        {/* =======================================================================
            LEFT COLUMN (7 cols): 3DS MAX COMPACT COMMAND PANEL WIZARD (3-STEP)
           ======================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <WizardPbrStudio
            properties={properties}
            setProperties={setProperties}
            slots={slots}
            setSlots={setSlots}
            activeSelectedChannel={activeSelectedChannel}
            setActiveSelectedChannel={setActiveSelectedChannel}
            targetFolderPath={targetFolderPath}
            setTargetFolderPath={setTargetFolderPath}
            allUploadedFileNames={allUploadedFileNames}
            unmatchedFiles={unmatchedFiles}
            processFileList={processFileList}
            handleFileUpload={handleFileUpload}
            handleSingleSlotUpload={handleSingleSlotUpload}
            handleClearSlot={handleClearSlot}
            handleClearAll={handleClearAll}
            handleAssignUnmatched={handleAssignUnmatched}
            handleDirectAutoDisplacement={handleDirectAutoDisplacement}
            handleCopyDirectScript={handleCopyDirectScript}
            handleCopyRolloutScript={handleCopyRolloutScript}
            handleDownloadDirectMs={handleDownloadDirectMs}
            setIsPropertiesOpen={setIsPropertiesOpen}
            setIsScriptModalOpen={setIsScriptModalOpen}
            loadPresetByName={(pName) => {
              const p = PRESETS.find((x) => x.name === pName);
              if (p) loadPreset(p);
            }}
            handleApplyAiResult={handleApplyAiResult}
          />
        </div>

        {/* =======================================================================
            RIGHT COLUMN (5 cols): NITROUS VIEWPORT, 3-WAY EDITOR & PROJECT MANAGER
           ======================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          {/* 3ds Max Nitrous Viewport Container with Yellow Active Frame */}
          <div className="h-[350px] border-2 border-[#e5a017] rounded-[2px] overflow-hidden shadow-2xl relative">
            <ViewportPreview
              properties={properties}
              slots={slots}
              activeSelectedChannel={activeSelectedChannel}
              onSelectChannel={(chan) => setActiveSelectedChannel(chan)}
            />
          </div>

          {/* 3-Way Editor Switcher Toolbar (Selector 2) */}
          <div className="flex items-center justify-between bg-[#24272f] border border-[#1f2228] p-0.5 rounded-[2px] gap-1 shadow-inner">
            <button
              onClick={() => setActiveEditorTab('slate')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-semibold rounded-[2px] transition-all border ${
                activeEditorTab === 'slate'
                  ? 'bg-amber-500 text-black border-amber-600 font-bold shadow'
                  : 'text-slate-300 hover:bg-[#31353e] border-transparent'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Slate SME (Node)</span>
            </button>
            <button
              onClick={() => setActiveEditorTab('compact')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-semibold rounded-[2px] transition-all border ${
                activeEditorTab === 'compact'
                  ? 'bg-cyan-500 text-black border-cyan-600 font-bold shadow'
                  : 'text-slate-300 hover:bg-[#31353e] border-transparent'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>Compact (24 Slot)</span>
            </button>
            <button
              onClick={() => setActiveEditorTab('library')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[10px] font-semibold rounded-[2px] transition-all border ${
                activeEditorTab === 'library'
                  ? 'bg-amber-500 text-black border-amber-600 font-bold shadow-[inset_1px_1px_0px_rgba(255,255,255,0.25)]'
                  : 'text-slate-300 hover:bg-[#31353e] hover:text-white border-transparent'
              }`}
            >
              <FolderArchive className="w-3 h-3" />
              <span>Project Manager & Klasörler</span>
            </button>
          </div>

          {/* Active View: Slate SME / Compact 24 / Project Manager Material Vault (Selector 1) */}
          {activeEditorTab === 'slate' ? (
            <SlateNodeVisualizer
              properties={properties}
              slots={slots}
              onOpenProperties={() => setIsPropertiesOpen(true)}
            />
          ) : activeEditorTab === 'compact' ? (
            <CompactSlotVisualizer
              properties={properties}
              onSelectSlot={(slotNum) => setProperties((prev) => ({ ...prev, compactSlotIndex: slotNum }))}
            />
          ) : (
            <MaterialLibraryManager
              currentProperties={properties}
              currentSlots={slots}
              onLoadMaterialIntoStudio={(mat: SavedLibraryMaterial) => {
                setProperties(mat.properties);
                setSlots(mat.slots);
                setActiveEditorTab('slate');
                setUploadFeedback(`'${mat.name}' kütüphaneden stüdyoya yüklendi ve 3D önizlemeye yansıtıldı.`);
                setTimeout(() => setUploadFeedback(null), 4500);
              }}
            />
          )}

          {/* MaxScript Generation Trigger Card */}
          <div className="border border-[#1f2228] bg-[#24272f] p-2 rounded-[2px] shadow flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#323640] pb-1">
              <span className="font-bold text-slate-200 text-[11px]">3ds Max MAXScript Çıktısı</span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1 py-0.2 rounded-[1px]">
                Canlı Hazır
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-slate-300 font-mono text-[10px]">
              <div>
                <span className="text-slate-500">Motor:</span>{' '}
                <span className="text-amber-400 font-bold uppercase">{properties.engine}</span>
              </div>
              <div>
                <span className="text-slate-500">Hedef:</span>{' '}
                <span className="text-cyan-400 font-bold">{properties.editorTarget}</span>
              </div>
              <div>
                <span className="text-slate-500">Slot:</span>{' '}
                <span className="text-slate-200">#{properties.compactSlotIndex}</span>
              </div>
              <div>
                <span className="text-slate-500">Disp:</span>{' '}
                <span className="text-purple-300">{properties.displacementAmount} cm</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                onClick={handleCopyDirectScript}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-bold text-black bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-[2px] shadow border border-amber-700 transition-all"
              >
                <Play className="w-3 h-3 fill-black" />
                <span>Sahneye Ata (Kodu Kopyala)</span>
              </button>

              <button
                onClick={handleDownloadDirectMs}
                className="px-2 py-1 text-[10px] font-medium text-slate-200 bg-[#373b45] hover:bg-[#434855] rounded-[2px] border border-[#202227] shadow-sm flex items-center gap-1"
                title=".ms Dosyasını İndir"
              >
                <Download className="w-3 h-3" />
                <span>.ms İndir</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Material Properties Modal */}
      <MaterialPropertiesModal
        isOpen={isPropertiesOpen}
        onClose={() => setIsPropertiesOpen(false)}
        properties={properties}
        onUpdateProperties={setProperties}
        slots={slots}
        onUpdateSlot={handleUpdateSlot}
      />

      {/* Script Output Modal */}
      <ScriptOutputModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        properties={properties}
        slots={slots}
      />
    </div>
  );
}

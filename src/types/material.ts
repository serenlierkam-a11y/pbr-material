export type PbrChannel =
  | 'diffuse'
  | 'roughness'
  | 'glossiness'
  | 'normal'
  | 'metalness'
  | 'height'
  | 'ao'
  | 'specular'
  | 'opacity'
  | 'emission';

export type RenderEngine = 'corona' | 'vray';
export type EditorTarget = 'slate' | 'compact' | 'both_rollout';
export type NormalFormat = 'directx' | 'opengl';

export interface ColorCorrectSettings {
  enabled: boolean;
  sourceChannel: PbrChannel;
  invert: boolean;
  gamma: number;       // default 0.85
  contrast: number;    // default 0.25 (-1.0 to 1.0)
  saturation: number;  // default -1.0 (100% desaturated)
  brightness: number;  // default 0.0
}

export interface TextureMapSlot {
  channel: PbrChannel;
  label: string;
  fileName: string;
  filePath: string;
  previewUrl?: string;
  isAssigned: boolean;
  isDerived: boolean;
  colorSpace: 'sRGB' | 'Linear_RAW';
  colorCorrect: ColorCorrectSettings;
  confidence?: number;
}

export interface MaterialProperties {
  name: string;
  category: string;
  engine: RenderEngine;
  editorTarget: EditorTarget;
  compactSlotIndex: number; // 1 - 24
  roughnessMode: 'roughness' | 'glossiness';
  normalType: NormalFormat;
  ior: number;
  metalnessMode: boolean; // 0 for dielectric, 1 for metallic
  baseColorHex: string;
  displacementAmount: number; // in cm
  applyToSelected: boolean;
  showInViewport: boolean;
  useCoronaColorCorrectFallback: boolean;
}

export interface AiAnalysisResult {
  materialName: string;
  materialCategory: string;
  isMetallic: boolean;
  recommendedIOR: number;
  recommendedDisplacementAmount?: number;
  roughnessInvertedToGlossiness: boolean;
  normalMapFormat: string;
  suggestedColorCorrectFallbacks: {
    missingChannel: string;
    deriveFromChannel: string;
    explanation: string;
    coronaColorCorrectParams: {
      invert: boolean;
      gamma: number;
      contrast: number;
      saturation: number;
      brightness: number;
    };
  }[];
  channelAssignments: {
    channel: string;
    matchedFileName: string;
    confidence: number;
    colorSpace: string;
  }[];
  aiExpertSummary: string;
}

export type PreviewMapMode = 'combined' | 'diffuse' | 'roughness' | 'normal' | 'height' | 'metalness';

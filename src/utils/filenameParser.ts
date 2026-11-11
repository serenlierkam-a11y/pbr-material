import { PbrChannel, NormalFormat } from '../types/material';

interface MatchRule {
  channel: PbrChannel;
  patterns: RegExp[];
  colorSpace: 'sRGB' | 'Linear_RAW';
}

const RULES: MatchRule[] = [
  {
    channel: 'diffuse',
    patterns: [
      /(?:^|[_\-. ])(diffuse|albedo|basecolor|base_color|base-color|color|colour|col|diff|alb|bc|renk|desen)(?:[_\-. ]|$)/i,
      /(?:^|[_\-. ])(d|c)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'sRGB',
  },
  {
    channel: 'roughness',
    patterns: [
      /(?:^|[_\-. ])(roughness|rough|rgh|puruz|puruzluluk|matte)(?:[_\-. ]|$)/i,
      /(?:^|[_\-. ])(r)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'Linear_RAW',
  },
  {
    channel: 'glossiness',
    patterns: [
      /(?:^|[_\-. ])(glossiness|gloss|gls|parlak|parlaklik)(?:[_\-. ]|$)/i,
      /(?:^|[_\-. ])(g)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'Linear_RAW',
  },
  {
    channel: 'normal',
    patterns: [
      /(?:^|[_\-. ])(normal|norm|nor|nrm|normalmap|normal_map|directx|opengl)(?:[_\-. ]|$)/i,
      /(?:^|[_\-. ])(n|dx|gl)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'Linear_RAW',
  },
  {
    channel: 'height',
    patterns: [
      /(?:^|[_\-. ])(displacement|disp|height|bump|depth|dsp|yukseklik|derinlik|kabartma|bmp)(?:[_\-. ]|$)/i,
      /(?:^|[_\-. ])(h|b)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'Linear_RAW',
  },
  {
    channel: 'metalness',
    patterns: [
      /(?:^|[_\-. ])(metalness|metallic|metal|met|metalik)(?:[_\-. ]|$)/i,
      /(?:^|[_\-. ])(m)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'Linear_RAW',
  },
  {
    channel: 'ao',
    patterns: [
      /(?:^|[_\-. ])(ao|ambientocclusion|ambient_occlusion|occlusion|occ|golge)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'Linear_RAW',
  },
  {
    channel: 'specular',
    patterns: [
      /(?:^|[_\-. ])(specular|spec|refl|reflection|yansima)(?:[_\-. ]|$)/i,
      /(?:^|[_\-. ])(s)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'Linear_RAW',
  },
  {
    channel: 'opacity',
    patterns: [
      /(?:^|[_\-. ])(opacity|alpha|mask|transparency|trans|saydam|gecirgen)(?:[_\-. ]|$)/i,
      /(?:^|[_\-. ])(a)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'Linear_RAW',
  },
  {
    channel: 'emission',
    patterns: [
      /(?:^|[_\-. ])(emission|emissive|glow|emit|isik)(?:[_\-. ]|$)/i,
      /(?:^|[_\-. ])(e)(?:[_\-. ]|$)/i,
    ],
    colorSpace: 'sRGB',
  },
];

export function detectChannelFromFileName(fileName: string): {
  channel: PbrChannel | 'unknown';
  confidence: number;
  colorSpace: 'sRGB' | 'Linear_RAW';
} {
  // Strip extension
  const cleanName = fileName.replace(/\.[a-zA-Z0-9]+$/, '').trim();

  // 1. Strict regex pattern check
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(cleanName)) {
        return {
          channel: rule.channel,
          confidence: 0.98,
          colorSpace: rule.colorSpace,
        };
      }
    }
  }

  // 2. Substring & Token matching
  const lower = cleanName.toLowerCase();
  const tokens = lower.split(/[^a-zA-Z0-9]/).filter(Boolean);

  for (const token of tokens) {
    if (['diff', 'diffuse', 'albedo', 'basecolor', 'base_color', 'base', 'color', 'colour', 'col', 'alb', 'd', 'c', 'bc', 'renk', 'desen', 'doku'].includes(token)) {
      return { channel: 'diffuse', confidence: 0.95, colorSpace: 'sRGB' };
    }
    if (['rough', 'roughness', 'rgh', 'r', 'puruz', 'puruzluluk', 'matte', 'mat'].includes(token)) {
      return { channel: 'roughness', confidence: 0.95, colorSpace: 'Linear_RAW' };
    }
    if (['gloss', 'glossiness', 'gls', 'g', 'parlak', 'parlaklik', 'refl', 'reflection'].includes(token)) {
      return { channel: 'glossiness', confidence: 0.92, colorSpace: 'Linear_RAW' };
    }
    if (['norm', 'normal', 'nor', 'nrm', 'n', 'dx', 'gl', 'normalmap', 'directx', 'opengl', 'egim'].includes(token)) {
      return { channel: 'normal', confidence: 0.95, colorSpace: 'Linear_RAW' };
    }
    if (['disp', 'displacement', 'height', 'bump', 'depth', 'dsp', 'h', 'b', 'bmp', 'derinlik', 'yukseklik', 'kabartma'].includes(token)) {
      return { channel: 'height', confidence: 0.95, colorSpace: 'Linear_RAW' };
    }
    if (['metal', 'metalness', 'metallic', 'met', 'm', 'metalik'].includes(token)) {
      return { channel: 'metalness', confidence: 0.95, colorSpace: 'Linear_RAW' };
    }
    if (['ao', 'occlusion', 'ambientocclusion', 'occ', 'golge', 'cavity'].includes(token)) {
      return { channel: 'ao', confidence: 0.95, colorSpace: 'Linear_RAW' };
    }
    if (['spec', 'specular', 'yansima'].includes(token)) {
      return { channel: 'specular', confidence: 0.9, colorSpace: 'Linear_RAW' };
    }
    if (['alpha', 'opacity', 'mask', 'saydam'].includes(token)) {
      return { channel: 'opacity', confidence: 0.9, colorSpace: 'Linear_RAW' };
    }
    if (['emit', 'emission', 'glow', 'isik'].includes(token)) {
      return { channel: 'emission', confidence: 0.9, colorSpace: 'sRGB' };
    }
  }

  // 3. Fallback contains checks
  if (lower.includes('diff') || lower.includes('albedo') || lower.includes('basecolor') || lower.includes('color') || lower.includes('colour') || lower.includes('renk') || lower.includes('desen')) {
    return { channel: 'diffuse', confidence: 0.88, colorSpace: 'sRGB' };
  }
  if (lower.includes('rough') || lower.includes('puruz') || lower.endsWith('_r') || lower.endsWith('-r')) {
    return { channel: 'roughness', confidence: 0.88, colorSpace: 'Linear_RAW' };
  }
  if (lower.includes('gloss') || lower.includes('parlak') || lower.includes('refl') || lower.endsWith('_g') || lower.endsWith('-g')) {
    return { channel: 'glossiness', confidence: 0.85, colorSpace: 'Linear_RAW' };
  }
  if (lower.includes('norm') || lower.includes('egim') || lower.endsWith('_n') || lower.endsWith('-n') || lower.endsWith('normal')) {
    return { channel: 'normal', confidence: 0.88, colorSpace: 'Linear_RAW' };
  }
  if (lower.includes('disp') || lower.includes('height') || lower.includes('bump') || lower.includes('derinlik') || lower.includes('yukseklik') || lower.includes('kabartma') || lower.endsWith('_h') || lower.endsWith('-h') || lower.endsWith('_b')) {
    return { channel: 'height', confidence: 0.88, colorSpace: 'Linear_RAW' };
  }
  if (lower.includes('metal') || lower.includes('metallic') || lower.endsWith('_m') || lower.endsWith('-m')) {
    return { channel: 'metalness', confidence: 0.88, colorSpace: 'Linear_RAW' };
  }
  if (lower.includes('ao') || lower.includes('occlu') || lower.includes('golge')) {
    return { channel: 'ao', confidence: 0.88, colorSpace: 'Linear_RAW' };
  }

  return { channel: 'unknown', confidence: 0.0, colorSpace: 'sRGB' };
}

/**
 * Smart batch analyzer for texture packages.
 * When multiple files are uploaded together from a folder, identifies diffuse files that lack explicit "diffuse" suffixes
 * by checking if they form the base prefix of the package.
 */
export function analyzeBatchFiles(fileNames: string[]): Record<string, { channel: PbrChannel | 'unknown'; colorSpace: 'sRGB' | 'Linear_RAW'; confidence: number }> {
  const result: Record<string, { channel: PbrChannel | 'unknown'; colorSpace: 'sRGB' | 'Linear_RAW'; confidence: number }> = {};
  const unresolved: string[] = [];
  const assignedChannels = new Set<string>();

  // Pass 1: Individual detection
  for (const name of fileNames) {
    const det = detectChannelFromFileName(name);
    let resolvedChannel = det.channel;

    // In PBR workflows, glossiness is mapped to roughness slot
    if (resolvedChannel === 'glossiness') {
      resolvedChannel = 'roughness';
    }

    if (resolvedChannel !== 'unknown') {
      result[name] = {
        channel: resolvedChannel,
        colorSpace: det.colorSpace,
        confidence: det.confidence,
      };
      assignedChannels.add(resolvedChannel);
    } else {
      unresolved.push(name);
    }
  }

  // Pass 2: If diffuse channel is not yet filled and there are unresolved files,
  // find the file that is most likely the base diffuse texture.
  if (!assignedChannels.has('diffuse') && unresolved.length > 0) {
    // Pick the shortest filename or the one without any non-diffuse tokens
    const sorted = [...unresolved].sort((a, b) => a.length - b.length);
    const candidate = sorted[0];

    result[candidate] = {
      channel: 'diffuse',
      colorSpace: 'sRGB',
      confidence: 0.85,
    };
    assignedChannels.add('diffuse');
    const idx = unresolved.indexOf(candidate);
    if (idx !== -1) unresolved.splice(idx, 1);
  }

  // Unresolved remain marked as unknown for manual 1-click slot assignment
  for (const name of unresolved) {
    if (!result[name]) {
      result[name] = {
        channel: 'unknown',
        colorSpace: 'Linear_RAW',
        confidence: 0.0,
      };
    }
  }

  return result;
}

export function detectNormalFormat(fileName: string): NormalFormat {
  const lower = fileName.toLowerCase();
  if (lower.includes('opengl') || lower.includes('_gl') || lower.includes('-gl') || lower.includes(' gl')) {
    return 'opengl';
  }
  return 'directx';
}

export function extractBaseMaterialName(fileNames: string[]): string {
  if (!fileNames.length) return 'Mtl_PBR_Custom';

  const strippedNames = fileNames.map((name) => {
    return name
      .replace(/\.[a-zA-Z0-9]+$/, '')
      .replace(/[_\-. ](diffuse|albedo|basecolor|color|roughness|rough|glossiness|normal|norm|metalness|metallic|displacement|disp|height|bump|ao|ambientocclusion|specular|alpha|opacity|emit|4k|2k|8k|1k|16k|1080p|png|jpg|exr|tif|tiff)$/gi, '')
      .replace(/[_\-. ](directx|opengl|dx|gl|d|r|n|h|m|b|c|g)$/gi, '')
      .trim();
  });

  const first = strippedNames[0];
  let prefix = '';
  for (let i = 0; i < first.length; i++) {
    const char = first[i];
    if (strippedNames.every((n) => n[i] === char)) {
      prefix += char;
    } else {
      break;
    }
  }

  prefix = prefix.replace(/[_\-. ]+$/, '').trim();

  if (prefix.length >= 2) {
    const sanitized = prefix.replace(/[^a-zA-Z0-9_]/g, '_');
    return sanitized.startsWith('Mtl_') ? sanitized : `Mtl_${sanitized}`;
  }

  return 'Mtl_PBR_Custom';
}

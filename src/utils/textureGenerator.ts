/**
 * High-quality procedural PBR texture generator for 3ds Max Studio preview.
 * Generates high-res canvas Data URLs for Diffuse, Roughness, Normal, Displacement, and AO.
 */

export function createProceduralWoodTexture(type: 'diffuse' | 'roughness' | 'normal' | 'displacement'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'diffuse') {
    // Rich Nordic Oak wood grain
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#b8895b');
    grad.addColorStop(0.3, '#c99a6c');
    grad.addColorStop(0.6, '#a47648');
    grad.addColorStop(1, '#bb8c5e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Wood plank lines
    for (let p = 0; p < 512; p += 128) {
      ctx.strokeStyle = '#5a3d20';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.stroke();
    }

    // Wood grain fibers and growth rings
    for (let i = 0; i < 400; i++) {
      const y = Math.random() * 512;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(74, 46, 20, 0.22)' : 'rgba(235, 195, 155, 0.18)';
      ctx.lineWidth = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(150, y + (Math.random() - 0.5) * 20, 350, y + (Math.random() - 0.5) * 20, 512, y);
      ctx.stroke();
    }
  } else if (type === 'roughness') {
    // Greyscale Roughness: dark = glossy, light = rough
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, 512, 512);

    // Plank gaps are rougher (lighter)
    for (let p = 0; p < 512; p += 128) {
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.stroke();
    }

    for (let i = 0; i < 350; i++) {
      const y = Math.random() * 512;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(220, 220, 220, 0.25)' : 'rgba(20, 20, 20, 0.2)';
      ctx.lineWidth = Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + (Math.random() - 0.5) * 15);
      ctx.stroke();
    }
  } else if (type === 'normal') {
    // Tangent space normal map (Base: #8080FF)
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 512, 512);

    // Plank grooves in normal map (Red/Green slopes)
    for (let p = 0; p < 512; p += 128) {
      ctx.strokeStyle = '#5080e0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p - 1, 0);
      ctx.lineTo(p - 1, 512);
      ctx.stroke();

      ctx.strokeStyle = '#b080e0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p + 1, 0);
      ctx.lineTo(p + 1, 512);
      ctx.stroke();
    }

    // Fine wood grain noise in normal
    for (let i = 0; i < 200; i++) {
      const y = Math.random() * 512;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(100, 140, 255, 0.3)' : 'rgba(150, 110, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  } else if (type === 'displacement') {
    // Height map: dark = low/recessed, white = high/raised
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, 512, 512);

    // Recessed plank gaps
    for (let p = 0; p < 512; p += 128) {
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.stroke();
    }

    for (let i = 0; i < 150; i++) {
      const y = Math.random() * 512;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(230, 230, 230, 0.15)' : 'rgba(30, 30, 30, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function createProceduralMetalTexture(type: 'diffuse' | 'roughness' | 'normal'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'diffuse') {
    ctx.fillStyle = '#b0b5bd';
    ctx.fillRect(0, 0, 512, 512);

    // Fine linear brushed streaks
    for (let i = 0; i < 600; i++) {
      const y = Math.random() * 512;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(240, 245, 255, 0.25)' : 'rgba(100, 110, 120, 0.25)';
      ctx.lineWidth = Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  } else if (type === 'roughness') {
    ctx.fillStyle = '#3a3d42';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 450; i++) {
      const y = Math.random() * 512;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(180, 180, 180, 0.3)' : 'rgba(10, 10, 10, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  } else if (type === 'normal') {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 300; i++) {
      const y = Math.random() * 512;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(110, 130, 255, 0.35)' : 'rgba(140, 110, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function createProceduralMarbleTexture(type: 'diffuse' | 'roughness' | 'normal' | 'displacement'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'diffuse') {
    // Carrara White with dark grey veining
    ctx.fillStyle = '#f5f6f8';
    ctx.fillRect(0, 0, 512, 512);

    // Marble veins
    ctx.strokeStyle = 'rgba(70, 75, 85, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(120, 180, 320, 140, 512, 380);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100, 105, 115, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.bezierCurveTo(240, 220, 280, 380, 420, 512);
    ctx.stroke();

    // Secondary fine veins
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = 'rgba(140, 145, 155, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 512);
      ctx.lineTo(Math.random() * 512, Math.random() * 512);
      ctx.stroke();
    }
  } else if (type === 'roughness') {
    // Highly polished (dark grey ~0.15) with slightly rougher veins
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(120, 120, 120, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(120, 180, 320, 140, 512, 380);
    ctx.stroke();
  } else if (type === 'normal') {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(90, 120, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(120, 180, 320, 140, 512, 380);
    ctx.stroke();
  } else if (type === 'displacement') {
    ctx.fillStyle = '#999999';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(120, 180, 320, 140, 512, 380);
    ctx.stroke();
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Simulates Chaos Corona Color Correct (CoronaColorCorrect) on a source image
 * to generate a live preview without modifying the original diffuse texture.
 */
export function generateCoronaColorCorrectPreview(
  sourceUrl: string,
  params: {
    invert: boolean;
    gamma: number;
    contrast: number;
    saturation: number;
    brightness: number;
  }
): Promise<string> {
  return new Promise((resolve) => {
    if (!sourceUrl) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 512;
        let w = img.width || 512;
        let h = img.height || 512;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = Math.max(w, 64);
        canvas.height = Math.max(h, 64);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(sourceUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        const gamma = Math.max(0.1, params.gamma || 1.0);
        const contrast = Math.max(-1.0, Math.min(1.0, params.contrast || 0.0));
        const brightness = Math.max(-1.0, Math.min(1.0, params.brightness || 0.0));
        const invert = Boolean(params.invert);
        const satFactor = Math.max(-1.0, Math.min(1.0, params.saturation ?? -1.0)); // -1.0 = full grayscale

        for (let i = 0; i < d.length; i += 4) {
          let r = d[i];
          let g = d[i + 1];
          let b = d[i + 2];

          // 1. Grayscale luminance (Rec. 709)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // 2. Saturation
          if (satFactor <= -0.99) {
            r = lum;
            g = lum;
            b = lum;
          } else if (satFactor !== 0) {
            r = r + (lum - r) * -satFactor;
            g = g + (lum - g) * -satFactor;
            b = b + (lum - b) * -satFactor;
          }

          // 3. Contrast & Brightness
          let val = (r + g + b) / 3 / 255;
          val = (val - 0.5) * (1 + contrast * 1.5) + 0.5 + brightness;
          val = Math.max(0, Math.min(1, val));

          // 4. Gamma
          val = Math.pow(val, 1 / gamma);

          // 5. Invert
          if (invert) {
            val = 1 - val;
          }

          const finalByte = Math.round(Math.max(0, Math.min(255, val * 255)));
          d[i] = finalByte;
          d[i + 1] = finalByte;
          d[i + 2] = finalByte;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch {
        resolve(sourceUrl);
      }
    };

    img.onerror = () => {
      resolve(sourceUrl);
    };

    img.src = sourceUrl;
  });
}

/**
 * Generates faithful preview thumbnails matching K-Studio Project Manager 3.22 screenshot assets
 */
export function createProjectManagerThumbnail(variant: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#1c1b18';
  ctx.fillRect(0, 0, 400, 400);

  if (variant === 'italon_60x120') {
    // Light warm travertine / element wall tile
    const grad = ctx.createLinearGradient(0, 0, 400, 400);
    grad.addColorStop(0, '#e5dccb');
    grad.addColorStop(0.5, '#d8cdb8');
    grad.addColorStop(1, '#c5b79e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 400);

    // Subtle veins
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = 'rgba(160, 140, 120, 0.2)';
      ctx.lineWidth = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 400, 0);
      ctx.bezierCurveTo(Math.random() * 400, 150, Math.random() * 400, 250, Math.random() * 400, 400);
      ctx.stroke();
    }

    // Sunlight ray from left
    const sunGrad = ctx.createLinearGradient(0, 0, 250, 400);
    sunGrad.addColorStop(0, 'rgba(255, 255, 240, 0.45)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 240, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(260, 0);
    ctx.lineTo(140, 400);
    ctx.lineTo(0, 400);
    ctx.fill();

    // Banner at bottom: ITALON ELEMENT 60X120
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(30, 310, 340, 36);
    ctx.fillStyle = '#0f4c81';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('ITALON', 45, 334);
    ctx.fillStyle = '#333333';
    ctx.font = '13px sans-serif';
    ctx.fillText('ELEMENT 60X120', 130, 334);
  } else if (variant === 'sunlit_parquet' || variant === 'sunlight_dark') {
    // Oak parquet planks with diagonal perspective
    const bgGrad = ctx.createLinearGradient(0, 0, 400, 400);
    bgGrad.addColorStop(0, variant === 'sunlight_dark' ? '#8a623a' : '#c49a68');
    bgGrad.addColorStop(1, variant === 'sunlight_dark' ? '#5a3d1e' : '#8e6336');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 400);

    // Diagonal planks
    for (let p = -200; p < 600; p += 45) {
      ctx.strokeStyle = 'rgba(50, 30, 10, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p + 300, 400);
      ctx.stroke();
    }

    // Window shadow beams
    ctx.fillStyle = 'rgba(255, 250, 220, 0.35)';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(380, 0);
    ctx.lineTo(400, 400);
    ctx.lineTo(240, 400);
    ctx.fill();

    // Architectural shadow line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(260, 100);
    ctx.lineTo(40, 400);
    ctx.stroke();

    // Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('3ddd', 280, 360);
  } else if (variant === 'honey_window_parquet') {
    // Warm rich honey wood
    ctx.fillStyle = '#9b6c3b';
    ctx.fillRect(0, 0, 400, 400);

    for (let p = 0; p < 400; p += 40) {
      ctx.strokeStyle = 'rgba(60, 35, 15, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 400);
      ctx.stroke();
    }

    // Soft window light reflection
    const light = ctx.createRadialGradient(200, 150, 20, 200, 150, 280);
    light.addColorStop(0, 'rgba(255, 240, 200, 0.4)');
    light.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 400, 400);
  } else if (variant === 'oak_boulder') {
    // Grey-beige natural oak boards
    ctx.fillStyle = '#9b9487';
    ctx.fillRect(0, 0, 400, 400);

    for (let p = 0; p < 400; p += 48) {
      ctx.strokeStyle = '#686054';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(400, p);
      ctx.stroke();
    }

    // Wood fiber noise
    for (let i = 0; i < 120; i++) {
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      const y = Math.random() * 400;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(400, y);
      ctx.stroke();
    }

    // Banner: OAK BOULDER 2048 X 299PX
    ctx.fillStyle = 'rgba(245, 245, 245, 0.9)';
    ctx.fillRect(20, 290, 360, 38);
    ctx.fillStyle = '#222222';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('OAK BOULDER', 100, 314);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('2048 X 299PX', 230, 314);
  } else if (variant === 'oak_chambord') {
    // Warm golden oak boards with banner
    ctx.fillStyle = '#a68257';
    ctx.fillRect(0, 0, 400, 400);

    for (let p = 0; p < 400; p += 52) {
      ctx.strokeStyle = '#6f4f2c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(400, p);
      ctx.stroke();
    }

    // Banner: OAK CHAMBORD
    ctx.fillStyle = 'rgba(245, 245, 245, 0.9)';
    ctx.fillRect(20, 290, 360, 38);
    ctx.fillStyle = '#222222';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('OAK CHAMBORD', 90, 314);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('3ddd', 280, 314);
  } else if (variant === 'multi_slat' || variant === 'multi_shades') {
    // 4 vertical slats with differing tones
    const colors = variant === 'multi_slat'
      ? ['#d4b28c', '#ba936b', '#8f6a43', '#583f27']
      : ['#ded9ce', '#c9ab85', '#b08b5e', '#6d5338'];

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(i * 100, 0, 100, 400);

      // Slat divide line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(i * 100, 0);
      ctx.lineTo(i * 100, 400);
      ctx.stroke();

      // Vertical wood fibers
      for (let f = 0; f < 30; f++) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        const x = i * 100 + Math.random() * 100;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 400);
        ctx.stroke();
      }
    }

    // Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(variant === 'multi_slat' ? '3ddd' : '3dsky', 270, 360);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}


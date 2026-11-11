import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MaterialProperties, TextureMapSlot, PreviewMapMode } from '../types/material';
import { RotateCw, RefreshCw, Box, Circle, Cylinder, Layers, Eye, Image as ImageIcon, ZoomIn } from 'lucide-react';

interface ViewportPreviewProps {
  properties: MaterialProperties;
  slots: Record<string, TextureMapSlot>;
  activeSelectedChannel?: string;
  onSelectChannel?: (chan: string) => void;
}

export const ViewportPreview: React.FC<ViewportPreviewProps> = ({
  properties,
  slots,
  activeSelectedChannel,
  onSelectChannel,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [geoShape, setGeoShape] = useState<'sphere' | 'box' | 'cylinder'>('sphere');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [previewMode, setPreviewMode] = useState<PreviewMapMode>('combined');
  const [tiling, setTiling] = useState<number>(2); // 2x default for realistic PBR scale

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1117);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Studio 3-point lighting setup
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 3.0);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.5);
    fillLight.position.set(-4, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 2.2);
    rimLight.position.set(0, -3, -4);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0x283040, 1.2);
    scene.add(ambientLight);

    // Initial Mesh
    const geometry = new THREE.SphereGeometry(1.25, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(properties.baseColorHex || '#cccccc'),
      roughness: 0.35,
      metalness: properties.metalnessMode ? 1.0 : 0.0,
      ior: properties.ior,
      clearcoat: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Mouse drag interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !meshRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      meshRef.current.rotation.y += deltaX * 0.01;
      meshRef.current.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      if (meshRef.current && autoRotate && !isDragging) {
        meshRef.current.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Geometry shape
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.geometry.dispose();

    if (geoShape === 'box') {
      meshRef.current.geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8, 32, 32, 32);
    } else if (geoShape === 'cylinder') {
      meshRef.current.geometry = new THREE.CylinderGeometry(1.0, 1.0, 2.0, 48);
    } else {
      meshRef.current.geometry = new THREE.SphereGeometry(1.25, 64, 64);
    }
  }, [geoShape]);

  // Apply Textures & Mode Changes
  useEffect(() => {
    if (!meshRef.current || !sceneRef.current) return;
    const textureLoader = new THREE.TextureLoader();

    const applyTextureSettings = (tex: THREE.Texture, isColorMap: boolean) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(tiling, tiling);
      tex.colorSpace = isColorMap ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.needsUpdate = true;
    };

    if (previewMode === 'combined') {
      // FULL PBR SHADER
      const pbrMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(properties.baseColorHex || '#ffffff'),
        metalness: properties.metalnessMode ? 1.0 : 0.0,
        ior: properties.ior,
        clearcoat: properties.engine === 'corona' ? 0.12 : 0.06,
        clearcoatRoughness: 0.1,
      });

      // Diffuse
      const diffSlot = slots['diffuse'];
      if (diffSlot?.previewUrl) {
        textureLoader.load(diffSlot.previewUrl, (tex) => {
          applyTextureSettings(tex, true);
          pbrMat.map = tex;
          pbrMat.color.set(0xffffff); // Un-tint base color so uploaded texture appears in authentic colors
          pbrMat.needsUpdate = true;
        });
      }

      // Roughness (Raw or Derived)
      const roughSlot = slots['roughness'];
      if (roughSlot?.previewUrl) {
        textureLoader.load(roughSlot.previewUrl, (tex) => {
          applyTextureSettings(tex, false);
          pbrMat.roughnessMap = tex;
          pbrMat.roughness = 1.0;
          pbrMat.needsUpdate = true;
        });
      } else if (roughSlot?.isDerived) {
        const cc = roughSlot.colorCorrect;
        pbrMat.roughness = THREE.MathUtils.clamp(0.45 + (cc.contrast * 0.25) + (cc.invert ? 0.2 : -0.2), 0.05, 0.95);
      } else {
        pbrMat.roughness = properties.roughnessMode === 'roughness' ? 0.35 : 0.65;
      }

      // Normal Map
      const normSlot = slots['normal'];
      if (normSlot?.previewUrl) {
        textureLoader.load(normSlot.previewUrl, (tex) => {
          applyTextureSettings(tex, false);
          pbrMat.normalMap = tex;
          pbrMat.normalScale.set(1.2, properties.normalType === 'opengl' ? -1.2 : 1.2);
          pbrMat.needsUpdate = true;
        });
      }

      // Displacement / Bump
      const dispSlot = slots['height'];
      if (dispSlot?.previewUrl) {
        textureLoader.load(dispSlot.previewUrl, (tex) => {
          applyTextureSettings(tex, false);
          pbrMat.bumpMap = tex;
          pbrMat.bumpScale = (properties.displacementAmount || 2.0) * 0.02;
          pbrMat.needsUpdate = true;
        });
      }

      // Metalness Map
      const metalSlot = slots['metalness'];
      if (metalSlot?.previewUrl) {
        textureLoader.load(metalSlot.previewUrl, (tex) => {
          applyTextureSettings(tex, false);
          pbrMat.metalnessMap = tex;
          pbrMat.metalness = 1.0;
          pbrMat.needsUpdate = true;
        });
      }

      // Ambient Occlusion Map
      const aoSlot = slots['ao'];
      if (aoSlot?.previewUrl) {
        textureLoader.load(aoSlot.previewUrl, (tex) => {
          applyTextureSettings(tex, false);
          pbrMat.aoMap = tex;
          pbrMat.aoMapIntensity = 1.0;
          pbrMat.needsUpdate = true;
        });
      }

      meshRef.current.material = pbrMat;
    } else {
      // SINGLE MAP ISOLATED VIEW (Diffuse, Roughness, Normal, Displacement, Metalness)
      const targetSlot = slots[previewMode];
      const singleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      if (targetSlot?.previewUrl) {
        textureLoader.load(targetSlot.previewUrl, (tex) => {
          applyTextureSettings(tex, previewMode === 'diffuse');
          singleMat.map = tex;
          singleMat.color.set(0xffffff);
          singleMat.needsUpdate = true;
        });
      } else {
        singleMat.color = new THREE.Color(
          previewMode === 'metalness' ? (properties.metalnessMode ? 0xffffff : 0x1a1a1a) : 0x555555
        );
      }

      meshRef.current.material = singleMat;
    }
  }, [properties, slots, previewMode, tiling]);

  // Synchronize when parent changes activeSelectedChannel
  useEffect(() => {
    if (activeSelectedChannel) {
      if (['diffuse', 'roughness', 'normal', 'height', 'metalness'].includes(activeSelectedChannel)) {
        setPreviewMode(activeSelectedChannel as PreviewMapMode);
      }
    }
  }, [activeSelectedChannel]);

  const resetRotation = () => {
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
    }
  };

  const channelButtons: { mode: PreviewMapMode; label: string }[] = [
    { mode: 'combined', label: 'PBR (Tam)' },
    { mode: 'diffuse', label: 'Diffuse' },
    { mode: 'roughness', label: 'Roughness' },
    { mode: 'normal', label: 'Normal' },
    { mode: 'height', label: 'Displacement' },
    { mode: 'metalness', label: 'Metal' },
  ];

  const currentPreviewSlot = previewMode === 'combined' ? slots['diffuse'] : slots[previewMode];

  return (
    <div className="relative w-full h-full min-h-[350px] bg-[#0E1015] rounded border border-[#2B313E] overflow-hidden flex flex-col shadow-inner">
      {/* 3ds Max Nitrous Viewport HUD (Top Left) */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 text-[10px] font-mono select-none bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-slate-300">
        <span className="text-amber-400 font-bold hover:text-white cursor-pointer">[ + ]</span>
        <span className="hover:text-amber-300 cursor-pointer text-amber-200/90 font-semibold">[ Perspective ]</span>
        <span className="text-slate-400">·</span>
        <span className="hover:text-white cursor-pointer">[ Standard ]</span>
        <span className="text-slate-400">·</span>
        <span className="hover:text-white cursor-pointer">[ Default Shading ]</span>
      </div>

      {/* 3ds Max ViewCube Simulation (Top Right) */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 select-none pointer-events-auto">
        <div className="w-8 h-8 rounded bg-[#1A1E26]/90 border border-slate-700/80 shadow-md flex flex-col items-center justify-center font-mono text-[8px] font-bold text-amber-300/90 hover:border-amber-400 transition-colors cursor-pointer group">
          <span className="text-[7px] text-slate-400 group-hover:text-white">3ds</span>
          <span>TOP</span>
        </div>
      </div>

      {/* 3ds Max Viewport Coordinate Tripod (Bottom Left) */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2 text-[9px] font-mono select-none bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded border border-white/5 pointer-events-none">
        <span className="text-red-400 font-bold">X: 0.0</span>
        <span className="text-emerald-400 font-bold">Y: 0.0</span>
        <span className="text-cyan-400 font-bold">Z: 0.0</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">Grid: 10.0cm</span>
      </div>

      {/* Top Controls Bar (Mode Selectors & Controls) */}
      <div className="absolute top-8 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1 bg-[#12141A]/95 backdrop-blur-md p-1 rounded border border-[#262C38] pointer-events-auto">
          {channelButtons.map((btn) => {
            const hasTexture = Boolean(slots[btn.mode]?.previewUrl || btn.mode === 'combined');
            return (
              <button
                key={btn.mode}
                onClick={() => setPreviewMode(btn.mode)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors flex items-center gap-1 ${
                  previewMode === btn.mode
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{btn.label}</span>
                {hasTexture && btn.mode !== 'combined' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tiling, Shape & Turntable Controls */}
        <div className="flex items-center gap-1 bg-[#12141A]/95 backdrop-blur-md p-1 rounded border border-[#262C38] pointer-events-auto">
          {/* Tiling Scale */}
          <div className="flex items-center gap-0.5 text-[10px] font-mono text-slate-400 px-1 border-r border-slate-700 mr-0.5">
            <span>Tile:</span>
            {[1, 2, 4].map((t) => (
              <button
                key={t}
                onClick={() => setTiling(t)}
                className={`px-1 rounded ${tiling === t ? 'text-amber-400 font-bold bg-amber-500/10' : 'hover:text-slate-200'}`}
              >
                {t}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setGeoShape('sphere')}
            title="Küre"
            className={`p-1 rounded transition-colors ${geoShape === 'sphere' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Circle className="w-3 h-3" />
          </button>
          <button
            onClick={() => setGeoShape('box')}
            title="Küp"
            className={`p-1 rounded transition-colors ${geoShape === 'box' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Box className="w-3 h-3" />
          </button>
          <button
            onClick={() => setGeoShape('cylinder')}
            title="Silindir"
            className={`p-1 rounded transition-colors ${geoShape === 'cylinder' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Cylinder className="w-3 h-3" />
          </button>
          <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "Turntable Durdur" : "Turntable Başlat"}
            className={`p-1 rounded transition-colors ${autoRotate ? 'text-amber-400' : 'text-slate-500'}`}
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button
            onClick={resetRotation}
            title="Sıfırla"
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Floating 2D Exact Texture Thumbnail Inspector (Bottom Right) */}
      {currentPreviewSlot?.previewUrl && (
        <div className="absolute bottom-2.5 right-2.5 z-20 bg-[#12141A]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#2B313E] shadow-xl flex flex-col gap-1 pointer-events-auto max-w-[130px]">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span className="truncate">{currentPreviewSlot.channel.toUpperCase()}</span>
            <span className="text-emerald-400">Canlı</span>
          </div>
          <div className="w-24 h-24 rounded border border-slate-700 overflow-hidden bg-black/60 relative group">
            <img
              src={currentPreviewSlot.previewUrl}
              alt={currentPreviewSlot.channel}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-white font-mono">
              2D Dokusu
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info Bar */}
      <div className="absolute bottom-2 left-2.5 z-10 flex items-center gap-2 text-[10px] font-mono text-slate-400 pointer-events-none">
        <div className="bg-[#12141A]/85 backdrop-blur px-2 py-0.5 rounded border border-[#262C38] flex items-center gap-2 pointer-events-auto">
          <span className="text-amber-300 font-bold uppercase">{previewMode}</span>
          <span className="text-slate-600">·</span>
          <span>{currentPreviewSlot?.fileName || properties.name}</span>
          <span className="text-slate-600">·</span>
          <span>Tile: {tiling}x</span>
        </div>
      </div>
    </div>
  );
};

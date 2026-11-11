import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MaterialProperties,
  TextureMapSlot,
  RenderEngine,
} from '../types/material';
import { generateMaxScript } from '../utils/maxScriptGenerator';
import {
  createProceduralWoodTexture,
  createProceduralMarbleTexture,
  createProceduralMetalTexture,
} from '../utils/textureGenerator';
import {
  Folder,
  FolderOpen,
  FolderCheck,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Search,
  Maximize2,
  Minimize2,
  Play,
  Sliders,
  Copy,
  Check,
  Download,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  HardDrive,
  CheckCircle2,
  Trash2,
  FileText,
  UploadCloud,
  Layers,
} from 'lucide-react';

export interface SavedLibraryMaterial {
  id: string;
  name: string;
  fileName: string;
  category: string;
  engine: RenderEngine;
  folderPath: string;
  thumbnailUrl?: string;
  properties: MaterialProperties;
  slots: Record<string, TextureMapSlot>;
  notes?: string;
  faces?: number;
  vertices?: number;
  bitmapsCount?: number;
  sizeMb?: number;
}

export interface DynamicTreeNode {
  name: string;
  path: string;
  children?: DynamicTreeNode[];
}

const STORAGE_ASSETS_KEY = '3dsmax_pm_user_assets_v2';
const STORAGE_PATH_KEY = '3dsmax_pm_user_path_v2';
const STORAGE_FOLDERS_KEY = '3dsmax_pm_user_folders_v2';

// Helper to build a tree structure from path string
function buildTreeFromPath(fullPath: string, subfolderNames: string[] = []): DynamicTreeNode[] {
  if (!fullPath || !fullPath.trim()) return [];

  const segments = fullPath.split(/[\\]/).filter(Boolean);
  if (segments.length === 0) return [];

  let root: DynamicTreeNode | null = null;
  let current: DynamicTreeNode | null = null;

  for (let idx = 0; idx < segments.length; idx++) {
    const seg = segments[idx];
    const currentSubPath = segments.slice(0, idx + 1).join('\\');
    const node: DynamicTreeNode = {
      name: seg,
      path: currentSubPath,
      children: [],
    };

    if (!root) {
      root = node;
      current = node;
    } else if (current) {
      if (!current.children) current.children = [];
      current.children.push(node);
      current = node;
    }
  }

  const leaf: DynamicTreeNode | null = current;
  if (leaf && subfolderNames.length > 0) {
    if (!leaf.children) leaf.children = [];
    subfolderNames.forEach((subName) => {
      leaf.children?.push({
        name: subName,
        path: `${leaf.path}\\${subName}`,
      });
    });
  }

  return root ? [root] : [];
}

interface MaterialLibraryManagerProps {
  currentProperties: MaterialProperties;
  currentSlots: Record<string, TextureMapSlot>;
  onLoadMaterialIntoStudio: (mat: SavedLibraryMaterial) => void;
  onQuickApplyToScene?: (mat: SavedLibraryMaterial) => void;
}

export const MaterialLibraryManager: React.FC<MaterialLibraryManagerProps> = ({
  currentProperties,
  currentSlots,
  onLoadMaterialIntoStudio,
}) => {
  // 1. Initial Path State (Starts empty or from user's saved session)
  const [activePath, setActivePath] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_PATH_KEY) || '';
    } catch {
      return '';
    }
  });

  const [inputFolderPath, setInputFolderPath] = useState<string>('');
  const [activeVerticalTab, setActiveVerticalTab] = useState<'Models' | 'Materials' | 'Textures' | 'IES'>('Materials');
  const [activeMainTab, setActiveMainTab] = useState<'Explorer' | 'Asset Tracking'>('Explorer');
  const [activeBottomTab, setActiveBottomTab] = useState<'Place Options' | 'Settings'>('Settings');

  // 2. Tree Nodes (Empty by default until user assigns a path)
  const [treeNodes, setTreeNodes] = useState<DynamicTreeNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FOLDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // 3. Material Assets (Empty by default until user assigns a path or scans files)
  const [assets, setAssets] = useState<SavedLibraryMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ASSETS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [gridColumns, setGridColumns] = useState<number>(4);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Merge options
  const [excludeShapes, setExcludeShapes] = useState(true);
  const [excludeHidden, setExcludeHidden] = useState(true);
  const [excludeCameras, setExcludeCameras] = useState(true);
  const [mergeOption, setMergeOption] = useState<'scene' | 'merged' | 'auto_rename'>('auto_rename');
  const [useProxy, setUseProxy] = useState(false);
  const [useExistingProxy, setUseExistingProxy] = useState(true);

  // Hidden folder file input
  const directoryInputRef = useRef<HTMLInputElement | null>(null);

  // Persist user assets and paths
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ASSETS_KEY, JSON.stringify(assets));
    } catch {
      // ignore
    }
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(treeNodes));
    } catch {
      // ignore
    }
  }, [treeNodes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PATH_KEY, activePath);
    } catch {
      // ignore
    }
  }, [activePath]);

  // Selected asset
  const selectedAsset = useMemo(() => {
    if (!selectedAssetId && assets.length > 0) return assets[0];
    return assets.find((a) => a.id === selectedAssetId) || null;
  }, [assets, selectedAssetId]);

  // Filtered assets by search and path
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        asset.fileName.toLowerCase().includes(filterQuery.toLowerCase()) ||
        asset.folderPath.toLowerCase().includes(filterQuery.toLowerCase());
      return matchesSearch;
    });
  }, [assets, filterQuery]);

  // Breadcrumbs parsing
  const breadcrumbSegments = useMemo(() => {
    if (!activePath) return [];
    return activePath.split('\\').filter(Boolean);
  }, [activePath]);

  const handleSelectCrumb = (index: number) => {
    const newPath = breadcrumbSegments.slice(0, index + 1).join('\\');
    setActivePath(newPath);
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // 1. User assigns a folder path directly by typing or pasting
  const handleAssignPath = (pathString?: string) => {
    const targetPath = (pathString || inputFolderPath).trim();
    if (!targetPath) return;

    setActivePath(targetPath);
    const newTree = buildTreeFromPath(targetPath);
    setTreeNodes(newTree);

    // Expand all folders in this path
    const expanded: Record<string, boolean> = {};
    const segs = targetPath.split('\\').filter(Boolean);
    segs.forEach((_, i) => {
      const sub = segs.slice(0, i + 1).join('\\');
      expanded[sub] = true;
    });
    setExpandedFolders(expanded);

    setToastMessage(`'${targetPath}' dosya yolu başarıyla atandı ve dizin ağacı oluşturuldu.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 2. User selects a folder from computer via directory picker
  const handleLocalDirectoryScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Detect folder path from first file
    const sample = files[0];
    let detectedFolder = activePath || 'D:\\model-02\\materials\\wood-parquet';
    const subfolderSet = new Set<string>();

    if (sample.webkitRelativePath) {
      const parts = sample.webkitRelativePath.split('/');
      if (parts.length > 1) {
        parts.pop(); // remove file name
        const relativeFolder = parts.join('\\');
        detectedFolder = activePath ? `${activePath}\\${relativeFolder}` : `D:\\Materials\\${relativeFolder}`;
      }
    }

    // Extract subfolders
    Array.from(files).forEach((f) => {
      if (f.webkitRelativePath) {
        const parts = f.webkitRelativePath.split('/');
        if (parts.length > 2) {
          subfolderSet.add(parts[1]);
        }
      }
    });

    setActivePath(detectedFolder);
    const newTree = buildTreeFromPath(detectedFolder, Array.from(subfolderSet));
    setTreeNodes(newTree);

    // Parse image files into material cards
    const fileList = Array.from(files);
    const newItems: SavedLibraryMaterial[] = [];

    fileList.forEach((file, idx) => {
      if (file.name.match(/\.(jpg|jpeg|png|tif|tiff|exr|tga|bmp)$/i)) {
        const objUrl = URL.createObjectURL(file);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        const maxFileName = `${String(idx + 1).padStart(2, '0')}.max`;

        newItems.push({
          id: `asset-${Date.now()}-${idx}`,
          name: `Mtl_${nameWithoutExt}`,
          fileName: maxFileName,
          category: 'wood-parquet',
          engine: 'corona',
          folderPath: detectedFolder,
          thumbnailUrl: objUrl,
          notes: `${detectedFolder} dizininden atanan kaplama.`,
          faces: 12450,
          vertices: 8200,
          bitmapsCount: 3,
          sizeMb: 21.4,
          properties: {
            name: `Mtl_${nameWithoutExt}`,
            category: 'Wood',
            engine: 'corona',
            editorTarget: 'both_rollout',
            compactSlotIndex: (idx % 24) + 1,
            roughnessMode: 'roughness',
            normalType: 'directx',
            ior: 1.52,
            metalnessMode: false,
            baseColorHex: '#b8895b',
            displacementAmount: 2.0,
            applyToSelected: true,
            showInViewport: true,
            useCoronaColorCorrectFallback: true,
          },
          slots: {
            diffuse: {
              channel: 'diffuse',
              label: 'Diffuse',
              fileName: file.name,
              filePath: `${detectedFolder}\\${file.name}`,
              previewUrl: objUrl,
              isAssigned: true,
              isDerived: false,
              colorSpace: 'sRGB',
              colorCorrect: { enabled: false, sourceChannel: 'diffuse', invert: false, gamma: 1.0, contrast: 0, saturation: 0, brightness: 0 },
            },
            roughness: {
              channel: 'roughness',
              label: 'Roughness (Auto CC)',
              fileName: 'CC_Roughness (from Diffuse)',
              filePath: '',
              previewUrl: objUrl,
              isAssigned: true,
              isDerived: true,
              colorSpace: 'Linear_RAW',
              colorCorrect: { enabled: true, sourceChannel: 'diffuse', invert: true, gamma: 0.85, contrast: 0.25, saturation: -1.0, brightness: 0 },
            },
          },
        });
      }
    });

    if (newItems.length > 0) {
      setAssets(newItems);
      setSelectedAssetId(newItems[0].id);
      setToastMessage(`${newItems.length} adet materyal '${detectedFolder}' yoluna başarıyla atandı!`);
    } else {
      setToastMessage(`'${detectedFolder}' yolu atandı. Görsel bulunamadı.`);
    }
    setTimeout(() => setToastMessage(null), 4500);
  };

  // 3. User creates a new material in the active folder
  const handleAddNewMaterialToActiveFolder = () => {
    const folder = activePath || 'D:\\model-02\\materials\\wood-parquet';
    const index = assets.length + 1;
    const maxFileName = `${String(index).padStart(2, '0')}.max`;
    const matName = `Mtl_Custom_Asset_${index}`;

    const newMaterial: SavedLibraryMaterial = {
      id: `mat-${Date.now()}`,
      name: matName,
      fileName: maxFileName,
      category: 'wood-parquet',
      engine: 'corona',
      folderPath: folder,
      thumbnailUrl: createProceduralWoodTexture('diffuse'),
      notes: `${folder} dizinine atanmış materyal.`,
      faces: 11000,
      vertices: 7500,
      bitmapsCount: 3,
      sizeMb: 19.8,
      properties: {
        name: matName,
        category: 'Wood',
        engine: 'corona',
        editorTarget: 'both_rollout',
        compactSlotIndex: ((index - 1) % 24) + 1,
        roughnessMode: 'roughness',
        normalType: 'directx',
        ior: 1.52,
        metalnessMode: false,
        baseColorHex: '#b8895b',
        displacementAmount: 2.0,
        applyToSelected: true,
        showInViewport: true,
        useCoronaColorCorrectFallback: true,
      },
      slots: {
        diffuse: {
          channel: 'diffuse',
          label: 'Diffuse',
          fileName: `Parquet_${index}_diffuse.jpg`,
          filePath: `${folder}\\Parquet_${index}_diffuse.jpg`,
          previewUrl: createProceduralWoodTexture('diffuse'),
          isAssigned: true,
          isDerived: false,
          colorSpace: 'sRGB',
          colorCorrect: { enabled: false, sourceChannel: 'diffuse', invert: false, gamma: 1.0, contrast: 0, saturation: 0, brightness: 0 },
        },
        roughness: {
          channel: 'roughness',
          label: 'Roughness (Auto CC)',
          fileName: 'CC_Roughness (from Diffuse)',
          filePath: '',
          isAssigned: true,
          isDerived: true,
          colorSpace: 'Linear_RAW',
          colorCorrect: { enabled: true, sourceChannel: 'diffuse', invert: true, gamma: 0.85, contrast: 0.25, saturation: -1.0, brightness: 0 },
        },
      },
    };

    setAssets((prev) => [newMaterial, ...prev]);
    setSelectedAssetId(newMaterial.id);
    setToastMessage(`'${matName}' materyali '${folder}' yoluna eklendi!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 4. Empty out all assigned folders and assets completely
  const handleClearAll = () => {
    if (confirm('Tüm dosya yollarını ve atanan materyalleri temizlemek istediğinize emin misiniz?')) {
      setAssets([]);
      setTreeNodes([]);
      setActivePath('');
      setInputFolderPath('');
      setSelectedAssetId(null);
      localStorage.removeItem(STORAGE_ASSETS_KEY);
      localStorage.removeItem(STORAGE_PATH_KEY);
      localStorage.removeItem(STORAGE_FOLDERS_KEY);
      setToastMessage('Tüm alanlar boşaltıldı. Artık yeni dosya yolunuzu seçebilirsiniz.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // 1-Click Apply to 3ds Max Scene via MaxScript
  const handleApplyToScene = (asset: SavedLibraryMaterial) => {
    const script = generateMaxScript(asset.properties, asset.slots, {
      includeRolloutUI: false,
      applyToSelection: true,
      viewportDisplay: true,
    });

    navigator.clipboard.writeText(script).then(() => {
      setCopiedId(asset.id);
      setToastMessage(`'${asset.fileName}' (${asset.name}) sahneye aktarma scripti kopyalandı! 3ds Max'e atandı.`);
      setTimeout(() => {
        setCopiedId(null);
        setToastMessage(null);
      }, 4500);
    });
  };

  // Render tree node recursive
  const renderTreeNode = (node: DynamicTreeNode, depth = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = Boolean(expandedFolders[node.path]);
    const isSelected = activePath === node.path;

    return (
      <div key={node.path} className="flex flex-col">
        <div
          onClick={() => {
            setActivePath(node.path);
            if (hasChildren) toggleFolder(node.path);
          }}
          className={`flex items-center gap-1 px-1.5 py-0.5 cursor-pointer rounded-[1px] hover:bg-[#2b2f3a] transition-colors ${
            isSelected ? 'bg-[#185abd] text-white font-bold shadow-sm' : 'text-slate-300'
          }`}
          style={{ paddingLeft: `${depth * 10 + 4}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-2.5 h-2.5 text-slate-300 shrink-0" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5 text-slate-300 shrink-0" />
            )
          ) : (
            <span className="w-2.5 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-3 h-3 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-3 h-3 text-amber-400 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col space-y-0.5 mt-0.5">
            {node.children?.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-[#1c1e24] border border-[#14161b] rounded-[2px] flex flex-col font-sans select-none text-[#cfd3dc] shadow-2xl overflow-hidden transition-all duration-200 ${
        isMaximized
          ? 'fixed inset-3 z-50 bg-[#1c1e24]/98 backdrop-blur shadow-[0px_0px_50px_rgba(0,0,0,0.9)] border-2 border-amber-500'
          : 'w-full min-h-[580px] max-h-[760px]'
      }`}
    >
      {/* Hidden Folder Picker Input */}
      <input
        type="file"
        ref={directoryInputRef}
        onChange={handleLocalDirectoryScan}
        multiple
        className="hidden"
        // @ts-expect-error webkitdirectory is standard browser folder picking
        webkitdirectory="true"
        directory="true"
      />

      {/* =========================================================================
          1. 3DS MAX APPLICATION TITLE BAR (K-STUDIO PROJECT MANAGER 3.22.00)
         ========================================================================= */}
      <div className="bg-gradient-to-r from-[#2c2f38] via-[#333742] to-[#2c2f38] border-b border-[#181a1f] px-2.5 py-1 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3 text-[11px] font-sans">
          <span className="hover:text-white cursor-pointer transition-colors">File</span>
          <span className="hover:text-white cursor-pointer transition-colors">Tools</span>
          <span className="hover:text-white cursor-pointer transition-colors">Customize</span>
          <span className="hover:text-white cursor-pointer transition-colors">Help</span>
        </div>

        <div className="flex items-center gap-1.5 font-bold tracking-widest text-slate-200 text-[11px]">
          <div className="w-3.5 h-3.5 bg-amber-500 text-black rounded-[1px] flex items-center justify-center font-black text-[9px]">
            PM
          </div>
          <span className="text-white font-extrabold uppercase">Project Manager</span>
          <span className="text-[9px] text-slate-400 font-mono font-normal">3.22.00 · KSTUDIO</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <button
            onClick={handleClearAll}
            title="Tüm alanları boşalt (Temizle)"
            className="hover:text-red-400 text-slate-400 text-[10px] flex items-center gap-1 px-1 py-0.5 rounded transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
            <span>Boşalt</span>
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="hover:text-amber-400 text-slate-400 p-0.5 rounded transition-colors"
            title={isMaximized ? 'Küçült' : 'Tam Ekran Genişlet'}
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <span className="text-[10px] cursor-pointer hover:text-white">✕</span>
        </div>
      </div>

      {/* =========================================================================
          2. EXPLORER / ASSET TRACKING TOP NAVIGATION TABS
         ========================================================================= */}
      <div className="bg-[#242730] border-b border-[#191b22] px-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center">
          <button
            onClick={() => setActiveMainTab('Explorer')}
            className={`px-6 py-1.5 font-bold tracking-wider transition-colors border-r border-[#191b22] ${
              activeMainTab === 'Explorer'
                ? 'bg-[#1c1e24] text-slate-100 border-t-2 border-t-amber-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#20232b]'
            }`}
          >
            Explorer
          </button>
          <button
            onClick={() => setActiveMainTab('Asset Tracking')}
            className={`px-6 py-1.5 font-bold tracking-wider transition-colors border-r border-[#191b22] ${
              activeMainTab === 'Asset Tracking'
                ? 'bg-[#1c1e24] text-slate-100 border-t-2 border-t-amber-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#20232b]'
            }`}
          >
            Asset Tracking
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
          <span className="text-amber-400 font-bold">{filteredAssets.length} Assets</span>
          <span>·</span>
          <span>{activePath ? activePath.split('\\').pop() : 'Dizin Seçilmedi'}</span>
        </div>
      </div>

      {/* =========================================================================
          3. ADDRESS BREADCRUMB BAR & TOOLBAR STRIP
         ========================================================================= */}
      <div className="bg-[#22252d] border-b border-[#181a20] px-2 py-1 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 bg-[#001e36] text-[#31a8ff] border border-[#003865] rounded-[2px] flex items-center justify-center font-bold text-[10px] cursor-pointer" title="Photoshop Bridge">
            Ps
          </div>
          <button className="w-5 h-5 bg-[#2c3039] hover:bg-[#383e4a] text-slate-300 rounded-[2px] flex items-center justify-center text-[10px] border border-[#1b1d24]">
            &lt;
          </button>
          <button className="w-5 h-5 bg-[#2c3039] hover:bg-[#383e4a] text-slate-300 rounded-[2px] flex items-center justify-center text-[10px] border border-[#1b1d24]">
            &gt;
          </button>
          <button
            onClick={() => setToastMessage('Yenilendi.')}
            className="w-5 h-5 bg-[#2c3039] hover:bg-[#383e4a] text-slate-300 rounded-[2px] flex items-center justify-center text-[10px] border border-[#1b1d24]"
            title="Yenile"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Windows Breadcrumb Path or Prompt to Assign */}
        <div className="flex-1 flex items-center bg-[#17191f] border border-[#303542] rounded-[2px] px-2 py-0.5 text-[11px] font-mono overflow-x-auto text-slate-300">
          {breadcrumbSegments.length > 0 ? (
            breadcrumbSegments.map((seg, idx) => (
              <React.Fragment key={`${seg}-${idx}`}>
                <button
                  onClick={() => handleSelectCrumb(idx)}
                  className={`hover:text-amber-400 hover:underline px-1 py-0.2 rounded transition-colors ${
                    idx === breadcrumbSegments.length - 1 ? 'text-amber-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  {seg}
                </button>
                {idx < breadcrumbSegments.length - 1 && (
                  <span className="text-slate-600 px-0.5">▶</span>
                )}
              </React.Fragment>
            ))
          ) : (
            <span className="text-slate-500 italic text-[10.5px]">
              Henüz dosya yolu seçilmedi... (Klasör Seç butonuna basarak dizininizi atayın)
            </span>
          )}
          {breadcrumbSegments.length > 0 && <span className="text-slate-600 px-0.5">▶</span>}
        </div>

        {/* Right Search Filter & Zoom */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-24 sm:w-32 bg-[#17191f] border border-[#303542] rounded-[2px] pl-2 pr-5 py-0.5 text-[10.5px] text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
            />
            <Search className="w-3 h-3 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-0.5 bg-[#17191f] p-0.5 border border-[#2a2f3a] rounded-[2px]">
            <button
              onClick={() => setGridColumns(4)}
              className="p-1 text-slate-400 hover:text-amber-400"
              title="Grid View"
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
            <button
              onClick={() => setGridColumns(2)}
              className="p-1 text-slate-400 hover:text-amber-400"
              title="Large View"
            >
              <List className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {toastMessage && (
        <div className="bg-emerald-950/95 border-b border-emerald-500 text-emerald-200 text-xs px-3 py-1.5 flex items-center justify-between shadow-lg animate-fadeIn z-30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-[11px]">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          4. MAIN WORKSPACE: VERTICAL TABS + FOLDER TREE + MATERIAL GALLERY
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* FAR LEFT: ROTATED VERTICAL CATEGORY TABS */}
        <div className="w-7 bg-[#171920] border-r border-[#13151a] flex flex-col items-center py-3 gap-8 text-[10px] font-bold tracking-wider text-slate-400 shrink-0">
          {(['Models', 'Materials', 'Textures', 'IES'] as const).map((tab) => {
            const isActive = activeVerticalTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveVerticalTab(tab)}
                className={`transform -rotate-90 whitespace-nowrap px-2 py-0.5 rounded-[1px] transition-all cursor-pointer ${
                  isActive
                    ? 'text-amber-400 font-extrabold bg-[#242730] shadow border-b border-amber-500'
                    : 'hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* LEFT FOLDER TREE EXPLORER PANEL (TARGET SELECTOR 1) */}
        <div className="w-48 sm:w-56 bg-[#1e2027] border-r border-[#15171d] flex flex-col shrink-0 overflow-hidden text-[11px]">
          {/* Tree Toolbar */}
          <div className="bg-[#262932] px-2 py-1 border-b border-[#181a20] flex items-center justify-between text-slate-400">
            <span className="font-bold text-[10px] uppercase text-slate-300">Folders</span>
            <button
              onClick={() => directoryInputRef.current?.click()}
              className="text-[10px] text-amber-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
              title="Bilgisayarından Klasör Seç / Tara"
            >
              <FolderCheck className="w-3 h-3 text-cyan-400" />
              <span>Klasör Seç</span>
            </button>
          </div>

          {/* FOLDER TREE ITEMS (CSS Selector 1) */}
          <div className="flex-1 overflow-y-auto p-1 font-mono text-[10.5px] leading-tight space-y-0.5">
            {treeNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 text-center text-slate-500 gap-2 border border-dashed border-[#2b303c] rounded-[2px] m-1 bg-[#16181e]/60 min-h-[140px]">
                <Folder className="w-6 h-6 text-slate-600 mb-0.5" />
                <span className="text-slate-300 font-bold text-[10.5px]">Dizin Ağacı Boş</span>
                <span className="text-[9.5px] text-slate-500 leading-tight">
                  Dosya yolu seçtiğinizde klasörler burada listelenecektir.
                </span>
                <button
                  onClick={() => directoryInputRef.current?.click()}
                  className="mt-1 px-2 py-1 bg-[#282d38] hover:bg-[#343b48] text-amber-400 border border-[#1b1e25] rounded-[2px] text-[10px] font-semibold flex items-center gap-1 shadow-sm"
                >
                  <FolderCheck className="w-3 h-3 text-cyan-400" />
                  <span>Klasör Seç</span>
                </button>
              </div>
            ) : (
              treeNodes.map((node) => renderTreeNode(node))
            )}
          </div>

          {/* Quick Path Input Bar at bottom of Tree */}
          <div className="p-1.5 bg-[#171920] border-t border-[#13151b] flex flex-col gap-1 text-[10px]">
            <span className="text-slate-400 font-mono">Dizin Yolu Tanımla:</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="D:\materials\wood..."
                value={inputFolderPath}
                onChange={(e) => setInputFolderPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAssignPath();
                }}
                className="w-full bg-[#121418] border border-[#2c3240] rounded-[2px] px-1.5 py-0.5 text-amber-300 font-mono text-[10px] outline-none"
              />
              <button
                onClick={() => handleAssignPath()}
                className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[9px] rounded-[1px] shrink-0"
                title="Bu yolu ağaca ata"
              >
                Ata
              </button>
            </div>
          </div>
        </div>

        {/* CENTER: ASSET THUMBNAIL GALLERY GRID (TARGET SELECTOR 2) */}
        <div className="flex-1 bg-[#181a20] p-2 overflow-y-auto flex flex-col gap-2">
          {filteredAssets.length === 0 ? (
            /* EMPTY STATE: PROMINENT FOLDER SELECTOR & PATH ASSIGNMENT */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md w-full border-2 border-dashed border-[#2c313d] hover:border-amber-500/60 rounded-[4px] p-6 flex flex-col items-center gap-3 bg-[#15171d] shadow-inner transition-colors">
                <div className="w-12 h-12 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6" />
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                    Dosya Yolu Seçin / Klasör Atayın
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Buraya bilgisayarınızdan bir klasör seçtiğinizde veya bir dosya yolu girdiğinizde, materyal kartları otomatik atanıp listelenecektir.
                  </div>
                </div>

                {/* Direct Path Input Form */}
                <div className="w-full flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    placeholder="Örn: D:\model-02\materials\wood-parquet"
                    value={inputFolderPath}
                    onChange={(e) => setInputFolderPath(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAssignPath();
                    }}
                    className="flex-1 bg-[#1c1f27] border border-[#373d4a] focus:border-amber-500 rounded-[2px] px-2.5 py-1 text-xs text-amber-300 font-mono outline-none"
                  />
                  <button
                    onClick={() => handleAssignPath()}
                    className="px-3 py-1 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-[2px] shadow flex items-center gap-1 shrink-0"
                  >
                    <span>Yolu Ata</span>
                  </button>
                </div>

                {/* Big Browse Folder Button */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">veya</span>
                  <button
                    onClick={() => directoryInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-[#282d38] hover:bg-[#343b48] text-slate-100 border border-[#202227] rounded-[2px] text-xs font-bold flex items-center gap-1.5 shadow-md active:translate-y-0.5 transition-all"
                  >
                    <FolderCheck className="w-4 h-4 text-cyan-400" />
                    <span>📁 Bilgisayardan Klasör Seç (Browse...)</span>
                  </button>
                </div>

                {/* Optional test sample generator */}
                {activePath && (
                  <div className="pt-2 border-t border-[#242833] w-full flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-mono truncate max-w-[240px]">
                      Aktif Yol: {activePath}
                    </span>
                    <button
                      onClick={handleAddNewMaterialToActiveFolder}
                      className="text-amber-400 hover:text-white font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Bu Klasöre Materyal Ekle</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* POPULATED GALLERY GRID WITH MATERIAL CARDS */
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] px-1 border-b border-[#242730] pb-1">
                <span className="font-bold text-slate-300 font-mono">
                  {activePath || 'Atanan Dizin'} ({filteredAssets.length} Materyal)
                </span>
                <button
                  onClick={handleAddNewMaterialToActiveFolder}
                  className="px-2 py-0.5 bg-[#262932] hover:bg-[#323642] text-amber-400 border border-[#1b1e25] rounded-[2px] text-[10px] font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Yeni Materyal</span>
                </button>
              </div>

              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                }}
              >
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAssetId === asset.id;
                  const isCopied = copiedId === asset.id;

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      onDoubleClick={() => handleApplyToScene(asset)}
                      className={`bg-[#20232b] rounded-[2px] border overflow-hidden flex flex-col group relative cursor-pointer shadow-md transition-all ${
                        isSelected
                          ? 'border-[#2d7df8] ring-1 ring-[#2d7df8] shadow-[0px_0px_10px_rgba(45,125,248,0.4)]'
                          : 'border-[#2c313d] hover:border-[#4d566b]'
                      }`}
                    >
                      <div className="w-full aspect-square bg-[#101216] relative overflow-hidden flex items-center justify-center">
                        {asset.thumbnailUrl ? (
                          <img
                            src={asset.thumbnailUrl}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: asset.properties.baseColorHex || '#777' }}
                          />
                        )}

                        {/* Blue 3ds Max Badge [3] */}
                        <div className="absolute bottom-1.5 left-1.5 w-4 h-4 bg-[#0a6ebd] text-white font-bold text-[9px] rounded-[1px] flex items-center justify-center shadow-md font-mono border border-black/40">
                          3
                        </div>

                        {/* Engine Badge */}
                        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                          <span className="text-[8px] font-mono px-1 py-0.2 bg-black/85 text-amber-300 rounded-[1px] border border-black/50 font-bold">
                            {asset.engine === 'corona' ? 'CRN' : 'VRAY'}
                          </span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyToScene(asset);
                            }}
                            className={`w-full py-1 text-[10px] font-bold rounded-[2px] flex items-center justify-center gap-1 shadow-md transition-all ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black'
                            }`}
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>{isCopied ? 'Kopyalandı!' : '✦ Sahneye At (.ms)'}</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadMaterialIntoStudio(asset);
                            }}
                            className="w-full py-0.5 bg-[#2a2f3a] hover:bg-[#394050] text-slate-200 text-[9px] rounded-[2px] flex items-center justify-center gap-1 border border-[#1e222a]"
                          >
                            <Sliders className="w-2.5 h-2.5 text-amber-400" />
                            <span>Stüdyoda Aç</span>
                          </button>
                        </div>
                      </div>

                      {/* File Name Bar */}
                      <div className="bg-[#171920] border-t border-[#262b36] px-1.5 py-0.5 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-300 truncate font-semibold" title={asset.fileName}>
                          {asset.fileName}
                        </span>
                        <span className="text-[9px] text-slate-500">.max</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FAR RIGHT: VERTICAL GALLERY TAB */}
        <div className="w-5 bg-[#171920] border-l border-[#13151a] flex flex-col items-center py-4 text-[9px] font-bold text-slate-500 shrink-0">
          <span className="transform -rotate-90 whitespace-nowrap">Gallery =</span>
        </div>
      </div>

      {/* =========================================================================
          5. BOTTOM DOCK: SETTINGS & PLACE OPTIONS
         ========================================================================= */}
      <div className="bg-[#1a1c22] border-t border-[#13151b] flex flex-col text-[10.5px]">
        <div className="flex items-center bg-[#20232b] px-2 border-b border-[#13151a] text-[10px]">
          <button
            onClick={() => setActiveBottomTab('Place Options')}
            className={`px-3 py-0.5 font-bold transition-colors ${
              activeBottomTab === 'Place Options'
                ? 'text-amber-400 bg-[#1a1c22] border-t border-amber-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Place Options
          </button>
          <button
            onClick={() => setActiveBottomTab('Settings')}
            className={`px-3 py-0.5 font-bold transition-colors ${
              activeBottomTab === 'Settings'
                ? 'text-amber-400 bg-[#1a1c22] border-t border-amber-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Settings
          </button>
        </div>

        <div className="p-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-[10px]">
          <div className="border border-[#282d38] p-1.5 rounded-[2px] bg-[#17191f] flex flex-col gap-1">
            <span className="text-slate-400 font-bold border-b border-[#242730] pb-0.5">Exclude:</span>
            <div className="flex flex-col gap-0.5 text-slate-300">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeShapes}
                  onChange={(e) => setExcludeShapes(e.target.checked)}
                  className="accent-amber-500 rounded-[1px] w-3 h-3"
                />
                <span>Shapes (not renderable)</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeHidden}
                  onChange={(e) => setExcludeHidden(e.target.checked)}
                  className="accent-amber-500 rounded-[1px] w-3 h-3"
                />
                <span>Hidden&Frozen</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeCameras}
                  onChange={(e) => setExcludeCameras(e.target.checked)}
                  className="accent-amber-500 rounded-[1px] w-3 h-3"
                />
                <span>Cameras</span>
              </label>
            </div>
          </div>

          <div className="border border-[#282d38] p-1.5 rounded-[2px] bg-[#17191f] flex flex-col gap-1">
            <span className="text-slate-400 font-bold border-b border-[#242730] pb-0.5">Model Merge Options:</span>
            <div className="flex flex-col gap-0.5 text-slate-300">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useProxy}
                  onChange={(e) => setUseProxy(e.target.checked)}
                  className="accent-amber-500 rounded-[1px] w-3 h-3"
                />
                <span>Merge as Proxy</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useExistingProxy}
                  onChange={(e) => setUseExistingProxy(e.target.checked)}
                  className="accent-amber-500 rounded-[1px] w-3 h-3"
                />
                <span>Use Existing Proxy-File</span>
              </label>
            </div>
          </div>

          <div className="border border-[#282d38] p-1.5 rounded-[2px] bg-[#17191f] flex flex-col gap-1">
            <span className="text-slate-400 font-bold border-b border-[#242730] pb-0.5">Material Merge Options:</span>
            <div className="flex flex-col gap-0.5 text-slate-300">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="mat_merge"
                  checked={mergeOption === 'scene'}
                  onChange={() => setMergeOption('scene')}
                  className="accent-amber-500"
                />
                <span>Use Scene Material</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="mat_merge"
                  checked={mergeOption === 'merged'}
                  onChange={() => setMergeOption('merged')}
                  className="accent-amber-500"
                />
                <span>Use Merged Material</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-amber-300 font-semibold">
                <input
                  type="radio"
                  name="mat_merge"
                  checked={mergeOption === 'auto_rename'}
                  onChange={() => setMergeOption('auto_rename')}
                  className="accent-amber-500"
                />
                <span>Auto-Rename Merged Material</span>
              </label>
            </div>
          </div>

          <div className="border border-[#282d38] p-1.5 rounded-[2px] bg-[#17191f] flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 font-bold border-b border-[#242730] pb-0.5">
              <span>Seçili Materyal:</span>
              <span className="text-amber-400 font-mono truncate max-w-[120px]">
                {selectedAsset ? selectedAsset.fileName : 'Seçilmedi'}
              </span>
            </div>
            <div className="text-[9.5px] text-slate-400 font-mono truncate" title={selectedAsset?.folderPath || activePath}>
              {selectedAsset ? selectedAsset.folderPath : (activePath || 'Dizin seçilmedi')}
            </div>
            <div className="flex items-center gap-1 mt-auto pt-1">
              <button
                disabled={!selectedAsset}
                onClick={() => selectedAsset && handleApplyToScene(selectedAsset)}
                className="flex-1 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-[2px] text-[10px] flex items-center justify-center gap-1 shadow"
              >
                <Play className="w-2.5 h-2.5 fill-black" />
                <span>Sahneye Ata (.ms)</span>
              </button>
              <button
                disabled={!selectedAsset}
                onClick={() => selectedAsset && onLoadMaterialIntoStudio(selectedAsset)}
                className="px-2 py-1 bg-[#2b303a] hover:bg-[#363c48] disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-[2px] text-[10px] font-semibold border border-[#1e222a]"
                title="Stüdyo Editörüne Al"
              >
                Stüdyoya Al
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#121418] border-t border-[#13151a] px-2.5 py-1 flex items-center justify-between text-[9.5px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>Information:</span>
            <span>3ds Max: 2024/2025</span>
            <span>Renderer: Corona / VRay</span>
            <span>Aktif Yol: <strong className="text-amber-400">{activePath || 'Tanımlanmadı'}</strong></span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span>Items: <strong className="text-amber-400">{filteredAssets.length}</strong></span>
            <span>Selection: {selectedAsset ? selectedAsset.fileName : '0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

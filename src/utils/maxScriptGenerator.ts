import { MaterialProperties, TextureMapSlot } from '../types/material';

export interface ScriptGenerationOptions {
  includeRolloutUI: boolean;
  applyToSelection: boolean;
  viewportDisplay: boolean;
}

export function generateMaxScript(
  props: MaterialProperties,
  slots: Record<string, TextureMapSlot>,
  options: ScriptGenerationOptions = {
    includeRolloutUI: true,
    applyToSelection: true,
    viewportDisplay: true,
  }
): string {
  const isCorona = props.engine === 'corona';
  const cleanMtlName = props.name.replace(/[^a-zA-Z0-9_]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);

  // Escape Windows backslashes for MaxScript verbatim string @""
  const getPath = (slotKey: string) => {
    const s = slots[slotKey];
    if (!s || !s.filePath) return '';
    return s.filePath.replace(/"/g, '');
  };

  const diffPath = getPath('diffuse');
  const roughPath = getPath('roughness');
  const normPath = getPath('normal');
  const dispPath = getPath('height');
  const metPath = getPath('metalness');
  const aoPath = getPath('ao');

  const roughCC = slots['roughness']?.colorCorrect || {
    enabled: true,
    sourceChannel: 'diffuse',
    invert: true,
    gamma: 0.85,
    contrast: 0.25,
    saturation: -1.0,
    brightness: 0.0,
  };

  const dispCC = slots['height']?.colorCorrect || {
    enabled: true,
    sourceChannel: 'diffuse',
    invert: false,
    gamma: 0.95,
    contrast: 0.55,
    saturation: -1.0,
    brightness: -0.05,
  };

  const isRoughDerived = slots['roughness']?.isDerived || (!slots['roughness']?.isAssigned && slots['diffuse']?.isAssigned);
  const isDispDerived = slots['height']?.isDerived || (!slots['height']?.isAssigned && slots['diffuse']?.isAssigned);

  // Reusable Slate SME visual distribution MaxScript function
  const slateDistributionFunctionScript = `
    -- Function to visually distribute nodes in 3ds Max Slate Material Editor (SME)
    fn distributeNodesInSlate smeView mtl =
    (
        if (smeView == undefined or mtl == undefined) do return false
        try (
            -- 1. Main Material Node placed on the right
            local mNode = smeView.createNode mtl [450, 260]

            -- 2. Diffuse (Base color)
            local diffNode = undefined
            if (isProperty mtl #baseTexmap and mtl.baseTexmap != undefined) then diffNode = mtl.baseTexmap
            else if (isProperty mtl #texmap_diffuse and mtl.texmap_diffuse != undefined) then diffNode = mtl.texmap_diffuse
            if (diffNode != undefined) do (
                smeView.createNode diffNode [-200, 60]
            )

            -- 3. Roughness (CoronaColorCorrect or Bitmap)
            local roughNode = undefined
            if (isProperty mtl #roughnessTexmap and mtl.roughnessTexmap != undefined) then roughNode = mtl.roughnessTexmap
            else if (isProperty mtl #texmap_roughness and mtl.texmap_roughness != undefined) then roughNode = mtl.texmap_roughness
            if (roughNode != undefined) do (
                smeView.createNode roughNode [120, 180]
                -- If derived via CoronaColorCorrect, also create the source Bitmap node in the view
                if (isProperty roughNode #texmap and roughNode.texmap != undefined) do (
                    smeView.createNode roughNode.texmap [-200, 180]
                )
            )

            -- 4. Normal Map (CoronaNormal or VRayNormalMap and source bitmap)
            local bumpNode = undefined
            if (isProperty mtl #baseBumpTexmap and mtl.baseBumpTexmap != undefined) then bumpNode = mtl.baseBumpTexmap
            else if (isProperty mtl #texmap_bump and mtl.texmap_bump != undefined) then bumpNode = mtl.texmap_bump
            if (bumpNode != undefined) do (
                smeView.createNode bumpNode [120, 310]
                if (isProperty bumpNode #normalMap and bumpNode.normalMap != undefined) do (
                    smeView.createNode bumpNode.normalMap [-200, 310]
                ) else if (isProperty bumpNode #normal_map and bumpNode.normal_map != undefined) do (
                    smeView.createNode bumpNode.normal_map [-200, 310]
                )
            )

            -- 5. Displacement (CoronaColorCorrect or Bitmap)
            local dispNode = undefined
            if (isProperty mtl #displacementTexmap and mtl.displacementTexmap != undefined) then dispNode = mtl.displacementTexmap
            else if (isProperty mtl #texmap_displacement and mtl.texmap_displacement != undefined) then dispNode = mtl.texmap_displacement
            if (dispNode != undefined) do (
                smeView.createNode dispNode [120, 440]
                if (isProperty dispNode #texmap and dispNode.texmap != undefined) do (
                    smeView.createNode dispNode.texmap [-200, 440]
                )
            )

            -- 6. Metalness
            local metNode = undefined
            if (isProperty mtl #metalnessTexmap and mtl.metalnessTexmap != undefined) then metNode = mtl.metalnessTexmap
            else if (isProperty mtl #texmap_metalness and mtl.texmap_metalness != undefined) then metNode = mtl.texmap_metalness
            if (metNode != undefined) do (
                smeView.createNode metNode [-200, 560]
            )

            -- Auto-Layout and frame all nodes so the artist sees the full distributed tree immediately!
            smeView.autoLayout()
            smeView.frameAll()
        ) catch (
            format "Warning in Slate layout: %\\n" (getCurrentException())
        )
    )
  `;

  if (!options.includeRolloutUI) {
    // DIRECT 1-CLICK EXECUTION SCRIPT WITH FULL SLATE SME DISTRIBUTION
    return `/*
================================================================================
  3ds Max PBR Material Script (Direct Scene Builder + Slate SME Node Tree)
  Material: ${cleanMtlName}
  Engine  : ${isCorona ? 'Corona Renderer (CoronaPhysicalMtl)' : 'Chaos V-Ray (VRayMtl)'}
  Date    : ${dateStr}
================================================================================
*/

(
    undo "Build PBR Material" on
    (
        local newMtl
        ${isCorona ? `
        if (CoronaPhysicalMtl == undefined) do (
            messageBox "Corona Renderer is not active! Please select Corona in Render Setup." title:"Missing Renderer"
            return false
        )
        newMtl = CoronaPhysicalMtl()
        newMtl.name = "${cleanMtlName}"
        newMtl.roughnessMode = ${props.roughnessMode === 'roughness' ? '0' : '1'}
        newMtl.metalnessMode = ${props.metalnessMode ? '1' : '0'}
        newMtl.ior = ${props.ior}
        newMtl.displacementMaximum = ${props.displacementAmount}

        -- Diffuse (Pure RGB, untouched original)
        ${diffPath ? `local diffBmp = CoronaBitmap filename:@"${diffPath}" gamma:2.2
        newMtl.baseTexmap = diffBmp
        newMtl.baseTexmapOn = true` : `-- No Diffuse Map`}

        -- Roughness (Direct or Auto-Derived with CoronaColorCorrect)
        ${!isRoughDerived && roughPath ? `local roughBmp = CoronaBitmap filename:@"${roughPath}" gamma:1.0
        newMtl.roughnessTexmap = roughBmp
        newMtl.roughnessTexmapOn = true` : isRoughDerived && diffPath ? `if (CoronaColorCorrect != undefined and newMtl.baseTexmap != undefined) do (
            local ccRough = CoronaColorCorrect name:("CC_Roughness_" + newMtl.name) texmap:newMtl.baseTexmap
            ccRough.invert = ${roughCC.invert ? 'true' : 'false'}
            ccRough.gamma = ${roughCC.gamma}
            ccRough.contrast = ${roughCC.contrast}
            ccRough.saturation = ${roughCC.saturation}
            newMtl.roughnessTexmap = ccRough
            newMtl.roughnessTexmapOn = true
        )` : `-- No Roughness`}

        -- Normal Map (CoronaNormal DirectX/OpenGL)
        ${normPath ? `if (CoronaNormal != undefined) do (
            local normBmp = CoronaBitmap filename:@"${normPath}" gamma:1.0
            local normNode = CoronaNormal normalMap:normBmp flipGreen:${props.normalType === 'opengl' ? 'true' : 'false'}
            newMtl.baseBumpTexmap = normNode
            newMtl.baseBumpTexmapOn = true
        )` : `-- No Normal`}

        -- Displacement (Direct or Auto-Derived with CoronaColorCorrect)
        ${!isDispDerived && dispPath ? `local dispBmp = CoronaBitmap filename:@"${dispPath}" gamma:1.0
        newMtl.displacementTexmap = dispBmp
        newMtl.displacementTexmapOn = true` : isDispDerived && diffPath ? `if (CoronaColorCorrect != undefined and newMtl.baseTexmap != undefined) do (
            local ccDisp = CoronaColorCorrect name:("CC_Displacement_" + newMtl.name) texmap:newMtl.baseTexmap
            ccDisp.invert = ${dispCC.invert ? 'true' : 'false'}
            ccDisp.gamma = ${dispCC.gamma}
            ccDisp.contrast = ${dispCC.contrast}
            ccDisp.saturation = ${dispCC.saturation}
            ccDisp.brightness = ${dispCC.brightness}
            newMtl.displacementTexmap = ccDisp
            newMtl.displacementTexmapOn = true
            newMtl.displacementMaximum = ${props.displacementAmount}
        )` : `-- No Displacement`}

        -- Metalness
        ${metPath ? `local metBmp = CoronaBitmap filename:@"${metPath}" gamma:1.0
        newMtl.metalnessTexmap = metBmp
        newMtl.metalnessTexmapOn = true` : `-- No Metalness`}
        ` : `
        if (VRayMtl == undefined) do (
            messageBox "Chaos V-Ray is not active! Please select V-Ray in Render Setup." title:"Missing Renderer"
            return false
        )
        newMtl = VRayMtl name:"${cleanMtlName}"
        newMtl.refraction_ior = ${props.ior}
        newMtl.metalness = ${props.metalnessMode ? '1.0' : '0.0'}

        ${diffPath ? `newMtl.texmap_diffuse = VRayBitmap filename:@"${diffPath}" color_space:1
        newMtl.texmap_diffuse_on = true` : ``}

        ${roughPath ? `newMtl.texmap_roughness = VRayBitmap filename:@"${roughPath}" color_space:0
        newMtl.texmap_roughness_on = true
        newMtl.use_roughness = true` : ``}

        ${normPath ? `if (VRayNormalMap != undefined) do (
            local nBmp = VRayBitmap filename:@"${normPath}" color_space:0
            newMtl.texmap_bump = VRayNormalMap normal_map:nBmp flip_green:${props.normalType === 'opengl' ? 'true' : 'false'}
            newMtl.texmap_bump_on = true
        )` : ``}
        `}

        ${slateDistributionFunctionScript}

        -- Open Slate Material Editor and distribute nodes visibly
        try (
            sme.open()
            local vName = "PBR Material Studio"
            local vIdx = sme.getViewByName vName
            if (vIdx == 0) then vIdx = sme.createView vName
            sme.activeView = vIdx
            local sView = sme.getView vIdx
            if (sView != undefined) do (
                distributeNodesInSlate sView newMtl
            )
        ) catch (
            format "Warning: Could not distribute nodes to Slate SME: %\\n" (getCurrentException())
        )

        -- Put into Compact Material Editor slot
        if (${props.compactSlotIndex} >= 1 and ${props.compactSlotIndex} <= 24) do (
            setMeditMaterial ${props.compactSlotIndex} newMtl
            activeMeditSlot = ${props.compactSlotIndex}
        )

        -- Viewport & Selection Assignment
        showHWTextureMap newMtl true
        if (selection.count > 0) do (
            selection.material = newMtl
            format "==> Assigned '%' to % selected object(s) <==\\n" newMtl.name selection.count
        )
        format "Successfully created '%' with full Slate SME Node Distribution!\\n" newMtl.name
    )
)
`;
  }

  // ULTRA-PROFESSIONAL 3DS MAX ROLLOUT FLOATER SCRIPT (ROLLOUT UI WINDOW + SLATE SME DISTRIBUTION)
  return `/*
================================================================================
  3ds Max PBR Material Studio (Interactive Rollout Window & Slate Node Graph)
  Material Name : ${cleanMtlName}
  Target Engine : Chaos Corona & Chaos V-Ray
  Generated     : ${dateStr}
================================================================================
  KULLANIM:
  1. Bu scripti 3ds Max viewport penceresine sürükleyip bırakın (Drag & Drop)
     veya 3ds Max üst menüsünden Scripting > Run Script seçeneğiyle çalıştırın.
  2. "3ds Max PBR Material Studio" arayüz penceresi ekranda açılacaktır.
  3. "✦ OLUŞTUR & SLATE DÜĞÜM AĞACINA DİZ" butonuna tıkladığınızda
     Slate Material Editor açılarak tüm haritalar ve CoronaColorCorrect
     düğümleri şematik olarak serilecektir.
================================================================================
*/

try (destroyDialog pbrMtlStudioRollout) catch()

rollout pbrMtlStudioRollout "3ds Max PBR Material Studio" width:480 height:780
(
    -- 1. TEXTURE FOLDER & SMART SCANNER
    group "1. Doku Klasörü & Akıllı Asset Tarama (Smart Scan)"
    (
        button btnBrowse "Klasör Seç..." width:135 height:22 across:3 align:#left tooltip:"Doku klasörünü seçin"
        button btnScan "Akıllı Tara (Auto-Scan)" width:160 height:22 tooltip:"Diffuse, Roughness, Normal, Disp, AO otomatik eşle"
        button btnClear "Tümünü Temizle" width:135 height:22 align:#right
        editText edtFolder "Klasör:" text:@"${diffPath ? diffPath.substring(0, diffPath.lastIndexOf('\\')) : 'C:\\Textures'}" readOnly:false width:445 labelOnTop:false
    )

    -- 2. TEXTURE MAP SLOTS
    group "2. Doku Haritaları Eşleştirmesi (PBR Slots)"
    (
        editText edtDiff "Diffuse:" text:@"${diffPath}" width:380 across:2 labelOnTop:false
        button btnPickDiff "Seç..." width:55 height:19 align:#right

        editText edtRough "Roughness:" text:@"${roughPath}" width:380 across:2 labelOnTop:false
        button btnPickRough "Seç..." width:55 height:19 align:#right
        checkbox chkDeriveRough "Eksikse Diffuse'dan CoronaColorCorrect ile Otomatik Türet" checked:${isRoughDerived}

        editText edtNorm "Normal Map:" text:@"${normPath}" width:380 across:2 labelOnTop:false
        button btnPickNorm "Seç..." width:55 height:19 align:#right
        dropdownList ddlNormType "Normal Formatı:" items:#("DirectX (3ds Max Varsayılan / Y-)", "OpenGL (Flip Green / Y+)") selection:${props.normalType === 'opengl' ? 2 : 1} width:445

        editText edtDisp "Displacement:" text:@"${dispPath}" width:380 across:2 labelOnTop:false
        button btnPickDisp "Seç..." width:55 height:19 align:#right
        checkbox chkDeriveDisp "Eksikse Diffuse'dan CoronaColorCorrect ile Otomatik Türet" checked:${isDispDerived}

        editText edtMet "Metalness:" text:@"${metPath}" width:380 across:2 labelOnTop:false
        button btnPickMet "Seç..." width:55 height:19 align:#right

        editText edtAO "Ambient Occlusion:" text:@"${aoPath}" width:380 across:2 labelOnTop:false
        button btnPickAO "Seç..." width:55 height:19 align:#right
    )

    -- 3. CORONA COLOR CORRECT DERIVATION TUNING
    group "3. Corona Color Correct İnce Ayarları (Eksik Harita Türetme)"
    (
        label lblCcNote "Doku bulunamadığında CoronaColorCorrect kanalı sentezler:" align:#left
        spinner spnDispContrast "Disp Kontrast:" range:[-1.0, 1.0, ${dispCC.contrast}] scale:0.05 width:200 across:2
        spinner spnDispGamma "Disp Gamma:" range:[0.2, 2.5, ${dispCC.gamma}] scale:0.05 width:200
        spinner spnDispDepth "Disp Max Derinlik (cm):" range:[0.1, 50.0, ${props.displacementAmount}] scale:0.1 width:200 across:2
        checkbox chkDispInvert "Disp Ters Çevir (Invert)" checked:${dispCC.invert}

        spinner spnRoughContrast "Rough Kontrast:" range:[-1.0, 1.0, ${roughCC.contrast}] scale:0.05 width:200 across:2
        spinner spnRoughGamma "Rough Gamma:" range:[0.2, 2.5, ${roughCC.gamma}] scale:0.05 width:200
        checkbox chkRoughInvert "Rough Ters Çevir (Ahşap/Taş: AÇIK)" checked:${roughCC.invert} across:2
        button btnAutoTuneAll "Önerilen Değerleri Yükle" width:200 height:20 align:#right
    )

    -- 4. MATERIAL SETUP & EDITOR TARGET
    group "4. Materyal Kurulumu & Editör Dağıtımı"
    (
        editText edtMtlName "Materyal Adı:" text:"${cleanMtlName}" width:445 labelOnTop:false

        dropdownList ddlEngine "Render Motoru:" items:#("Chaos Corona (CoronaPhysicalMtl)", "Chaos V-Ray (VRayMtl)") selection:${isCorona ? 1 : 2} width:215 across:2
        dropdownList ddlTarget "Editör Hedefi:" items:#("Her İki Editör (SME + Medit)", "Slate Material Editor (SME)", "Compact Material Editor (Medit)") selection:1 width:215

        spinner spnIOR "Kırılma (IOR):" range:[1.0, 4.0, ${props.ior}] scale:0.01 width:200 across:2
        spinner spnSlot "Compact Slot #:" range:[1,24,${props.compactSlotIndex}] type:#integer width:140 align:#right

        checkbox chkMetallic "Metalik İletken (1.0)" checked:${props.metalnessMode} across:2
        checkbox chkApply "Seçili Objeye Doğrudan Ata" checked:true

        checkbox chkViewport "Doku Haritalarını Viewport'ta Göster" checked:true
    )

    -- 5. PROJECT MANAGER VAULT (SAVED MATERIAL PRESETS)
    group "5. K-Studio Project Manager & Hazır Şablonlar"
    (
        dropdownList ddlVault "Kayıtlı Materyal Ön Ayarları:" items:#(
            "${cleanMtlName} [Aktif Studio Kurulumu]",
            "Mtl_Nordic_Natural_Oak [Ahşap Parke Şablonu]",
            "Mtl_Carrara_Polished_Marble [Cilalı Mermer Şablonu]",
            "Mtl_Industrial_Steel_Brushed [Fırçalanmış Çelik Şablonu]"
        ) width:445
        button btnApplyDirect "DİREKT SEÇİME UYGULA & DÜĞÜM AĞACINA DİZ" width:445 height:26 tooltip:"Materyali oluşturur, seçime atar ve Slate SME içinde serer"
    )

    -- 6. BUILD & OUTPUT
    group "6. Oluştur & Düğüm Dağılımını Göster"
    (
        button btnBuild "✦ OLUŞTUR & SLATE DÜĞÜM AĞACINA DİZ (BUILD PBR)" width:445 height:32 align:#center
        button btnOpenSME "Slate SME Aç" width:218 height:20 across:2 align:#left
        button btnAssignMedit "Compact Slotuna Yerleştir" width:218 height:20 align:#right
    )

    -- HELPER: File search by patterns
    fn matchPatternInFiles files patternList =
    (
        local result = ""
        for f in files do (
            local baseName = toLower (getFilenameFile f)
            for pat in patternList do (
                if (matchPattern baseName pattern:("*" + pat + "*")) do (
                    return f
                )
            )
        )
        return ""
    )

    -- SCAN DIRECTORY FUNCTION
    fn scanTextureDirectory folderPath =
    (
        if (folderPath == undefined or not doesFileExist folderPath) do (
            messageBox "Lütfen geçerli bir klasör yolu seçiniz." title:"Klasör Bulunamadı"
            return false
        )
        local allFiles = #()
        local exts = #("*.png", "*.jpg", "*.jpeg", "*.tif", "*.tiff", "*.exr", "*.tga")
        for ext in exts do (
            local found = getFiles (folderPath + "\\\\" + ext)
            join allFiles found
        )

        if (allFiles.count == 0) do (
            messageBox "Seçilen klasörde uygun görsel dosyası bulunamadı." title:"Boş Klasör"
            return false
        )

        -- 1. Diffuse (Base color - untouched original)
        local mDiff = matchPatternInFiles allFiles #("diffuse", "albedo", "basecolor", "base_color", "color", "_col", "_d", "_bc", "renk", "desen")
        if (mDiff != "") do edtDiff.text = mDiff

        -- 2. Roughness / Glossiness
        local mRough = matchPatternInFiles allFiles #("roughness", "rough", "_r", "glossiness", "gloss", "_g", "puruz")
        if (mRough != "") then (
            edtRough.text = mRough
            chkDeriveRough.checked = false
        ) else (
            chkDeriveRough.checked = true
        )

        -- 3. Normal / Bump
        local mNorm = matchPatternInFiles allFiles #("normal", "nor", "nrm", "_n", "bump", "_bmp")
        if (mNorm != "") do (
            edtNorm.text = mNorm
            if (matchPattern (toLower (getFilenameFile mNorm)) pattern:"*gl*") then (
                ddlNormType.selection = 2
            ) else (
                ddlNormType.selection = 1
            )
        )

        -- 4. Displacement / Height
        local mDisp = matchPatternInFiles allFiles #("displacement", "disp", "height", "_h", "derinlik", "yukseklik")
        if (mDisp != "") then (
            edtDisp.text = mDisp
            chkDeriveDisp.checked = false
        ) else (
            chkDeriveDisp.checked = true
        )

        -- 5. Metalness
        local mMet = matchPatternInFiles allFiles #("metalness", "metallic", "metal", "_m", "metalik")
        if (mMet != "") do edtMet.text = mMet

        -- 6. Ambient Occlusion
        local mAO = matchPatternInFiles allFiles #("ambient", "occlusion", "ao", "_ao")
        if (mAO != "") do edtAO.text = mAO

        messageBox ("Doku taraması tamamlandı! " + allFiles.count as string + " dosya tarandı.") title:"Başarılı"
    )

    ${slateDistributionFunctionScript}

    -- MATERIAL CREATION AND DISTRIBUTION FUNCTION
    fn createPbrMaterial =
    (
        undo "Build PBR Material Studio" on
        (
            local isCoronaMtl = (ddlEngine.selection == 1)
            local cleanName = edtMtlName.text
            if (cleanName == "") do cleanName = "Mtl_PBR_Studio"

            local newMtl = undefined

            if (isCoronaMtl) then (
                if (CoronaPhysicalMtl == undefined) do (
                    messageBox "Corona Renderer aktif değil! Lütfen Render Setup penceresinden Corona Renderer'ı seçin." title:"Corona Eksik"
                    return false
                )

                newMtl = CoronaPhysicalMtl()
                newMtl.name = cleanName
                newMtl.roughnessMode = 0 -- 0: Roughness, 1: Glossiness
                newMtl.metalnessMode = if (chkMetallic.checked) then 1 else 0
                newMtl.ior = spnIOR.value
                newMtl.displacementMaximum = spnDispDepth.value

                -- 1. Diffuse (Untouched pure RGB base color)
                if (edtDiff.text != "" and doesFileExist edtDiff.text) do (
                    local diffBmp = CoronaBitmap filename:edtDiff.text gamma:2.2
                    newMtl.baseTexmap = diffBmp
                    newMtl.baseTexmapOn = true
                )

                -- 2. Roughness
                if (edtRough.text != "" and doesFileExist edtRough.text and not chkDeriveRough.checked) then (
                    local rBmp = CoronaBitmap filename:edtRough.text gamma:1.0
                    newMtl.roughnessTexmap = rBmp
                    newMtl.roughnessTexmapOn = true
                ) else if (chkDeriveRough.checked and newMtl.baseTexmap != undefined and CoronaColorCorrect != undefined) do (
                    local ccRough = CoronaColorCorrect name:("CC_Roughness_" + newMtl.name) texmap:newMtl.baseTexmap
                    ccRough.invert = chkRoughInvert.checked
                    ccRough.gamma = spnRoughGamma.value
                    ccRough.contrast = spnRoughContrast.value
                    ccRough.saturation = -1.0
                    newMtl.roughnessTexmap = ccRough
                    newMtl.roughnessTexmapOn = true
                )

                -- 3. Normal Bump
                if (edtNorm.text != "" and doesFileExist edtNorm.text and CoronaNormal != undefined) do (
                    local nBmp = CoronaBitmap filename:edtNorm.text gamma:1.0
                    local nNode = CoronaNormal normalMap:nBmp flipGreen:(ddlNormType.selection == 2)
                    newMtl.baseBumpTexmap = nNode
                    newMtl.baseBumpTexmapOn = true
                )

                -- 4. Displacement
                if (edtDisp.text != "" and doesFileExist edtDisp.text and not chkDeriveDisp.checked) then (
                    local dBmp = CoronaBitmap filename:edtDisp.text gamma:1.0
                    newMtl.displacementTexmap = dBmp
                    newMtl.displacementTexmapOn = true
                ) else if (chkDeriveDisp.checked and newMtl.baseTexmap != undefined and CoronaColorCorrect != undefined) do (
                    local ccDisp = CoronaColorCorrect name:("CC_Displacement_" + newMtl.name) texmap:newMtl.baseTexmap
                    ccDisp.invert = chkDispInvert.checked
                    ccDisp.gamma = spnDispGamma.value
                    ccDisp.contrast = spnDispContrast.value
                    ccDisp.saturation = -1.0
                    ccDisp.brightness = -0.05
                    newMtl.displacementTexmap = ccDisp
                    newMtl.displacementTexmapOn = true
                    newMtl.displacementMaximum = spnDispDepth.value
                )

                -- 5. Metalness
                if (edtMet.text != "" and doesFileExist edtMet.text) do (
                    local mBmp = CoronaBitmap filename:edtMet.text gamma:1.0
                    newMtl.metalnessTexmap = mBmp
                    newMtl.metalnessTexmapOn = true
                )
            ) else (
                -- Chaos V-Ray
                if (VRayMtl == undefined) do (
                    messageBox "Chaos V-Ray aktif değil! Lütfen Render Setup penceresinden V-Ray'i seçin." title:"V-Ray Eksik"
                    return false
                )

                newMtl = VRayMtl name:cleanName
                newMtl.refraction_ior = spnIOR.value
                newMtl.metalness = if (chkMetallic.checked) then 1.0 else 0.0

                if (edtDiff.text != "" and doesFileExist edtDiff.text) do (
                    newMtl.texmap_diffuse = VRayBitmap filename:edtDiff.text color_space:1
                    newMtl.texmap_diffuse_on = true
                )
                if (edtRough.text != "" and doesFileExist edtRough.text) do (
                    newMtl.texmap_roughness = VRayBitmap filename:edtRough.text color_space:0
                    newMtl.texmap_roughness_on = true
                    newMtl.use_roughness = true
                )
                if (edtNorm.text != "" and doesFileExist edtNorm.text and VRayNormalMap != undefined) do (
                    local nBmp = VRayBitmap filename:edtNorm.text color_space:0
                    newMtl.texmap_bump = VRayNormalMap normal_map:nBmp flip_green:(ddlNormType.selection == 2)
                    newMtl.texmap_bump_on = true
                )
            )

            -- ROUTE INTO EDITORS
            local targetMode = ddlTarget.selection

            -- Slate SME Distribution (1 = Both Editors, 2 = Slate SME only)
            if (targetMode == 1 or targetMode == 2) do (
                try (
                    sme.open()
                    local vName = "PBR Material Studio"
                    local vIdx = sme.getViewByName vName
                    if (vIdx == 0) then vIdx = sme.createView vName
                    sme.activeView = vIdx
                    local sView = sme.getView vIdx
                    if (sView != undefined) do (
                        distributeNodesInSlate sView newMtl
                    )
                ) catch (
                    format "Warning in SME routing: %\\n" (getCurrentException())
                )
            )

            -- Compact Medit (1 = Both Editors, 3 = Compact Medit only)
            if (targetMode == 1 or targetMode == 3) do (
                try (
                    local sIdx = spnSlot.value
                    if (sIdx >= 1 and sIdx <= 24) do (
                        setMeditMaterial sIdx newMtl
                        activeMeditSlot = sIdx
                    )
                ) catch ()
            )

            -- Viewport display & selection assignment
            if (chkViewport.checked) do showHWTextureMap newMtl true
            if (chkApply.checked and selection.count > 0) do (
                selection.material = newMtl
            )

            format "==> PBR Materyal '%' basariyla olusturuldu ve Slate SME dugum agacina dizildi! <==\\n" newMtl.name
            messageBox ("'" + newMtl.name + "' materyali oluşturuldu ve Slate Material Editor'de tüm harita bağlantılarıyla serildi!") title:"Başarılı"
        )
    )

    -- EVENT HANDLERS
    on btnBrowse pressed do (
        local pickedFolder = getSavePath caption:"PBR Doku Klasörünü Seçin" initialDir:edtFolder.text
        if (pickedFolder != undefined) do (
            edtFolder.text = pickedFolder
            scanTextureDirectory pickedFolder
        )
    )

    on btnScan pressed do (
        scanTextureDirectory edtFolder.text
    )

    on btnClear pressed do (
        edtDiff.text = ""
        edtRough.text = ""
        edtNorm.text = ""
        edtDisp.text = ""
        edtMet.text = ""
        edtAO.text = ""
    )

    on btnPickDiff pressed do (
        local f = getOpenFileName caption:"Diffuse Doku Seç" types:"Image (*.png;*.jpg;*.exr;*.tif)|*.png;*.jpg;*.jpeg;*.exr;*.tif;*.tiff"
        if (f != undefined) do edtDiff.text = f
    )

    on btnPickRough pressed do (
        local f = getOpenFileName caption:"Roughness Doku Seç" types:"Image (*.png;*.jpg;*.exr;*.tif)|*.png;*.jpg;*.jpeg;*.exr;*.tif;*.tiff"
        if (f != undefined) do (
            edtRough.text = f
            chkDeriveRough.checked = false
        )
    )

    on btnPickNorm pressed do (
        local f = getOpenFileName caption:"Normal Map Seç" types:"Image (*.png;*.jpg;*.exr;*.tif)|*.png;*.jpg;*.jpeg;*.exr;*.tif;*.tiff"
        if (f != undefined) do edtNorm.text = f
    )

    on btnPickDisp pressed do (
        local f = getOpenFileName caption:"Displacement Doku Seç" types:"Image (*.png;*.jpg;*.exr;*.tif)|*.png;*.jpg;*.jpeg;*.exr;*.tif;*.tiff"
        if (f != undefined) do (
            edtDisp.text = f
            chkDeriveDisp.checked = false
        )
    )

    on btnPickMet pressed do (
        local f = getOpenFileName caption:"Metalness Doku Seç" types:"Image (*.png;*.jpg;*.exr;*.tif)|*.png;*.jpg;*.jpeg;*.exr;*.tif;*.tiff"
        if (f != undefined) do edtMet.text = f
    )

    on btnPickAO pressed do (
        local f = getOpenFileName caption:"AO Doku Seç" types:"Image (*.png;*.jpg;*.exr;*.tif)|*.png;*.jpg;*.jpeg;*.exr;*.tif;*.tiff"
        if (f != undefined) do edtAO.text = f
    )

    on btnAutoTuneAll pressed do (
        spnDispContrast.value = 0.55
        spnDispGamma.value = 0.95
        spnDispDepth.value = 2.5
        chkDispInvert.checked = false
        spnRoughContrast.value = 0.25
        spnRoughGamma.value = 0.85
        chkRoughInvert.checked = true
    )

    on btnApplyDirect pressed do (
        createPbrMaterial()
    )

    on btnBuild pressed do (
        createPbrMaterial()
    )

    on btnOpenSME pressed do (
        sme.open()
    )

    on btnAssignMedit pressed do (
        if (meditMaterials[spnSlot.value] != undefined) do (
            activeMeditSlot = spnSlot.value
        )
    )
)

-- Launch the dialog window in 3ds Max
createDialog pbrMtlStudioRollout width:480 height:780 style:#(#style_titlebar, #style_border, #style_sysmenu, #style_resizing) pos:[100, 100]
`;
}

# 3ds Max Arayüz Penceresi & Slate SME Düğüm Dağılımları Entegrasyon Planı

Kullanıcının belirttiği iki kritik eksiklik tespit edilmiştir:
1. **3ds Max'te arayüz penceresinin açılmaması:** Komut kopyalandığında veya çalıştırıldığında `includeRolloutUI: false` ile sadece sessiz materyal kodu üretildiği için 3ds Max içinde arayüz penceresi görünmüyordu.
2. **"Buradaki gibi dağıtımları göremiyorum":** 3ds Max Slate Material Editor (SME) açıldığında, web uygulamasındaki gibi Diffuse ➔ CoronaColorCorrect ➔ Roughness/Displacement ve Normal bağlantılarını içeren görsel düğüm grafiği (node distribution & wiring) otomatik serilmiyordu (`sView.CreateNode` yalnızca ana gövdeyi ekliyordu, alt doku ve renk düzeltme düğümlerini görsel ağaca dizmiyordu).

---

## Kullanıcı Onayı Gereken Konular
- **Arayüz Başlatma Modu:** Web uygulamasından "Panoya Kopyala" veya "İndir" yapıldığında varsayılan olarak **Tam Arayüzlü MaxScript (`pbrMtlStudioRollout`)** üretilecek. Script 3ds Max'e sürüklendiğinde veya `Run Script` dendiğinde ekranda aynı arayüz penceresi açılacak.
- **Slate SME Düğüm Dağılımı (Node Tree Layout):** Script çalıştığında Slate Material Editor otomatik olarak açılacak, yeni bir sekme (`"PBR Material Studio"`) oluşturulacak ve Diffuse, Roughness CC, Normal, Displacement CC ve CoronaPhysicalMtl düğümleri web arayüzündeki gibi sıralı ve bağlantılı olarak görselleştirilecektir.

---

## Yapılacak Değişiklikler

### 1. `src/utils/maxScriptGenerator.ts`
- **Tam Slate SME Düğüm Dağılımı (Visual Node Graph):**
  - Materyalin tüm alt düğümlerini (`diffBmp`, `roughCC`, `normNode`, `dispCC`, `aoBmp`) Slate Material Editor içinde konumlandırarak (`CreateNode`) ve `sView.autoLayout()` / `sView.frameAll()` çağrılarak web uygulamasındaki şematik dağılımın 3ds Max içinde birebir görünmesini sağlama.
- **3ds Max Arayüz Penceresi (Rollout UI):**
  - Script'in en üstüne `try(destroyDialog pbrMtlStudioRollout) catch()` eklenerek pencerenin her seferinde temiz şekilde açılmasını sağlama.
  - Arayüz pencereli kodun (`includeRolloutUI: true`) varsayılan seçenek yapılması.
  - Web uygulamasındaki 3 aşamalı düzeni (1. Dokular & Akıllı Tarama, 2. Corona CC & Fiziksel Ayarlar, 3. Sahneye ve Editöre Aktarım) 3ds Max arayüzünde eksiksiz sunma.

### 2. `src/components/WizardPbrStudio.tsx` & `src/App.tsx`
- **Arayüzlü Script Seçeneği:**
  - "3ds Max'e Aktar" ve "Panoya Kopyala" butonlarının varsayılan olarak **Arayüzlü Pencere Scripti** (Rollout Dialog + Slate Düğümleri) kopyalamasını sağlama.
  - Kullanıcıya iki net seçenek sunma:
    1. **"3ds Max Arayüzü + Düğüm Ağacı (.ms)" (Varsayılan)**: Hem arayüz penceresi açılır hem Slate SME içinde dağılımlar görünür.
    2. **"Hızlı Doğrudan Sahneye Uygula (Sessiz)"**: Pencere açmadan arka planda nesneye atar.
- **3ds Max'te Nasıl Çalıştırılır Bilgi İpucu (Tooltip / Kılavuz):**
  - Scripti 3ds Max'e sürükleyip bırakma (Drag & Drop) veya `Scripting > Run Script` adımlarını gösteren kompakt bir yardım kutusu.

---

## Doğrulama Planı

### Kod ve Derleme Doğrulaması:
- `compile_applet` ve `lint_applet` birlikte çalıştırılarak TypeScript ve derleme hataları kontrol edilecek.
- Üretilen MaxScript kodu test edilecek:
  - Slate Material Editor sekmesi oluşturma ve `sView.CreateNode` ile alt haritaları dizme komutları syntax kontrolünden geçirilecek.
  - `createDialog pbrMtlStudioRollout` ve pencere kapatma/açma döngüsü doğrulanacak.

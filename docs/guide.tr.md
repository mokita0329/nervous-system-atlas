# Kullanım kılavuzu

Atlasın yapabildiği her şey, onu çalıştırmış biri için ([README](README.tr.md) üç satırda oraya götürür). Bir kopyasını
barındırmak, kendi MR'ınızı göstermek ve veriyi yeniden üretmek [geliştirici kılavuzundadır](developing.md)
(İngilizce). English: [User guide](guide.md).

## İçindekiler

| Tür | Sayı | Not |
|---|---|---|
| Yapılar | 379 | derin serebral venler, kord segmentleri, loblar ve giruslar, hippokampal alt alanlar, bazal ön beyin, talamik ve hipotalamik çekirdekler, beyin sapı çekirdekleri, serebellar lobüller, ak madde traktusları, arter sulama alanları, ventriküller, meninksler, arterler, periferik ve kutanöz sinirler, otonom yapılar |
| Kranial sinirler | 12 | çekirdekler, seyir, dallar, refleksler, yatak başı testler, lokalize edici bulgular |
| Yolaklar | 25 | nöron zinciri, çaprazlaşma, tıklanabilir ara noktalar, düzeye göre lezyon etkileri |
| Sendromlar | 125 | lokalizasyon, anatomik zeminiyle defisitler, taraf mantığı, görüntüleme, ayırıcı tanılar, tedavi incileri |
| Konular | 19 | gelişim, BOS ve kan-beyin bariyeri, nörotransmitterler, uyku ve EEG, epilepsi, baş ağrısı, demans, hareket bozuklukları, nöromusküler desenler, pediatrik sendromlar, lokalizasyon, görüntüleme, inme, enfeksiyon, tümörler, lökodistrofiler, sinir hasarı, kortikal katmanlar, koma |
| Sözlük | 205 | |
| Vaka soruları | 60 | özgün vakalar; yanıt, ilgili yapıları üç boyutta öne çıkarır |
| Mesh | 587 açık / 657 özel | etiket maskelerinden yeniden meshlenen MNI atlasları, VENAT venöz atlası, işaret noktalarıyla kayıtlanan BodyParts3D ve Z-Anatomy geometrisi ve hiçbir atlasın vermediği, burada kurulan meshler (iki sürümde de 12, açık sürümde 40); tam ayrıntıda 36 MB, ilk boyamada yaklaşık 3,5 MB |
| Atıflar | 2388 | 825 kaydın tamamında, 657 açık erişimli kaynağa |

## Kesitler, traktuslar ve sulama alanları

Her kesit, meshlerin kayıtlandığı MR'ın kendisidir; böylece bir yapı hem kesitte hem üç boyutta aynı anda okunur. Kesite tıklayınca imlecin altındaki yapı seçilir, bir yapıya tıklayınca kesitler ona taşınır.

| | |
|---|---|
| ![z = 16 mm'de capsula interna düzeyinden aksiyal T1; nucleus caudatus ve thalamus kesitin üzerinde, sol capsula interna konturlu](screenshots/axial-capsule.webp) | ![Hippocampus gövdesi düzeyinde koronal T1; yan ventriküller mavi, hippocampus ve amygdala pembe, sol hippocampus konturlu](screenshots/coronal-temporal.webp) |
| **Aksiyal, capsula interna düzeyi.** Etiket kaplaması derin gri çekirdekleri MR'ın üzerine boyar; seçili yapı konturlanır. | **Koronal, hippocampus düzeyi.** Cornu temporale, hippocampus ve amygdala, onları gösteren kesitte. |
| ![Orta hatta yakın sagital T1; sol yarım küre soyulmuş, corpus callosum, yan ventrikül, beyin sapı ve serebellum kesit üzerinde boyanmış](screenshots/sagittal-midline.webp) | ![x = -30 mm'de sagital T1 üzerinde kavis çizen sol fasciculus arcuatus; traktus atlası kesite soluk boyanmış, solda traktus ağacı açık](screenshots/tracts.webp) |
| **Sagital, hemiseksiyon.** Soyma kipi düzlemin bir yanındaki her şeyi gizler; kesit yüzeyine arkadaki MR ile birlikte bakarsınız. | **Traktuslar.** HCP1065 atlasından altmış ak madde demeti, üç boyutta ve kesitin üzerinde boyalı. |
| ![Arter sulama alanlarıyla renklendirilmiş aksiyal T1: arteria cerebri anterior turuncu, media pembe, posterior mavi; arterler üç boyutta](screenshots/territories.webp) | ![Sagital kesit foramen magnumun altında spinal kord MR'ına devam ediyor; servikal segment turuncu konturlu, torakal segment yeşil](screenshots/cord-mri.webp) |
| **Sulama alanları.** "Hangi damar bunu yapardı?" sorusunu kesitin kendisinde yanıtlar. | **Omurilik.** Foramen magnumun altında kesitler, atlasın kendi kordonu boyunca yeniden biçimlenmiş bir kord MR'ına devam eder; spinal düzeyler boyanmıştır. |

## Özellikler

- **Tek koordinat çerçevesi.** Meshler, T1/T2 hacimleri, etiket hacimleri ve kord MR'ı hep MNI152NLin2009cAsym RAS mm'dir.
- **Ağaç, arama ve seçim.** Her sistem ve alt sistem için üç durumlu kutular, tüm yapıları açıp kapatan ana anahtar, bir grubu yalnız bırakmak için Alt+tıklama ve yapılar, yolaklar ve sendromlar üzerinde arama (`>` yalnızca sendromlar için).
- **Üç boyutlu görünüm.** Döndürme, kaydırma ve imlece doğru yakınlaşma; bir meshe ya da MR kesitine tıklayarak seçme, çift tıklayarak çerçeveleme; `1`–`8` tuşlarında sekiz kamera ön ayarı. Anatomik paletli fiziksel tabanlı malzemeler ve ortam okluzyonu, yumuşak gölge ve kenar yumuşatma için bir **Kalite** düğmesi.
- **Kesitler.** T1/T2 ile aksiyal, koronal ve sagital; soyma kipleri, sulama alanı renklendirmesi, etiket konturları ve "tüm etiketler" boyaması. Bir kesit foramen magnuma indiği anda kord MR'ı kendiliğinden açılır, imlecin altındaki spinal düzeyi adlandırır ve düzeye tıklayınca o kord segmentini seçer.
- **Lezyon kipi.** `#/syndrome/<id>` sahneyi karartır, tutulan yapıları öne çıkarır, lezyon işaretini yerleştirir ve defisitleri sırayla gezer; **Yansıt** lezyonu diğer tarafa taşır.
- **İki dil.** Araç çubuğundaki **TR / EN** düğmesi ya da `L` ile İngilizce ve Türkçe. Seçim adres çubuğunda tutulur, böylece bir bağlantı kopyalandığı dilde açılır.
- **Her şeyin adresi var.** `#/structure/<id>`, `#/pathway/<id>`, `#/syndrome/<id>?step=n&side=l`, `#/topic/<id>`, `#/glossary`, `#/quiz`, `#/about`. Kısayollar için `?` tuşuna basın.
- **Görünümü paylaş.** Araç çubuğundaki **Görünümü paylaş**, sahneyi aynen kuran bir bağlantı kopyalar: kamera, görünen yapılar, kesitler, soyma, kontrast, açık panel. Sıradan bir bağlantı yalnızca rotayı ve kesit konumlarını taşır.
- **Hatırlayan vaka soruları.** Yanıtlar tarayıcınızda kalır, yenilemede kaybolmaz; soruları türe ya da zorluğa göre süzün ya da yalnızca yanlışlarınızı gözden geçirin.

## Klavye kısayolları

Uygulamada `?` tuşu bu listeyi açar.

| Tuş | İşlev |
|---|---|
| `1`–`8` | kamera açıları: lateral (sol), lateral (sağ), anterior, posterior, superior, inferior, medial (sol), medial (sağ) |
| `a` / `c` / `s` | aksiyal / koronal / sagital kesiti aç-kapat |
| `↑` / `↓` | son kullanılan kesiti 1 mm kaydır |
| `t` | kontrastı değiştir: T1 / T2 / kendi MR'ınız |
| `p` | `a` / `c` / `s` ile en son açılan kesitten soy (her kaydırıcının kendi soyma menüsü de var) |
| `[` / `]` | sol / sağ paneli aç-kapat |
| `f` | ara |
| `A`–`E` | açık vaka sorusunu yanıtla; `←` / `→` sorular arasında geçer |
| `L` | dili değiştir (English / Türkçe) |
| `Esc` | seçimi temizle / sendromdan çık |
| `Shift+S` | 3B görünümün ekran görüntüsü |
| `Shift`+tıklama | kesitleri oynatmadan seç |
| `Alt`+ağaçta bir sisteme ya da gruba tıklama | yalnızca o grubu göster |
| çift tıklama | tıklanan yapıyı çerçevele; boşlukta beyni ortala |

## Bağlantılar ve görünümü paylaşmak

Her rota bir bağlantıdır: `#/structure/<id>`, `#/pathway/<id>`, `#/syndrome/<id>?step=n&side=l`,
`#/topic/<id>`, `#/glossary`, `#/quiz`, `#/about`. Sıradan bir bağlantı kesit konumlarını (`ax`, `cor`,
`sag`), varsayılan dışı bir kontrastı (`c=t2w`, `c=subject-<id>`) ve varsayılan dışı dili (`lang=tr`) de taşır;
adres çubuğu her zaman aşağı yukarı gördüğünüz şeye bir bağlantıdır.

Araç çubuğundaki **Görünümü paylaş**, sahneyi *aynen* bağlantıya yazar ve kopyalar: kamera konumu ve hedefi,
görünen sistemler ve yapı bazındaki istisnalar, hangi kesitlerin açık olduğu, soyma, sabitleme, kontrast ve
açık panel. Sıradan bağlantılar kısa kalır; uzun biçim yalnızca istendiğinde yazılır.

## İçerik ve kaynaklar

**Sözlük dışındaki her kayıt yalnızca açık erişimli kaynaklara atıf verir**: NCBI Bookshelf üzerindeki StatPearls bölümleri, PubMed Central'daki makaleler, açık lisanslı başvuru sayfaları. Yayımlanan atlasın hiçbir yerinde basılı ders kitabına ya da ödeme duvarı ardındaki bir makaleye atıf yoktur. Bugün bu, **657 kaynak üzerinden 2388 atıf** demektir ve her atıf, canlı bölümden okunarak geldiği bölümü adlandırır.

Bir kaynakça kaydındaki `verified: true` yalnızca bir araç tarafından, canlı kaynak üstverisinden yazılır; elle asla. Bilinmeyen bir kaynağa atıf derlemeyi durdurur; `npm run citations:check` ise bozuk bir atıfta, doğrulanmamış bir kayıtta ya da hiçbir yerden atıf almayan bir kayıtta hata verir. Şemalar, yazım araçları ve kurallar için [İçerik ve kaynaklar](content.md).

## Türkçe sürüm

Arayüz İngilizce ve Türkçedir (`src/i18n/en.ts` ve `src/i18n/tr.ts`, 293 dizge; Türkçe tablo İngilizcesine göre tiplenmiştir, bu yüzden eksik bir anahtar tip denetimini düşürür). Türkçe kipte yapılar, kranial sinirler ve yolaklar Türk tıp eğitiminin adlandırdığı gibi, FIPAT'ın *Terminologia Neuroanatomica* ve *Terminologia Anatomica 2* listelerinden gelen Latince terimleriyle adlandırılır; İngilizce ad ikinci satırda kalır.

825 kaydın klinik metinlerinin tamamı da çevrilmiştir. Çeviriler `content/i18n/tr/` altında, üretildikleri İngilizce metnin özetine (hash) sabitlenmiş kaplamalar olarak durur; böylece İngilizce metin değiştiğinde çeviri sessizce yanlış kalmak yerine "eskimiş" olarak işaretlenir.

![Atlas Türkçe kipte: yapı ağacı ve panel, yapıları Latince adlarıyla, altında İngilizce adıyla gösteriyor; arayüz Türkçe ve üç boyutlu pencerenin altında makine destekli çeviri uyarısı](screenshots/turkish.webp)

> **Türkçe klinik metinler makine destekli çeviridir ve uzman incelemesi sürmektedir.** Makineyle ve terminoloji açısından denetlenmiştir; bir Türk nöroloğun incelemesinden ise henüz geçmemiştir. İki metin ayrıldığında İngilizce metin esastır. Uygulama bunu Türkçe kipte söyler; çevirisi eksik ya da eskimiş bir kayıt ise *English* etiketi taşır.

Terminoloji tablosunu, kaplama biçimini ve araçları [Türkçe sürüm](turkish-edition.md) anlatır.

## Uygulamanın ötesi

Aşağıdakilerin hepsi `npm start`'tan fazlasını ister ve [geliştirici kılavuzunda](developing.md) (İngilizce) anlatılır:

- **Bir kopyasını barındırmak.** `npm run build`, herhangi bir web sunucusunun sunabileceği statik bir `dist/` yazar — [Hosting a copy](developing.md#hosting-a-copy).
- **Kendi MR'ınız kesitlerde.** Kişisel bir T1 taraması atlas uzayına kayıtlanır, yüzü silinir ve şablonun T1/T2'sinin yanında gösterilir — [Showing your own MRI](developing.md#showing-your-own-mri).
- **Veriyi yeniden üretmek.** `npm start` ile inen paket kaynak atlaslardan yeniden üretilebilir — [Building the data yourself](developing.md#building-the-data-yourself).
- **İki sürüm.** Açık sürüm, lisansı yeniden dağıtımı yasaklayan dört veri kümesini dışarıda bırakır ve her birinin yerine açık lisanslı veri koyar — [The two editions](developing.md#the-two-editions).

## Lisanslar ve atıf

| Ne | Lisans | Dosya |
|---|---|---|
| Kod (`src/`, `scripts/`, `pipeline/`, `tools/`, `blender/`) | Apache License 2.0 | [LICENSE](../LICENSE) |
| Yazılmış içerik (`content/`) | CC BY-SA 4.0 | [content/LICENSE](../content/LICENSE) |
| Üretilen veri (`public/data/`) | CC BY-SA 4.0 | işlem hattının yazdığı `public/data/LICENSE` |

Meshler ve hacimler, [NOTICE](../NOTICE) dosyasında listelenen üçüncü taraf veri kümelerinin, kendi lisansları altında kullanılan **türevleridir**; yapılan değişiklikler: MNI152NLin2009cAsym uzayına kayıtlama, etiket maskelerinin işaretli mesafe alanı üzerinden yeniden meshlenmesi, yumuşatma, sınıf başına üçgen bütçesine indirgeme, komşu parsellerin kaynaştırılması, yeniden etiketleme ve renklendirme ve hiçbir kaynak atlasın vermediği meshlerin kurulması. Her kaynak lisansı, kendisinden türetilene CC BY-SA 4.0 ile birlikte uygulanmaya devam eder.

`NOTICE` üretilir, elle düzenlenmez; her veri kümesi için atıf, lisans ve indirme adresleriyle bir blok içerir ve `npm run notice -- --check` dosya eskidiyse hata verir. Lisans metinlerinin tamamı veriyle birlikte `public/data/licenses/` altında gider. Uygulamada **Hakkında** (ya da `#/about`), yüklü derlemedeki her kaynağı lisansı, atfı ve tam metin bağlantısıyla listeler.

**Nasıl atıf verilir:** Ayci B. *Clinical Neuroanatomy Atlas*, v1.0.3, 2026. Kod Apache 2.0, veri ve içerik CC BY-SA 4.0; `NOTICE` içindeki veri kümelerinden türetilmiştir. Meshleri kullanırken kaynak veri kümelerine, metin için `content/bibliography/` altındaki açık erişimli kaynaklara da atıf verin.

## Bilinen sınırlar

- **Türkçe klinik metinler bir hekim tarafından incelenmemiştir** (yukarıya bakın). Esas metin İngilizcedir.
- **Atlas bir şablondur, bir hasta değil.** Grup ortalaması parselasyonlar ve kayıtlanmış tek bir örnek; içindeki hiçbir şey bir bireyin ölçümü değildir.
- **Açık sürümün beyin sapı çekirdekleri konum belirteçleridir**, bölütleme değil: yayımlanmış hacim kadar elipsoidler, açık işaret noktalarına göre yerleştirilmiştir; çünkü kopyalanabilecek açık lisanslı bir 7 T çekirdek atlası yoktur. Panelde ve `manifest.derived` içinde nasıl kuruldukları açıkça yazılıdır.
- **Bazı yapıların iki sürümde de meshi yoktur.** Vena thalamostriata venöz atlasta vena cerebri interna'dan ayrılamıyor; birkaç kayıt benzer nedenlerle yalnızca metindir.
- **On iki mesh bölütlenmemiş, kurulmuştur** (nervus phrenicus, kord segment blokları, truncus lumbosacralis, dördüncü ventrikülün pleksus koroideusu) ve göründükleri her yerde şematik olarak işaretlenmiştir.
- **Genel nöron ve glia biyolojisi** yalnızca bir konuya değdiği ölçüde işlenmiştir (transmitterler, sinir hasarı, kortikal katmanlar).
- **Masaüstü penceresi için tasarlanmıştır.** 1100 pikselin altında paneller daralır, 900 pikselin altında ise 3B görünümün üzerine yerleşir ve kapalı başlar; böylece tablette ya da yarım genişlikte pencerede kullanılabilir kalır. Yine de tasarımın dayandığı düzen üç sütunludur ve telefonda elde edilen şey, telefona özgü bir arayüz değil, çalışan bir 3B görünümdür.

## Yol haritası

- Çevrilmiş metinlerin bir Türk nörolog tarafından kayıt kayıt incelenmesi.
- PAM50 şablonu için bir lisans. `pipeline/raw/pam50/LICENSE_REQUEST_DRAFT.txt` yazarlara gönderilmemiş bir istek taslağıdır; lisans belirtirlerse özel kord MR'ı, ölçülmüş kord segmentleri ve PAM50 ile kesilen filum terminale de açık sürümde yer alabilir ve iki sürüm arasındaki fark o kadar azalır.
- Periferik sinir sisteminin daha geniş kapsanması: bugünkü kapsam klinik olarak yük taşıyan sinirlerdir, eksiksiz bir periferik atlas değil.
- Masaüstü düzeninin küçülmesi yerine, telefonlar için tasarlanmış bir düzen.

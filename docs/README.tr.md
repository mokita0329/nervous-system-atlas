# <img src="icon/icon.png" alt="" height="40" align="absmiddle"> Klinik Nöroanatomi Atlası

*Bu, [İngilizce README](../README.md) dosyasının Türkçesidir.*

Tarayıcıda çalışan üç boyutlu bir klinik nöroanatomi atlası: tek bir MNI koordinat çerçevesinde 587 mesh ve
eşzamanlı MR kesitleri, arter sulama alanları, izlenebilir yolaklar, bir sendromun neyi nasıl bozduğunu gösteren
lezyon kipi, klinik konular, bir sözlük ve vaka soruları — İngilizce ve Türkçe, her kayıt açık erişimli
kaynaklara atıflı. Statik dosyalardan çalışır; sunucu da hesap da gerektirmez.

**[Canlı demoyu açın →](https://aycibatuhan.github.io/nervous-system-atlas/)** — hiçbir kurulum gerekmez.

## Hızlı başlangıç

[Node.js](https://nodejs.org) 22 ya da üstü kuruluyken:

```bash
git clone https://github.com/aycibatuhan/nervous-system-atlas.git
cd nervous-system-atlas
npm start
```

İlk çalıştırma bağımlılıkları kurar ve atlas verisini indirir (49 MB), sonra uygulamayı
<http://localhost:5173> adresinde açar. Sonraki çalıştırmalarda `npm start` yalnızca başlatır.

![Atlasın açılış görünümü: üç boyutlu pencerede korteks yüzeyi ve damarlar, solda yapı ağacı, altta kesit denetimleri](screenshots/overview.webp)

## Nasıl görünüyor

| | |
|---|---|
| ![Derin gri çekirdeklerin boyandığı aksiyal T1 kesiti, putamen turuncu konturla işaretli, sağda içerik paneli açık](screenshots/slices-mri.webp) | ![Lezyon kipinde lateral medüller sendrom: sahne yalnızca tutulan yapılara indirgenmiş, sol medullada lezyon işareti, defisit tablosu bulguları tek tek geziyor](screenshots/syndrome-wallenberg.webp) |
| **Kesit ve üç boyut aynı çerçevede.** MR'a tıklayarak yapıyı seçin ya da bir yapıya tıklayarak kesitleri oraya taşıyın. | **Lezyon kipi.** Sendrom, sahneyi tuttuğu yapılara indirger ve defisitleri sırayla gösterir. |
| ![Tractus corticospinalis lateralis'in nöron zinciri, çaprazlaşması ve numaralı seyri sağ panelde](screenshots/pathway.webp) | ![Alttan bakışta kranial sinirler ve arterler; nervus trigeminus seçili, seyri, çekirdekleri ve dalları listeleniyor](screenshots/cranial-nerves.webp) |
| **Yolaklar.** Nöron zinciri, nerede çaprazlaştığı ve her durağı tıklanabilir bir ara nokta olarak. | **Kranial sinirler.** Çekirdekler, seyir, dallar, refleksler, yatak başı testler ve lokalize edici bulgular. |
| ![Lezyonun yerini soran bir klinik vaka, beş seçenekle](screenshots/quiz.webp) | ![Aynı sendrom sayfası Türkçe: Latince yapı adları ve makine destekli çeviri uyarısı](screenshots/turkish-syndrome.webp) |
| **Vaka soruları.** 60 özgün vaka; yanıtlayınca ilgili yapılar üç boyutta öne çıkar. | **Türkçe.** Arayüzün tamamı ve bütün klinik metinler, yapı adları Latince. |

> **Klinik kullanım için değildir.** Bu atlas eğitim amaçlı bir başvuru kaynağıdır. İçindeki yapılar grup ortalaması şablonlar ve kayıtlanmış bir örnektir, hiçbir hastanın kendi anatomisi değildir; klinik metinleri ise eksik, güncelliğini yitirmiş ya da yanlış olabilecek öğretim özetleridir. Buradaki hiçbir bilgi tıbbi tavsiye değildir; klinik kararlar, güncel kılavuzları ve hastanın kendi bulgularını kullanan yetkin hekimlere aittir.

## Belgeler

| Ne istiyorsanız… | Okuyun |
|---|---|
| atlası kullanmak — her özellik, klavye kısayolları, bir görünümü aynen kuran bağlantılar, içindekiler, sınırları | [Kullanım kılavuzu](guide.tr.md) · [English](guide.md) |
| bir kopyasını barındırmak, kendi MR'ınızı kesitlerde göstermek, veriyi yeniden üretmek, denetimleri koşturmak ya da kod üzerinde çalışmak | [Geliştirici kılavuzu](developing.md) (İngilizce) |
| bir değişiklik göndermek — dal kuralları, asla depoya girmemesi gerekenler, içerik ve çeviri kuralları | [Katkı](../CONTRIBUTING.md) (İngilizce) |
| her sürümde ne değiştiğini görmek | [Değişiklik günlüğü](../CHANGELOG.md) (İngilizce) |

## Lisans

Kod Apache-2.0 ([LICENSE](../LICENSE)); yazılmış içerik ve üretilen veri CC BY-SA 4.0
([content/LICENSE](../content/LICENSE)). Meshler ve hacimler, [NOTICE](../NOTICE) dosyasında ve uygulamanın
**Hakkında** panelinde adı geçen veri kümelerinin, her biri kendi lisansı altında, türevleridir. Atlasa ve
kaynaklarına nasıl atıf verileceği: [kullanım kılavuzu](guide.tr.md#lisanslar-ve-atıf).

## İletişim

Batuhan Ayci, <batuhanayci@gmail.com>. Katkılar beklenir; önce [CONTRIBUTING.md](../CONTRIBUTING.md) dosyasını
okuyun. Lisans, yeniden dağıtım ya da veri bütünlüğüyle ilgili endişeler için genel bir issue yerine
[SECURITY.md](../SECURITY.md) içindeki adrese yazın. Klinik olarak yanlış içerik ise sıradan bir issue
konusudur ve bildirilmesi memnuniyetle karşılanır.

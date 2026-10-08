# Plan ve notlar

Durum: ✅ yapıldı · ⏳ sonraki adım

## Düzeltmeler

- ✅ **İnternetsiz kayıt kuyruğu:** gönderim sürerken eklenen/düzenlenen/silinen kayıtlar kaybolabiliyordu. Sıra artık her adımda yeniden okunuyor, sadece gönderilen işlem çıkarılıyor; gönderilmekte olan kayda dokunulmuyor (`src/lib/outbox.ts`).
- ✅ **Supabase'in 1000 satır sınırı:** kayıtlar artık sayfa sayfa çekiliyor (`fetchAll`, `src/lib/data.ts`).

## Şikayet et / engelle (App Store Guideline 1.2)

- ✅ Arkadaş profilinde **Şikayet et** ve **Engelle**; akıştaki paylaşımda "…" → şikayet.
- ✅ Şikayet sebebi + isteğe bağlı açıklama; gönderince "bu kişiyi de engelle" seçeneği.
- ✅ Engellenen kişinin kayıtları, sıralaması ve akıştaki paylaşımları görünmez; ondan bildirim gelmez.
- ✅ Profil → Engellenen kişiler: engeli kaldırma.
- ✅ Şikayetler `reports` tablosunda; 24 saat içinde incelenmeli (`docs/app-store.md` → Şikayetleri inceleme).

## Hedef menüsü

- ✅ Amaç: kilo vermek / kilo almak / kas kazanmak / kilomu korumak.
- ✅ Bilgiler: cinsiyet, yaş, boy, kilo, hareket düzeyi; kilo verme/almada hedef kilo ve hız.
- ✅ Öneri: Mifflin-St Jeor ile günlük harcama; kalori, protein (kilo başına) ve su (kiloya göre); tahmini varış tarihi.
- ✅ Güvenlik: kalori alt sınırı (kadın 1200, erkek 1500), en fazla 0,75 kg/hafta, sağlıksız hedef kilo uyarısı, "tıbbi tavsiye değildir" notu.
- ✅ Değerler elle değiştirilebilir.
- ✅ Kilo takibi: bugünün kilosu, grafik, hedef çizgisi, geçmiş.

## Beslenme

- ✅ Yeni **Beslenme** sekmesi: günlük kalori halkası, protein/karbonhidrat/yağ, kahvaltı/öğle/akşam/ara öğün, günler arası geçiş.
- ✅ Gömülü yiyecek listesi: 161 yiyecek, 5 dilde ad, hazır porsiyonlar. Temel yiyecekler USDA referans değerleri; ≈ işaretli ev yemekleri standart tariften yaklaşık.
- ✅ Arama telefonda (internetsiz, Türkçe karakter ve aksan duyarsız, tüm dillerde).
- ✅ Son yediklerim (öğün ve yiyecek), favoriler (yıldız), elle giriş (favoriye kaydetme seçeneği).
- ✅ Öğünler internetsiz de kaydedilir; sadece kişinin kendisi görür.

## Su takibi

- ✅ Beslenme sekmesinin en üstünde sabit su kartı: içilen / hedef, dolan bar.
- ✅ +200 / +330 / +500 ml ve özel miktar; son ekleneni geri alma.
- ✅ Günlük hedef karttan ya da Hedefim'den ayarlanır (varsayılan 2500 ml).
- ✅ Hatırlatmalar: 09:00–21:00 arası saatte bir / 2 / 3 saatte bir; Bildirimler ekranından açılıp kapanır; hedefe ulaşınca o günün kalanları iptal edilir.

## Sonraki adımlar

- ⏳ Barkod okutma (Open Food Facts) — kamera izni gerekir.
- ⏳ TürKomp'tan izin çıkarsa Türk yemeklerinin değerlerini resmi verilerle güncellemek.
- ⏳ Bütçe olursa yazıyla analiz: yapay zeka cümleyi kalemlere ayırır, değerler gömülü listeden gelir.
- ⏳ Yiyecek değerlerini USDA veritabanıyla tek tek karşılaştırmak (geliştirme ortamında USDA'ya erişim yoktu; değerler USDA referanslarına göre girildi).

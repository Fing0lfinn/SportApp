# 1 Year Challenge (1 Yıl)

Arkadaş gruplarının 1 yıl boyunca seçtikleri güç hedeflerine kim ulaşacak, takip eden mobil uygulama. Her grubun kendi başlangıç tarihi, hareketleri ve hedefleri var. Uygulama Türkçe, İngilizce, Japonca, İspanyolca ve Almanca.

İlk grubun (4 Ekim 2026 – 4 Ekim 2027) hedefleri, yeni grupların da varsayılan listesi:

| Hareket | Hedef |
| --- | --- |
| Squat | 120 kg |
| Deadlift | 160 kg |
| Bench Press | 80 kg |
| Overhead Press | 60 kg |
| Şınav | 20 tekrar (tek set) |
| Barfiks | 8 tekrar (tek set) |
| Bulgarian Split Squat | her elde 20 kg |
| Farmer's Walk | her elde 50 kg, 20 m |
| Bent Over Row | 80 kg |

Hedef, o ağırlık **gerçekten en az 1 tekrar kaldırılınca** tamamlanır. Tahmini maks (Epley) sadece bilgi olarak gösterilir.

Grup yöneticisi **Profil → Hedefler ve hareketler** ekranından başlangıç tarihini değiştirir, 25 hazır hareketten (`src/lib/catalog.ts`) ekler ya da çıkarır, hedefleri ayarlar. Listede olmayan hareketi kendi adıyla eklemek Pro'ya özel.

## Teknoloji

- **Expo SDK 57** (React Native, Expo Router), TypeScript
- **Supabase**: giriş, Postgres, satır bazlı güvenlik (RLS), canlı güncelleme
- TanStack Query, Reanimated, react-native-svg

## Çalıştırma

```bash
npm install
npx expo start
```

Telefona **Expo Go** uygulamasını kur, terminaldeki QR kodu okut. Bilgisayar ve telefon farklı ağlardaysa `npx expo start --tunnel` kullan.

Kontroller:

```bash
npm run typecheck
npx expo lint
```

## Supabase

Proje bağlantısı `src/lib/supabase.ts` içinde. Publishable anahtar uygulamaya gömülmek için tasarlandı; veriyi RLS kuralları korur. Başka bir projeye geçmek için `.env` dosyasına `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` yaz.

Şema `supabase/migrations/` altında:

- `profiles`: isim, renk, vücut ağırlığı (kayıt olunca otomatik oluşur)
- `groups`, `group_members`: gruplar, davet kodu, rol (admin/member), durum (active/pending)
- `entries`: her kayıt (hareket, ağırlık, tekrar, mesafe, tarih, başlangıç ölçümü mü)
- `likes`: akıştaki "Helal" beğenileri
- `push_tokens`: arkadaş bildirimleri için cihaz jetonları
- `groups.start_date`, `group_exercises`: her grubun başlangıç tarihi, hareket listesi ve hedefleri (yönetici düzenler)
- `profiles.locale`: arkadaş bildirimlerinin dili
- RPC: `create_group(p_name, p_start, p_exercises)`, `join_group`, `regenerate_invite_code`, `register_push_token`, `delete_account`
- `entries_push_notify` tetikleyicisi: rekor kaydında gruptakilere, her birinin dilinde Expo push gönderir ("seni geçti", "hedefini tamamladı", "rekor kırdı"; her biri `profiles.notify` ile kapatılabilir). Gönderen kişiyi engelleyenlere bildirim gitmez.
- `blocks`, `reports`: kullanıcıyı engelleme ve şikayet (App Store Guideline 1.2). Şikayetler Supabase panelinde `reports` tablosundan incelenir (bkz. `docs/app-store.md` → Şikayetleri inceleme)
- `health_settings`: kişisel hedef, günlük kalori/protein/su hedefi ve favori yiyecekler
- `body_weights`: kilo geçmişi; en son ölçüm `profiles.body_weight`'e yazılır
- `meals`, `water_logs`: öğünler ve içilen su

Hedef, kilo, öğün ve su verilerini **sadece kişinin kendisi** görür (RLS).

**Yeni sürüme geçerken:** `supabase/migrations/20261008120000_health_and_safety.sql` dosyasını Supabase panelinde **SQL Editor**'de çalıştır (ya da `npx supabase db push`). Bu çalışmadan yeni uygulama sürümündeki beslenme, su, hedef, kilo, şikayet ve engelleme özellikleri hata verir.

**Apple ve Google ile giriş:**

- Authentication → Sign In / Providers → **Apple**: aç, *Client IDs* alanına `com.fing0lfinn.sportapp` yaz (Expo Go'da denemek için virgülle `host.exp.Exponent` da ekle). Uygulama içinden giriş yapıldığı için gizli anahtar gerekmez.
- **Google**: Google Cloud Console'da *Web application* türünde OAuth istemcisi oluştur, yetkili yönlendirme adresine `https://zjarkghlkoflhijlpleo.supabase.co/auth/v1/callback` yaz. Çıkan *Client ID* ve *Client Secret*'ı Supabase'deki Google sağlayıcısına gir.
- Authentication → URL Configuration → *Redirect URLs*: `sportapp://**` (Expo Go için `exp://**`) ekle.

Herkes sadece kendi grubundaki kişilerin profil ve kayıtlarını görebilir, sadece kendi kayıtlarını değiştirebilir.

**Dashboard ayarı:** Authentication → Sign In / Providers → Email → **Confirm email** kapalı olmalı. Açıksa her kayıtta onay e-postası gider ve Supabase'in ücretsiz e-posta limiti (saatte birkaç e-posta) arkadaşların kaydını engeller.

## Dil

Metinler `src/i18n/` altında: `tr.ts` asıl kaynak, `en`, `ja`, `es`, `de` aynı yapıyı izler (eksik anahtar tip hatası verir). Hareket rehberleri `src/i18n/guides/`. Uygulama telefonun dilini kullanır, Profil → Dil'den değiştirilebilir. Ana ekrandaki uygulama adı `locales/*.json` içinde.

## Reklam ve Pro

- **Reklam:** İlk mağaza sürümünde yok. AdMob ve izleme izni paketleri, Apple'ın "takip" beyanı istememesi için çıkarıldı. Hazır entegrasyon (banner, Avrupa onay formu, iPhone izleme izni) commit `c6f7986`'da: `src/lib/ads.ts`, `src/components/ad-banner.tsx`, `react-native-google-mobile-ads` + `expo-tracking-transparency` paketleri ve `app.json` eklentileri geri eklenir, `MONETIZATION` açılır, App Privacy formu güncellenir.
- **Pro:** Tek seferlik satın alma, RevenueCat (`react-native-purchases`) ile. Reklamları kaldırır, özel hareket ve ekstra kart temalarını açar. Anahtar `src/lib/config.ts` → `REVENUECAT_KEY`; RevenueCat'te yetki adı `pro`.

## İnternetsiz kullanım

Son görülen veriler telefonda saklanır; uygulama internetsiz de açılır. İnternet yokken girilen, düzenlenen ya da silinen kayıtlar telefonda sıraya yazılır, ekranda "BEKLİYOR" olarak görünür ve bağlantı gelince sırayla gönderilir. Kayıt kimlikleri telefonda üretildiği için aynı kayıt iki kez yazılmaz.

## Bildirimler

- **Hatırlatmalar** (haftalık hatırlatma, 100. gün, yarı yol, son 30 gün, final) telefonda kurulur; Expo Go'da da çalışır.
- **Arkadaş bildirimleri** sunucudan push olarak gelir. Bunun için uygulamanın bir EAS projesine bağlanması gerekir:
  ```bash
  npx eas-cli@latest login
  npx eas-cli@latest init   # app.json'a projectId yazar
  ```
  iPhone'da Expo Go ile çalışır. Android'de Expo Go uzak bildirim almaz; geliştirme derlemesi gerekir:
  `npx eas-cli@latest build --profile development --platform android` (Firebase/FCM anahtarı da istenir).

## Yapı

```
src/
  app/                 Expo Router ekranları
    (tabs)/            Pano, Sıralama, Beslenme (su kartı, kalori/makro, öğünler), Akış, Profil
    exercise/[key]     Hareket detayı: grafik, ara hedefler, geçmiş
    friend/[id]        Kafa kafaya karşılaştırma
    log, entry/[id]    Kayıt ekle / düzenle / sil, kutlama (alt panel)
    groups             Grup seç, katıl, kur, davet kodu paylaş
    group-admin        Yönetici: isim, kod yenileme, onay, rol, üye çıkarma
    challenge          Grubun başlangıç tarihi, hareketleri ve hedefleri (yeni grup kurarken de)
    pro, language      Pro satın alma, dil seçimi
    share, month       Paylaşım kartı ve aylık özet (görsel olarak paylaşılır)
    guide/[key]        Hareket rehberi ve sayılma kuralı
    badge/[id]         Rozet detayı
    plates             Plaka hesaplayıcı
    notifications      Bildirim ayarları (su hatırlatmaları dahil)
    meal               Öğün ekle/düzenle: yiyecek ara, son yediklerim, favoriler, elle giriş
    goals, weight      Hedefim (kilo verme/alma/kas/koruma, günlük hedefler) ve kilo takibi
    report, blocked    Şikayet et ve engellenen kişiler
    wrapped            Yıl sonu özeti (hikaye gibi slaytlar)
    final              Final günü: geri sayım, sıralamanın açıklanması
    onboarding         Profil, grup ve 9 hareketlik başlangıç testi
    sign-in
  components/          Arayüz parçaları (ui, tab bar, grafik, form)
  i18n/                Metinler (tr, en, ja, es, de) ve hareket rehberleri
  lib/
    challenge.ts       Kurallar ve tüm hesaplar: ilerleme, ara hedefler, XP, seviye, seri
    catalog.ts         Gruplara eklenebilen hazır hareketler
    pro.ts, ads.ts     Pro satın alma (RevenueCat) ve reklam (AdMob)
    data.ts            Supabase sorguları ve React Query hook'ları
    badges.ts, month.ts, plates.ts, guide.ts
    notifications.ts   Yerel hatırlatmalar ve push kaydı
    outbox.ts          İnternetsiz kayıt: bekleyen işlemler ve senkronizasyon
    final.ts           Final saati ve geri sayım
    foods.ts           Gömülü yiyecek listesi (5 dilde ad, 100 g değerleri, porsiyonlar) ve arama
    nutrition.ts       Öğün ve su sorguları
    health.ts          Hedef ayarları, favoriler, kilo takibi
    targets.ts         Günlük kalori/protein/su hesabı (Mifflin-St Jeor)
    water-reminders.ts Su hatırlatmaları (telefonda kurulur)
    safety.ts          Engelleme ve şikayet
supabase/migrations/   Veritabanı şeması
```

Tasarım prototipi: https://claude.ai/artifact/6AtgSF6XKEiWn7UFkbLXWM

## Yol haritası

- **1. sürüm:** giriş, profil kurulumu ve başlangıç testi, gruplar ve davet kodu, kayıt ekle/düzenle/sil, pano, hareket detayı ve grafik, sıralama (genel, hareket, kilo oranı), akış ve beğeni, ara hedefler, XP, seviye, seri, canlı güncelleme
- **2. sürüm:** rozetler, kutlama animasyonları, bildirimler, hareket rehberi, paylaşım kartları, grup yönetimi, aylık özet, plaka hesaplayıcı
- **3. sürüm:** internetsiz kayıt, yıl sonu özeti, final günü
- **4. sürüm:** Apple ve Google ile giriş, grup bazlı hareketler ve hedefler, 5 dil, reklam ve Pro
- **5. sürüm (bu):** beslenme sekmesi (gömülü yiyecek listesi, öğünler, favoriler), su takibi ve hatırlatmaları, hedef menüsü ve kilo takibi, şikayet et / engelle, internetsiz kayıt hatası ve 1000 satır sınırı düzeltmeleri. Ayrıntılar: `docs/plan.md`
- **Sonra (EAS derlemesi gerekir):** Apple Sağlık / Health Connect, ana ekran widget'ı. Bu ikisi Expo Go'da çalışmayan yerel kod istiyor.

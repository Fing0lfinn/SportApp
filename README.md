# 1 Yıl Meydan Okuması

Arkadaşlarla 4 Ekim 2026 – 4 Ekim 2027 arasında 9 güç hedefine kim ulaşacak, takip eden mobil uygulama.

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
- RPC: `create_group`, `join_group`, `regenerate_invite_code`, `register_push_token`
- `entries_push_notify` tetikleyicisi: rekor kaydında gruptakilere Expo push gönderir ("seni geçti", "hedefini tamamladı", "rekor kırdı"; her biri `profiles.notify` ile kapatılabilir)

**Apple ve Google ile giriş:**

- Authentication → Sign In / Providers → **Apple**: aç, *Client IDs* alanına `com.fing0lfinn.sportapp` yaz (Expo Go'da denemek için virgülle `host.exp.Exponent` da ekle). Uygulama içinden giriş yapıldığı için gizli anahtar gerekmez.
- **Google**: Google Cloud Console'da *Web application* türünde OAuth istemcisi oluştur, yetkili yönlendirme adresine `https://zjarkghlkoflhijlpleo.supabase.co/auth/v1/callback` yaz. Çıkan *Client ID* ve *Client Secret*'ı Supabase'deki Google sağlayıcısına gir.
- Authentication → URL Configuration → *Redirect URLs*: `sportapp://**` (Expo Go için `exp://**`) ekle.

Herkes sadece kendi grubundaki kişilerin profil ve kayıtlarını görebilir, sadece kendi kayıtlarını değiştirebilir.

**Dashboard ayarı:** Authentication → Sign In / Providers → Email → **Confirm email** kapalı olmalı. Açıksa her kayıtta onay e-postası gider ve Supabase'in ücretsiz e-posta limiti (saatte birkaç e-posta) arkadaşların kaydını engeller.

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
    (tabs)/            Pano, Sıralama, Akış, Profil
    exercise/[key]     Hareket detayı: grafik, ara hedefler, geçmiş
    friend/[id]        Kafa kafaya karşılaştırma
    log, entry/[id]    Kayıt ekle / düzenle / sil, kutlama (alt panel)
    groups             Grup seç, katıl, kur, davet kodu paylaş
    group-admin        Yönetici: isim, kod yenileme, onay, rol, üye çıkarma
    share, month       Paylaşım kartı ve aylık özet (görsel olarak paylaşılır)
    guide/[key]        Hareket rehberi ve sayılma kuralı
    badge/[id]         Rozet detayı
    plates             Plaka hesaplayıcı
    notifications      Bildirim ayarları
    wrapped            Yıl sonu özeti (hikaye gibi slaytlar)
    final              Final günü: geri sayım, sıralamanın açıklanması
    onboarding         Profil, grup ve 9 hareketlik başlangıç testi
    sign-in
  components/          Arayüz parçaları (ui, tab bar, grafik, form)
  lib/
    challenge.ts       Kurallar ve tüm hesaplar: ilerleme, ara hedefler, XP, seviye, seri
    data.ts            Supabase sorguları ve React Query hook'ları
    badges.ts, month.ts, plates.ts, guide.ts
    notifications.ts   Yerel hatırlatmalar ve push kaydı
    outbox.ts          İnternetsiz kayıt: bekleyen işlemler ve senkronizasyon
    final.ts           Final saati ve geri sayım
supabase/migrations/   Veritabanı şeması
```

Tasarım prototipi: https://claude.ai/artifact/6AtgSF6XKEiWn7UFkbLXWM

## Yol haritası

- **1. sürüm:** giriş, profil kurulumu ve başlangıç testi, gruplar ve davet kodu, kayıt ekle/düzenle/sil, pano, hareket detayı ve grafik, sıralama (genel, hareket, kilo oranı), akış ve beğeni, ara hedefler, XP, seviye, seri, canlı güncelleme
- **2. sürüm:** rozetler, kutlama animasyonları, bildirimler, hareket rehberi, paylaşım kartları, grup yönetimi, aylık özet, plaka hesaplayıcı
- **3. sürüm (bu):** internetsiz kayıt, yıl sonu özeti, final günü
- **Sonra (EAS derlemesi gerekir):** Apple Sağlık / Health Connect, ana ekran widget'ı. Bu ikisi Expo Go'da çalışmayan yerel kod istiyor.

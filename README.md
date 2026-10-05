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
- RPC: `create_group`, `join_group`, `regenerate_invite_code`

Herkes sadece kendi grubundaki kişilerin profil ve kayıtlarını görebilir, sadece kendi kayıtlarını değiştirebilir.

**Dashboard ayarı:** Authentication → Sign In / Providers → Email → **Confirm email** kapalı olmalı. Açıksa her kayıtta onay e-postası gider ve Supabase'in ücretsiz e-posta limiti (saatte birkaç e-posta) arkadaşların kaydını engeller.

## Yapı

```
src/
  app/                 Expo Router ekranları
    (tabs)/            Pano, Sıralama, Akış, Profil
    exercise/[key]     Hareket detayı: grafik, ara hedefler, geçmiş
    friend/[id]        Kafa kafaya karşılaştırma
    log, entry/[id]    Kayıt ekle / düzenle / sil (alt panel)
    groups             Grup seç, katıl, kur, davet kodu paylaş
    onboarding         Profil, grup ve 9 hareketlik başlangıç testi
    sign-in
  components/          Arayüz parçaları (ui, tab bar, grafik, form)
  lib/
    challenge.ts       Kurallar ve tüm hesaplar: ilerleme, ara hedefler, XP, seviye, seri
    data.ts            Supabase sorguları ve React Query hook'ları
supabase/migrations/   Veritabanı şeması
```

Tasarım prototipi: https://claude.ai/artifact/6AtgSF6XKEiWn7UFkbLXWM

## Yol haritası

- **1. sürüm (bu):** giriş, profil kurulumu ve başlangıç testi, gruplar ve davet kodu, kayıt ekle/düzenle/sil, pano, hareket detayı ve grafik, sıralama (genel, hareket, kilo oranı), akış ve beğeni, ara hedefler, XP, seviye, seri, canlı güncelleme
- **2. sürüm:** rozetler, kutlama animasyonları, bildirimler, hareket rehberi, paylaşım kartları, grup yönetimi, aylık özet, plaka hesaplayıcı
- **3. sürüm:** Apple Sağlık / Health Connect, internetsiz kayıt, widget, yıl sonu özeti, final günü

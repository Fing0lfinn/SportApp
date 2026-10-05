// Reklam ilk mağaza sürümünde yok: AdMob ve izleme izni (ATT) paketleri bu sürümden çıkarıldı,
// çünkü Apple izleme izni metni olan uygulamadan gizlilik formunda "takip" beyanı istiyor.
// Reklamı açarken commit c6f7986'daki ads.ts / ad-banner.tsx sürümüne dön, paketleri ve
// app.json eklentilerini geri ekle (README → Reklam ve Pro).

export async function initAds() {}

export function useAdsReady() {
  return false;
}

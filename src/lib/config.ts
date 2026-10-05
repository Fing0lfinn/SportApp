// Mağaza ve reklam anahtarları. Boş bırakılanlar için uygulama güvenli varsayılana döner:
//   * AdMob reklam birimi boşsa Google'ın test reklamları gösterilir (gelir gelmez).
//   * RevenueCat anahtarı boşsa Pro satın alma "yakında" olarak görünür.
// AdMob uygulama kimlikleri (ca-app-pub-…~…) app.json → react-native-google-mobile-ads içinde.

/**
 * Reklam ve Pro açık mı? İlk mağaza sürümü ücretsiz ve reklamsız çıkıyor:
 * kapalıyken reklam gösterilmez, Pro menüsü, Pro temaları ve özel hareket sekmesi gizlenir.
 */
export const MONETIZATION = false;

export const ADMOB_BANNER = {
  ios: '',
  android: '',
};

/** RevenueCat → Project settings → API keys → Public app-specific keys (appl_… / goog_…) */
export const REVENUECAT_KEY = {
  ios: '',
  android: '',
};

/** RevenueCat'te tanımlanan yetki (entitlement) */
export const PRO_ENTITLEMENT = 'pro';

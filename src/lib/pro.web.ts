// Web'de mağaza yok: Pro kapalı, satın alma görünmez.
const state = { ready: true, isPro: false, available: false, price: null as string | null };

export async function initPro() {}
export async function setProUser(_userId: string | null) {}
export async function buyPro() {
  return false;
}
export async function restorePro() {
  return false;
}
export function usePro() {
  return state;
}

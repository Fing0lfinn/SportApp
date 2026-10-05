import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { PRO_ENTITLEMENT, REVENUECAT_KEY } from './config';

// Pro: tek seferlik satın alma (RevenueCat). Reklamları kaldırır, özel hareket ve ekstra kart temalarını açar.

type ProState = { ready: boolean; isPro: boolean; available: boolean; price: string | null };

let state: ProState = { ready: false, isPro: false, available: false, price: null };
let pkg: PurchasesPackage | null = null;
let configured = false;
const listeners = new Set<() => void>();

function set(patch: Partial<ProState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function applyInfo(info: CustomerInfo) {
  set({ isPro: !!info.entitlements.active[PRO_ENTITLEMENT] });
}

/** Açılışta bir kez: anahtar yoksa Pro "yakında" olarak kalır. */
export async function initPro() {
  const key = Platform.OS === 'ios' ? REVENUECAT_KEY.ios : REVENUECAT_KEY.android;
  if (!key || configured) {
    set({ ready: true });
    return;
  }
  try {
    Purchases.configure({ apiKey: key });
    configured = true;
    Purchases.addCustomerInfoUpdateListener(applyInfo);
    applyInfo(await Purchases.getCustomerInfo());
    const offerings = await Purchases.getOfferings();
    pkg = offerings.current?.availablePackages[0] ?? null;
    set({ available: !!pkg, price: pkg?.product.priceString ?? null });
  } catch {
    // mağazaya ulaşılamazsa uygulama Pro'suz devam eder
  } finally {
    set({ ready: true });
  }
}

/** Pro hesaba bağlı olsun: başka telefonda aynı hesapla girince de açık kalır. */
export async function setProUser(userId: string | null) {
  if (!configured) return;
  try {
    if (userId) applyInfo((await Purchases.logIn(userId)).customerInfo);
    else if (!(await Purchases.isAnonymous())) applyInfo(await Purchases.logOut());
  } catch {}
}

/** Satın al. Kullanıcı vazgeçerse false döner. */
export async function buyPro() {
  if (!pkg) throw new Error('unavailable');
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyInfo(customerInfo);
    return state.isPro;
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function restorePro() {
  if (!configured) return false;
  applyInfo(await Purchases.restorePurchases());
  return state.isPro;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePro() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

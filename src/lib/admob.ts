/**
 * AdMob bridge for native Android shells.
 *
 * Supports two shells, whichever is present at runtime:
 *  - Median.co  → `window.median.admob.*` (also `window.gonative.admob.*`)
 *  - WebToNative → `window.WTN.AdMob.*`
 *
 * Ad unit IDs live in the shell's dashboard, never in this code. In a plain
 * browser every call is a safe no-op and the UI falls back to the AdSense
 * slots / placeholders.
 */

type Maybe<T> = T | undefined;

type MedianAdmob = {
  banner?: {
    enable?: (opts?: Record<string, unknown>) => unknown;
    disable?: (opts?: Record<string, unknown>) => unknown;
    show?: (opts?: Record<string, unknown>) => unknown;
    hide?: (opts?: Record<string, unknown>) => unknown;
  };
  showInterstitialIfReady?: (opts?: Record<string, unknown>) => unknown;
  showInterstitialOnNextPageLoadIfReady?: (opts?: Record<string, unknown>) => unknown;
  interstitial?: {
    showIfReady?: (opts?: Record<string, unknown>) => unknown;
    show?: (opts?: Record<string, unknown>) => unknown;
    ready?: () => unknown;
  };
  showBanner?: (opts?: Record<string, unknown>) => unknown;
  hideBanner?: (opts?: Record<string, unknown>) => unknown;
  showInterstitial?: (opts?: Record<string, unknown>) => unknown;
  showInterstitialAd?: (opts?: Record<string, unknown>) => unknown;
};


type MedianBridge = { admob?: MedianAdmob };

type WTNBridge = {
  AdMob?: {
    showBanner?: (opts?: { position?: "top" | "bottom" }) => void;
    hideBanner?: () => void;
    showInterstitial?: () => void;
    showRewarded?: () => void;
    showRewardedInterstitial?: () => void;
  };
  showBannerAd?: (opts?: { position?: string }) => void;
  hideBannerAd?: () => void;
  showInterstitialAd?: () => void;
  deviceInfo?: unknown;
};

declare global {
  interface Window {
    WTN?: WTNBridge;
    webtonative?: WTNBridge;
    median?: MedianBridge;
    gonative?: MedianBridge;
  }
}

function wtn(): Maybe<WTNBridge> {
  if (typeof window === "undefined") return undefined;
  return window.WTN ?? window.webtonative;
}

function median(): Maybe<MedianAdmob> {
  if (typeof window === "undefined") return undefined;
  return window.median?.admob ?? window.gonative?.admob;
}

/** Which native shell (if any) we're running inside. */
export function nativeShell(): "median" | "webtonative" | null {
  if (median()) return "median";
  if (wtn()) return "webtonative";
  return null;
}

/** True when running inside a native shell that can serve AdMob. */
export function isNativeShell() {
  return nativeShell() !== null;
}

function call(fn: Maybe<(...args: never[]) => unknown>, arg?: unknown) {
  if (typeof fn !== "function") return false;
  try {
    (fn as (a?: unknown) => unknown)(arg);
    return true;
  } catch {
    return false;
  }
}

let bannerVisible = false;

export function showBannerAd(position: "top" | "bottom" = "bottom") {
  const m = median();
  if (m) {
    // Median: banner is app-wide and controlled with enable()/disable().
    const ok =
      call(m.banner?.enable, {}) ||
      call(m.banner?.show, { position, align: position }) ||
      call(m.showBanner, { position, align: position });
    bannerVisible = bannerVisible || ok;
    return ok;
  }
  const w = wtn();
  if (!w) return false;
  const ok = call(w.AdMob?.showBanner, { position }) || call(w.showBannerAd, { position });
  bannerVisible = bannerVisible || ok;
  return ok;
}

export function hideBannerAd() {
  const m = median();
  if (m) {
    call(m.banner?.disable, {}) || call(m.banner?.hide, {}) || call(m.hideBanner, {});
    bannerVisible = false;
    return;
  }
  const w = wtn();
  if (!w) return;
  call(w.AdMob?.hideBanner) || call(w.hideBannerAd);
  bannerVisible = false;
}

export function showInterstitialAd() {
  const m = median();
  if (m) {
    // Median only shows an interstitial when one is pre-loaded and ready.
    return (
      call(m.showInterstitialIfReady, {}) ||
      call(m.interstitial?.showIfReady, {}) ||
      call(m.interstitial?.show, {}) ||
      call(m.showInterstitial, {}) ||
      call(m.showInterstitialAd, {})
    );
  }
  const w = wtn();
  if (!w) return false;
  return call(w.AdMob?.showInterstitial) || call(w.showInterstitialAd);
}

/** Shorts: one interstitial after every N clips. */
export const SHORTS_PER_INTERSTITIAL = 5;

/** Long-form pre-roll: how long we hold the video while the ad opens. */
export const PREROLL_HOLD_MS = 900;

/** Minimum gap between interstitials so rapid swiping can't spam them. */
const INTERSTITIAL_COOLDOWN_MS = 45_000;
let lastInterstitial = 0;

export function maybeShowInterstitial() {
  // Interstitials only ever come from a native shell — never in the browser.
  if (!isNativeShell()) return false;
  const now = Date.now();
  if (now - lastInterstitial < INTERSTITIAL_COOLDOWN_MS) return false;
  const shown = showInterstitialAd();
  // Median keeps its banner app-wide; only WebToNative needs the manual hide.
  if (shown && bannerVisible && !median()) hideBannerAd();
  if (shown) lastInterstitial = now;
  return shown;
}


/** Debug helper: run `window.flipAdDebug()` in the shell to inspect the bridge. */
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>)['flipAdDebug'] = () => ({
    shell: nativeShell(),
    median: Object.keys(median() ?? {}),
    wtn: Object.keys(wtn()?.AdMob ?? wtn() ?? {}),
    bannerVisible,
  });
}

/**
 * AdMob bridge for WebToNative Android builds.
 *
 * WebToNative injects a `window.WTN` object into the WebView. AdMob unit IDs
 * are configured in the WebToNative dashboard (Monetization → AdMob), so the
 * web app only needs to ask the shell to show/hide the right ad type.
 *
 * In a normal browser none of this exists, so every call is a safe no-op and
 * the UI falls back to the existing AdSense slots / placeholders.
 */

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
  }
}

function bridge(): WTNBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return window.WTN ?? window.webtonative;
}

/** True when running inside the WebToNative Android shell. */
export function isNativeShell() {
  return !!bridge();
}

export function showBannerAd(position: "top" | "bottom" = "bottom") {
  const wtn = bridge();
  if (!wtn) return false;
  try {
    if (wtn.AdMob?.showBanner) wtn.AdMob.showBanner({ position });
    else if (wtn.showBannerAd) wtn.showBannerAd({ position });
    else return false;
    return true;
  } catch {
    return false;
  }
}

export function hideBannerAd() {
  const wtn = bridge();
  if (!wtn) return;
  try {
    if (wtn.AdMob?.hideBanner) wtn.AdMob.hideBanner();
    else wtn.hideBannerAd?.();
  } catch {
    /* shell without AdMob configured */
  }
}

export function showInterstitialAd() {
  const wtn = bridge();
  if (!wtn) return false;
  try {
    if (wtn.AdMob?.showInterstitial) wtn.AdMob.showInterstitial();
    else if (wtn.showInterstitialAd) wtn.showInterstitialAd();
    else return false;
    return true;
  } catch {
    return false;
  }
}

/** Shorts: one interstitial after every N clips. */
export const SHORTS_PER_INTERSTITIAL = 5;

/** Long-form pre-roll: how long we hold the video while the ad plays. */
export const PREROLL_HOLD_MS = 900;

/** Minimum gap between interstitials so rapid swiping can't spam them. */
const INTERSTITIAL_COOLDOWN_MS = 45_000;
let lastInterstitial = 0;

export function maybeShowInterstitial() {
  const now = Date.now();
  if (now - lastInterstitial < INTERSTITIAL_COOLDOWN_MS) return false;
  const shown = showInterstitialAd();
  if (shown) lastInterstitial = now;
  return shown;
}

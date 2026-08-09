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

// Median keeps its banner app-wide; only WebToNative needs the manual hide
// after an interstitial takes over the screen.
function afterInterstitialShown() {
  if (bannerVisible && !median()) hideBannerAd();
}

/* -------------------------------------------------------------------- *
 * Shorts interstitials
 *
 * Rule: count actual Shorts watched (never AdCards/sponsored/banners).
 * After exactly SHORTS_PER_INTERSTITIAL shorts, attempt an interstitial.
 * If it shows, start a SHORTS_COOLDOWN_MS cooldown during which shorts
 * keep playing but are NOT counted. Once the cooldown expires the counter
 * resumes counting from 0 on the next short.
 *
 * State is module-level (not React state) so it survives re-renders,
 * remounts, and React Strict Mode's double-invoked effects without ever
 * getting stuck or resetting unexpectedly.
 * -------------------------------------------------------------------- */

export const SHORTS_PER_INTERSTITIAL = 4;
const SHORTS_COOLDOWN_MS = 30_000;

let shortsCount = 0;
let shortsCooldownUntil = 0;
let lastShortsAdShown = 0;

/**
 * Call exactly once per distinct Short that becomes active (the caller is
 * responsible for deduping so a re-render on the same short doesn't double
 * count). AdCards/sponsored items must never be passed through this.
 */
export function registerShortWatched(): void {
  const now = Date.now();

  // Cooldown active: shorts play normally, nothing is counted.
  if (now < shortsCooldownUntil) return;

  shortsCount += 1;
  if (shortsCount < SHORTS_PER_INTERSTITIAL) return;

  if (!isNativeShell()) {
    // No native shell (plain browser) — nothing can ever be shown here, so
    // reset rather than sit stuck at the threshold forever.
    shortsCount = 0;
    return;
  }

  const shown = showInterstitialAd();
  if (shown) {
    afterInterstitialShown();
    shortsCount = 0;
    lastShortsAdShown = now;
    shortsCooldownUntil = now + SHORTS_COOLDOWN_MS;
  }
  // If not shown (not loaded / failed), leave the counter at the threshold:
  // the next short retries automatically without blocking the feed, and
  // without ever incrementing past the threshold.
}

/* -------------------------------------------------------------------- *
 * Long-form pre-roll interstitials
 *
 * Rule: independent from Shorts. When a long-form video opens, only show a
 * pre-roll if at least LONGFORM_COOLDOWN_MS has passed since the last one.
 * -------------------------------------------------------------------- */

const LONGFORM_COOLDOWN_MS = 3 * 60 * 1_000;

let lastLongFormAdShown = 0;
let longFormCooldownUntil = 0;

/**
 * Call when a long-form video is opened, before playback starts. Returns
 * whether an interstitial was actually shown (used to decide how long to
 * hold the "Sponsored" screen for).
 */
export function maybeShowLongFormInterstitial(): boolean {
  if (!isNativeShell()) return false;
  const now = Date.now();
  if (now < longFormCooldownUntil) return false;

  const shown = showInterstitialAd();
  if (shown) {
    afterInterstitialShown();
    lastLongFormAdShown = now;
    longFormCooldownUntil = now + LONGFORM_COOLDOWN_MS;
  }
  return shown;
}

/** Long-form pre-roll: how long we hold the video while the ad opens. */
export const PREROLL_HOLD_MS = 900;


/** Debug helper: run `window.flipAdDebug()` in the shell to inspect the bridge. */
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>)['flipAdDebug'] = () => ({
    shell: nativeShell(),
    median: Object.keys(median() ?? {}),
    wtn: Object.keys(wtn()?.AdMob ?? wtn() ?? {}),
    bannerVisible,
    shorts: { count: shortsCount, cooldownUntil: shortsCooldownUntil, lastAdShown: lastShortsAdShown },
    longForm: { cooldownUntil: longFormCooldownUntil, lastAdShown: lastLongFormAdShown },
  });
}

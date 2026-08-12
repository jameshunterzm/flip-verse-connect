/**
 * AdMob integration for Flip Chat.
 *
 * Native Android is the primary ad provider.
 *
 * Android exposes:
 *   window.AndroidAds.shortWatched()
 *   window.AndroidAds.longFormVideoStarted()
 *
 * Android is responsible for:
 *   - counting Shorts
 *   - showing the Shorts interstitial after 4 Shorts
 *   - showing the long-form pre-roll
 *   - notifying the web app when a long-form video can start
 *
 * This file intentionally does NOT maintain a second Shorts counter.
 * That prevents the web app and Android app from getting out of sync.
 *
 * Median/WebToNative support is retained as a fallback for environments
 * where the dedicated AndroidAds bridge is not available.
 */

type Maybe<T> = T | undefined;

type MedianAdmob = {
  banner?: {
    enable?: (opts?: Record<string, unknown>) => unknown;
    disable?: (opts?: Record<string, unknown>) => unknown;
    show?: (opts?: Record<string, unknown>) => unknown;
    hide?: (opts?: Record<string, unknown>) => unknown;
  };
  showInterstitialIfReady?: (
    opts?: Record<string, unknown>
  ) => unknown;
  showInterstitialOnNextPageLoadIfReady?: (
    opts?: Record<string, unknown>
  ) => unknown;
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

type MedianBridge = {
  admob?: MedianAdmob;
};

type WTNBridge = {
  AdMob?: {
    showBanner?: (opts?: {
      position?: "top" | "bottom";
    }) => void;
    hideBanner?: () => void;
    showInterstitial?: () => void;
    showRewarded?: () => void;
    showRewardedInterstitial?: () => void;
  };

  showBannerAd?: (opts?: {
    position?: string;
  }) => void;

  hideBannerAd?: () => void;

  showInterstitialAd?: () => void;

  deviceInfo?: unknown;
};

declare global {
  interface Window {
    /**
     * Native Android bridge.
     *
     * Implemented by the Flip Chat Android application.
     */
    AndroidAds?: {
      shortWatched?: () => void;
      longFormVideoStarted?: () => void;
    };

    /**
     * Legacy Median/WebToNative bridges.
     */
    WTN?: WTNBridge;
    webtonative?: WTNBridge;
    median?: MedianBridge;
    gonative?: MedianBridge;
  }
}

function androidAds():
  | NonNullable<Window["AndroidAds"]>
  | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.AndroidAds;
}

function wtn(): Maybe<WTNBridge> {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.WTN ?? window.webtonative;
}

function median(): Maybe<MedianAdmob> {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.median?.admob ?? window.gonative?.admob;
}

function call(
  fn: Maybe<(...args: never[]) => unknown>,
  arg?: unknown
) {
  if (typeof fn !== "function") {
    return false;
  }

  try {
    (fn as (a?: unknown) => unknown)(arg);
    return true;
  } catch (error) {
    console.warn("[AdMob] Native call failed:", error);
    return false;
  }
}

/**
 * Returns true when the dedicated Android bridge exists.
 */
export function isAndroidAdsAvailable(): boolean {
  const bridge = androidAds();

  return !!(
    bridge &&
    (
      typeof bridge.shortWatched === "function" ||
      typeof bridge.longFormVideoStarted === "function"
    )
  );
}

/**
 * Returns the native shell currently available.
 */
export function nativeShell():
  | "android"
  | "median"
  | "webtonative"
  | null {
  if (isAndroidAdsAvailable()) {
    return "android";
  }

  if (median()) {
    return "median";
  }

  if (wtn()) {
    return "webtonative";
  }

  return null;
}

/**
 * True when running inside a native application shell.
 */
export function isNativeShell(): boolean {
  return nativeShell() !== null;
}

/* ================================================================
 * BANNER ADS
 * ================================================================ */

let bannerVisible = false;

export function showBannerAd(
  position: "top" | "bottom" = "bottom"
): boolean {
  /*
   * Android banner is controlled by the native Android application.
   *
   * Do not attempt to create a second banner through JavaScript.
   */
  if (isAndroidAdsAvailable()) {
    bannerVisible = true;
    return true;
  }

  const m = median();

  if (m) {
    const ok =
      call(m.banner?.enable, {}) ||
      call(m.banner?.show, {
        position,
        align: position,
      }) ||
      call(m.showBanner, {
        position,
        align: position,
      });

    bannerVisible = bannerVisible || ok;

    return ok;
  }

  const w = wtn();

  if (!w) {
    return false;
  }

  const ok =
    call(w.AdMob?.showBanner, { position }) ||
    call(w.showBannerAd, { position });

  bannerVisible = bannerVisible || ok;

  return ok;
}

export function hideBannerAd(): void {
  /*
   * Android controls its native banner itself.
   */
  if (isAndroidAdsAvailable()) {
    bannerVisible = false;
    return;
  }

  const m = median();

  if (m) {
    call(m.banner?.disable, {}) ||
      call(m.banner?.hide, {}) ||
      call(m.hideBanner, {});

    bannerVisible = false;
    return;
  }

  const w = wtn();

  if (!w) {
    return;
  }

  call(w.AdMob?.hideBanner) ||
    call(w.hideBannerAd);

  bannerVisible = false;
}

/* ================================================================
 * SHORTS
 * ================================================================ */

/**
 * Report ONE completed Short to the native Android application.
 *
 * IMPORTANT:
 * This function does NOT count Shorts itself.
 *
 * Android performs:
 *
 *   Short 1
 *   Short 2
 *   Short 3
 *   Short 4
 *   -> show Shorts interstitial
 *   -> reset counter
 */
export function registerShortWatched(): void {
  if (typeof window === "undefined") {
    return;
  }

  const bridge = androidAds();

  if (
    bridge &&
    typeof bridge.shortWatched === "function"
  ) {
    try {
      bridge.shortWatched();

      console.log(
        "[AdMob] Reported completed Short to Android"
      );
    } catch (error) {
      console.warn(
        "[AdMob] Failed to report Short to Android:",
        error
      );
    }

    return;
  }

  /*
   * Browser/legacy fallback.
   *
   * There is intentionally no JavaScript Shorts counter here.
   * The dedicated Android application is the source of truth.
   */
  console.log(
    "[AdMob] AndroidAds bridge unavailable; Short not sent to native Android"
  );
}

/* ================================================================
 * LONG-FORM PRE-ROLL
 * ================================================================ */

/**
 * Notify native Android that a long-form video is about to start.
 *
 * Android will:
 *
 *   1. Check whether the long-form interstitial is ready.
 *   2. If ready, show it.
 *   3. When dismissed, call:
 *
 *      window.startLongFormVideoFromAndroid()
 *
 *   4. If no ad is ready, Android immediately calls the same callback.
 *
 * Therefore the web application does not use a fake timeout to decide
 * when the ad is finished.
 */
export function requestNativeLongFormPreRoll(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const bridge = androidAds();

  if (
    bridge &&
    typeof bridge.longFormVideoStarted === "function"
  ) {
    try {
      bridge.longFormVideoStarted();

      console.log(
        "[AdMob] Requested native Android long-form pre-roll"
      );

      return true;
    } catch (error) {
      console.warn(
        "[AdMob] Failed to request native long-form pre-roll:",
        error
      );

      return false;
    }
  }

  return false;
}

/**
 * Legacy function kept so existing imports do not break.
 *
 * When AndroidAds exists, the native Android bridge is used.
 *
 * In a normal browser there is no native pre-roll and the video should
 * simply continue.
 */
export function maybeShowLongFormInterstitial(): boolean {
  return requestNativeLongFormPreRoll();
}

/**
 * Kept for compatibility with any existing imports.
 *
 * Android does not use a JavaScript hold timer anymore.
 */
export const PREROLL_HOLD_MS = 0;

/* ================================================================
 * DEBUG
 * ================================================================ */

if (typeof window !== "undefined") {
  (
    window as unknown as Record<string, unknown>
  ).flipAdDebug = () => ({
    nativeShell: nativeShell(),

    androidAds: {
      available: isAndroidAdsAvailable(),
      shortWatched:
        typeof window.AndroidAds?.shortWatched ===
        "function",
      longFormVideoStarted:
        typeof window.AndroidAds?.longFormVideoStarted ===
        "function",
    },

    median: Object.keys(median() ?? {}),

    wtn: Object.keys(
      wtn()?.AdMob ?? wtn() ?? {}
    ),

    bannerVisible,
  });
}

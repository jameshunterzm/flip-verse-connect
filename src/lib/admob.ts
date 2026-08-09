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

const LOG = "[AdMob]";

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

/**
 * Ask the native shell to show an interstitial.
 *
 * Median: calls ONLY the documented `median.admob.showInterstitialIfReady()`
 * — no guessed/undocumented method names (no `.interstitial.show()`, no
 * `.showInterstitial()`, no `.showInterstitialAd()`). Per Median's docs this
 * function shows an ad if (and only if) one is already loaded and ready; if
 * nothing is loaded it is a documented no-op.
 *
 * IMPORTANT — hard limitation, not a guess: this call is fire-and-forget.
 * This project's Median bridge (as declared above and as verified against
 * this codebase — no Promise, no callback field, no window event listener
 * anywhere) gives NO signal confirming an ad was actually displayed,
 * closed, or failed. The boolean this function returns means only "the
 * call reached the native side without throwing a JS error" — it is not,
 * and must never be treated as, proof the user saw an ad. Callers
 * (registerShortWatched, maybeShowLongFormInterstitial) do not use this
 * return value to decide whether to reset their counters/cooldowns, for
 * exactly this reason — see the comments there.
 *
 * Also note: Shorts and long-form both call this same function, which
 * means — at the native/AdMob level — they draw from the SAME loaded
 * interstitial inventory (however many interstitial ad units Median is
 * configured with in App Studio, typically one). Their JS-level counters
 * and cooldowns are fully independent (see below), but that independence
 * is only in the bookkeeping logic, not in the underlying ad supply: if
 * Shorts consumes the one loaded ad, a long-form pre-roll requested a
 * moment later can legitimately have nothing to show, and vice versa.
 * No amount of JS/TypeScript restructuring changes that — it would take a
 * Median App Studio change (e.g. separate interstitial ad units per
 * surface, if Median supports that) to give the two surfaces genuinely
 * separate inventory.
 *
 * WebToNative is a separate, unrelated shell and is left exactly as before.
 */
export function requestMedianInterstitial(): boolean {
  const m = median();
  if (m) {
    console.log(`${LOG} Median bridge present: true — calling median.admob.showInterstitialIfReady()`);
    const requested = call(m.showInterstitialIfReady, {});
    console.log(
      requested
        ? `${LOG} showInterstitialIfReady() dispatched (this does NOT confirm an ad was shown — ` +
            `Median silently no-ops when nothing is loaded)`
        : `${LOG} showInterstitialIfReady() unavailable or threw — treating as not shown`,
    );
    return requested;
  }
  const w = wtn();
  if (!w) {
    console.log(`${LOG} Median bridge present: false, no native shell — skipping interstitial`);
    return false;
  }
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
 * After exactly SHORTS_PER_INTERSTITIAL shorts, request an interstitial.
 * If the request is dispatched, start a SHORTS_ATTEMPT_COOLDOWN_MS window
 * (an application-side pacing rule, NOT proof an ad was shown) during
 * which shorts keep playing but are NOT counted. Once the cooldown expires
 * the counter resumes counting from 0 on the next short.
 *
 * This state (shortsCount / shortsCooldownUntil / lastShortsAdAttempt) is
 * completely separate from the long-form state below — a Shorts request
 * never reads or writes longFormCooldownUntil, and vice versa. Their JS
 * bookkeeping can never block each other in this file (see the shared-
 * inventory caveat on requestMedianInterstitial() above, though — that's
 * a separate, platform-level constraint this file can't remove).
 *
 * State is module-level (not React state) so it survives re-renders,
 * remounts, and React Strict Mode's double-invoked effects without ever
 * getting stuck or resetting unexpectedly.
 * -------------------------------------------------------------------- */

export const SHORTS_PER_INTERSTITIAL = 4;
/** Application-side pacing only — an ATTEMPT cooldown, not proof an ad was shown. */
const SHORTS_ATTEMPT_COOLDOWN_MS = 30_000;

let shortsCount = 0;
let shortsCooldownUntil = 0;
let lastShortsAdAttempt = 0;

/**
 * Call exactly once per distinct Short that becomes active (the caller is
 * responsible for deduping so a re-render on the same short doesn't double
 * count). AdCards/sponsored items must never be passed through this.
 */
export function registerShortWatched(): void {
  const now = Date.now();

  if (now < shortsCooldownUntil) {
    console.log(`${LOG} Shorts: attempt-cooldown active (${Math.ceil((shortsCooldownUntil - now) / 1000)}s left) — not counted`);
    return;
  }

  shortsCount += 1;
  console.log(`${LOG} Shorts: count ${shortsCount}/${SHORTS_PER_INTERSTITIAL}`);
  if (shortsCount < SHORTS_PER_INTERSTITIAL) return;

  console.log(`${LOG} Shorts: reached ${SHORTS_PER_INTERSTITIAL} — attempting interstitial`);

  if (!isNativeShell()) {
    // No native shell at all (plain browser) — there is no ad inventory to
    // even attempt against, so reset rather than sit stuck at the
    // threshold forever. This is a known-negative, not a guess.
    console.log(`${LOG} Shorts: no native shell — resetting counter, nothing to attempt`);
    shortsCount = 0;
    return;
  }

  // Median gives no confirmation of display (see requestMedianInterstitial
  // doc comment above), so the return value here is deliberately NOT used
  // to decide whether to reset the counter or start the cooldown. We only
  // know one thing for certain: we made our one allowed attempt for this
  // cycle. That fact — not the ambiguous return value — is what advances
  // the state machine. The 30s window below is an APPLICATION-SIDE PACING
  // RULE (how often we're willing to attempt), not a claim that an ad was
  // shown. The alternative (waiting for a "confirmed shown" signal that
  // Median never sends) would mean calling showInterstitialIfReady() again
  // on every single subsequent short, forever — not "sensible retry
  // behavior".
  requestMedianInterstitial();
  afterInterstitialShown();
  shortsCount = 0;
  lastShortsAdAttempt = now;
  shortsCooldownUntil = now + SHORTS_ATTEMPT_COOLDOWN_MS;
  console.log(
    `${LOG} Shorts: attempt made — counter reset to 0, ATTEMPT cooldown for ${SHORTS_ATTEMPT_COOLDOWN_MS / 1000}s ` +
      `(this does NOT confirm the ad was actually shown to the user)`,
  );
}

/* -------------------------------------------------------------------- *
 * Long-form pre-roll interstitials
 *
 * Rule: independent from Shorts — see note above. When a long-form video
 * opens, only attempt a pre-roll if at least LONGFORM_ATTEMPT_COOLDOWN_MS
 * has passed since the last attempt.
 * -------------------------------------------------------------------- */

/** Application-side pacing only — an ATTEMPT cooldown, not proof an ad was shown. */
const LONGFORM_ATTEMPT_COOLDOWN_MS = 3 * 60 * 1_000;

let lastLongFormAdAttempt = 0;
let longFormCooldownUntil = 0;

/**
 * Call when a long-form video is opened, before playback starts. Returns
 * whether the interstitial request was dispatched to the native bridge
 * (used only to decide whether to show the pre-roll overlay at all) —
 * NOT proof it was actually seen. See requestMedianInterstitial().
 */
export function maybeShowLongFormInterstitial(): boolean {
  if (!isNativeShell()) {
    console.log(`${LOG} Long-form: no native shell — skipping pre-roll, playing normally`);
    return false;
  }
  const now = Date.now();
  if (now < longFormCooldownUntil) {
    console.log(`${LOG} Long-form: attempt-cooldown active (${Math.ceil((longFormCooldownUntil - now) / 1000)}s left) — skipping pre-roll`);
    return false;
  }

  console.log(`${LOG} Long-form: attempt-cooldown elapsed — attempting interstitial`);
  // Same limitation as Shorts (see above and requestMedianInterstitial):
  // Median gives no confirmation of display, so the cooldown below is an
  // APPLICATION-SIDE PACING RULE started because we made our one attempt
  // for this video open — not because the JS call "succeeded" or because
  // an ad definitely displayed. The dispatched boolean is only returned to
  // the caller so it can decide whether to show the pre-roll overlay at
  // all — it is never used here to gate the cooldown.
  const dispatched = requestMedianInterstitial();
  afterInterstitialShown();
  lastLongFormAdAttempt = now;
  longFormCooldownUntil = now + LONGFORM_ATTEMPT_COOLDOWN_MS;
  console.log(
    `${LOG} Long-form: attempt made — ATTEMPT cooldown for ${LONGFORM_ATTEMPT_COOLDOWN_MS / 1000}s ` +
      `(this does NOT confirm the ad was actually shown to the user)`,
  );
  return dispatched;
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
    shorts: { count: shortsCount, cooldownUntil: shortsCooldownUntil, lastAttempt: lastShortsAdAttempt },
    longForm: { cooldownUntil: longFormCooldownUntil, lastAttempt: lastLongFormAdAttempt },
  });
}

/**
 * Google AdSense configuration.
 *
 * Live client + ad unit for Flip Chat. Values can be overridden per
 * environment with VITE_ADSENSE_CLIENT / VITE_ADSENSE_FEED_SLOT /
 * VITE_ADSENSE_DISCOVER_SLOT if you create dedicated units later.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const ADSENSE_CLIENT = env['VITE_ADSENSE_CLIENT'] ?? "ca-pub-5751165683627001";
export const ADSENSE_FEED_SLOT = env['VITE_ADSENSE_FEED_SLOT'] ?? "4187550188";
export const ADSENSE_DISCOVER_SLOT = env['VITE_ADSENSE_DISCOVER_SLOT'] ?? "4187550188";

/** In-feed (fluid) layout key from the AdSense unit. */
export const ADSENSE_LAYOUT_KEY = env['VITE_ADSENSE_LAYOUT_KEY'] ?? "-6t+ed+2i-1n-4w";

/** One sponsored unit after every N videos (home feed + Discover). */
export const ADS_EVERY = 5;

export const adsenseReady = ADSENSE_CLIENT.startsWith("ca-pub-");

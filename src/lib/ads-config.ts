/**
 * Google AdSense configuration.
 *
 * Set these in your project environment (or edit the fallbacks below):
 *   VITE_ADSENSE_CLIENT        e.g. "ca-pub-1234567890123456"
 *   VITE_ADSENSE_FEED_SLOT     ad unit id used between shorts in the home feed
 *   VITE_ADSENSE_DISCOVER_SLOT ad unit id used inside the Discover list
 *
 * Until the client id is filled in, the app renders a clearly marked
 * "Ad space" placeholder with the exact same size/ratio as a real ad.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const ADSENSE_CLIENT = env['VITE_ADSENSE_CLIENT'] ?? "";
export const ADSENSE_FEED_SLOT = env['VITE_ADSENSE_FEED_SLOT'] ?? "";
export const ADSENSE_DISCOVER_SLOT = env['VITE_ADSENSE_DISCOVER_SLOT'] ?? "";

/** One sponsored unit after every N videos (home feed + Discover). */
export const ADS_EVERY = 5;

export const adsenseReady = ADSENSE_CLIENT.startsWith("ca-pub-");

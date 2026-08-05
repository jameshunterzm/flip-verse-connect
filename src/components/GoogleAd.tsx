import { useEffect, useRef } from "react";
import {
  ADSENSE_CLIENT,
  ADSENSE_DISCOVER_SLOT,
  ADSENSE_FEED_SLOT,
  adsenseReady,
} from "@/lib/ads-config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function useAdsensePush(enabled: boolean) {
  const pushed = useRef(false);
  useEffect(() => {
    if (!enabled || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      /* AdSense not loaded yet — it will fill on next script load */
    }
  }, [enabled]);
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-surface-2 text-center">
      <div className="px-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-cyan">Ad space</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** Full-screen 9:16 sponsored slot shown between shorts in the home feed. */
export function FeedAdSlot() {
  useAdsensePush(adsenseReady && !!ADSENSE_FEED_SLOT);
  return (
    <section className="relative h-dvh w-full shrink-0 snap-start overflow-hidden bg-black">
      <div className="absolute inset-0">
        {adsenseReady && ADSENSE_FEED_SLOT ? (
          <ins
            className="adsbygoogle block h-full w-full"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_FEED_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <Placeholder label="Google ad appears here after every 5 shorts" />
        )}
      </div>
      <span className="absolute left-4 top-16 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-md">
        Sponsored
      </span>
    </section>
  );
}

/** In-list sponsored slot for Discover, matched to the video card ratio. */
export function DiscoverAdSlot({ ratio = "aspect-video" }: { ratio?: string }) {
  useAdsensePush(adsenseReady && !!ADSENSE_DISCOVER_SLOT);
  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      <div className={`relative ${ratio} w-full`}>
        {adsenseReady && ADSENSE_DISCOVER_SLOT ? (
          <ins
            className="adsbygoogle absolute inset-0 block"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_DISCOVER_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div className="absolute inset-0">
            <Placeholder label="Google ad — same ratio as a video" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest">
          Sponsored
        </span>
      </div>
    </div>
  );
}

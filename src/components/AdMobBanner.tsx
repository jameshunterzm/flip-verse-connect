import { useEffect, useState } from "react";
import { hideBannerAd, isNativeShell, nativeShell, showBannerAd } from "@/lib/admob";

/**
 * Bottom banner shown on profile / creator-page screens.
 *
 * Inside a native shell (Median.co or WebToNative) this asks AdMob for a real
 * anchored banner; the spacer keeps page content clear of it. In a plain
 * browser it renders a labelled placeholder so the layout can be reviewed.
 */
export function ProfileBannerAd() {
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(isNativeShell());
    const shown = showBannerAd("bottom");
    return () => {
      // Median's banner is app-wide; leave it enabled when we leave the page.
      if (shown && nativeShell() !== "median") hideBannerAd();
    };
  }, []);


  if (native) {
    // The native banner floats above the WebView — just reserve the space.
    return <div className="h-[60px] w-full" aria-hidden />;
  }


  return (
    <div className="px-4 pb-2">
      <div className="grid h-[60px] w-full place-items-center rounded-xl bg-surface-2 text-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-cyan">Sponsored</p>
          <p className="text-[11px] text-muted-foreground">AdMob banner (Android app)</p>
        </div>
      </div>
    </div>
  );
}

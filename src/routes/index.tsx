import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Bell } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AdCard, FeedCard } from "@/components/FeedCard";
import { useFlip } from "@/lib/flip-store";
import { SHORTS_PER_INTERSTITIAL, maybeShowInterstitial } from "@/lib/admob";
import { useApprovedAds, useFriendsFeed, usePublicFeed, type Ad, type FeedPost } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flip Chat — Flip Between Friends. Flip Into Fame." },
      {
        name: "description",
        content:
          "Flip Chat is a short video and social app with a private Personal Account and a public Creator Page you can earn from.",
      },
      { property: "og:title", content: "Flip Chat — Flip Between Friends. Flip Into Fame." },
      {
        property: "og:description",
        content:
          "Flip Chat is a short video and social app with a private Personal Account and a public Creator Page you can earn from.",
      },
    ],
  }),
  component: FeedPage,
});

const tabs = ["For You", "Friends"] as const;

type Item = { type: "post"; post: FeedPost } | { type: "ad"; ad: Ad } | { type: "google"; key: string };

function FeedPage() {
  const { adFrequency, user } = useFlip();
  const [tab, setTab] = useState<(typeof tabs)[number]>("For You");
  const [activeIndex, setActiveIndex] = useState(0);

  const publicFeed = usePublicFeed(user?.id);
  const friendsFeed = useFriendsFeed(user?.id);
  const { data: ads = [] } = useApprovedAds();

  const items = useMemo<Item[]>(() => {
    const source = (tab === "For You" ? publicFeed.data : friendsFeed.data) ?? [];
    // Home is shorts-only. Long-form lives on Discover.
    const posts = tab === "For You" ? source.filter((p) => p.format !== "long") : source;
    const out: Item[] = [];
    let googleCount = 0;
    posts.forEach((post, i) => {
      out.push({ type: "post", post });
      if (tab !== "For You") return;
      const n = i + 1;
      // Ads never appear in the private friends feed.
      if (n % ADS_EVERY === 0) {
        out.push({ type: "google", key: `g-${googleCount++}` });
      } else if (ads.length && n % adFrequency === 0) {
        out.push({ type: "ad", ad: ads[Math.floor(i / adFrequency) % ads.length]! });
      }
    });
    return out;
  }, [tab, publicFeed.data, friendsFeed.data, ads, adFrequency]);

  // AdMob (Android app): one interstitial after every 5 shorts.
  const lastMilestone = useRef(0);
  useEffect(() => {
    if (tab !== "For You") return;
    const watched = items.slice(0, activeIndex + 1).filter((it) => it.type === "post").length;
    const milestone = Math.floor(watched / SHORTS_PER_INTERSTITIAL);
    if (milestone > lastMilestone.current) {
      lastMilestone.current = milestone;
      maybeShowInterstitial();
    }
  }, [activeIndex, items, tab]);

  const loading = tab === "For You" ? publicFeed.isLoading : friendsFeed.isLoading;

  return (
    <AppShell dark>
      <header className="fixed inset-x-0 top-0 z-30 mx-auto flex max-w-[480px] items-center gap-4 bg-gradient-to-b from-black/80 to-transparent px-4 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm transition-colors ${
              tab === t ? "font-semibold text-foreground" : "text-white/60"
            }`}
          >
            {t}
            {tab === t && <span className="bg-gradient-brand mx-auto mt-1 block h-0.5 w-6 rounded-full" />}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <Link to="/notifications" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Link>
          <Link to="/discover" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div
        className="snap-feed no-scrollbar h-dvh overflow-y-scroll"
        onScroll={(e) => setActiveIndex(Math.round(e.currentTarget.scrollTop / e.currentTarget.clientHeight))}
      >
        {items.map((item, i) =>
          item.type === "google" ? (
            <FeedAdSlot key={item.key} />
          ) : item.type === "ad" ? (
            <AdCard key={`ad-${item.ad.id}-${i}`} ad={item.ad} active={i === activeIndex} />
          ) : (
            <FeedCard key={item.post.id} post={item.post} active={i === activeIndex} />
          ),
        )}
        {items.length === 0 && (
          <div className="grid h-dvh place-items-center px-8 text-center text-sm text-muted-foreground">
            {loading
              ? "Loading your feed…"
              : tab === "Friends"
                ? user
                  ? "No friend posts yet. Add friends to see their private posts here."
                  : "Sign in to see posts from your friends."
                : "No public clips yet. Be the first to post from a Creator Page."}
          </div>
        )}
      </div>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Bell } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FeedCard } from "@/components/FeedCard";
import { buildFeed } from "@/lib/mock";
import { useFlip } from "@/lib/flip-store";

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
        content: "Private with friends. Public as a creator. Two sides, one you.",
      },
    ],
  }),
  component: FeedPage,
});

const tabs = ["For You", "Following", "Trending"] as const;

function FeedPage() {
  const { adFrequency } = useFlip();
  const [tab, setTab] = useState<(typeof tabs)[number]>("For You");
  const feed = useMemo(() => buildFeed(adFrequency), [adFrequency]);

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
          <Link to="/notifications" aria-label="Notifications" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-pink" />
          </Link>
          <Link to="/discover" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="snap-feed no-scrollbar h-dvh overflow-y-scroll">
        {feed.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </AppShell>
  );
}

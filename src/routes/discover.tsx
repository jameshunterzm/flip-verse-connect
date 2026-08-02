import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ads, clips, compact, creatorById, creators, trendingHashtags } from "@/lib/mock";
import { useFlip } from "@/lib/flip-store";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Flip Chat" },
      {
        name: "description",
        content: "Search creators, usernames, videos and hashtags, and find what's trending on Flip Chat.",
      },
      { property: "og:title", content: "Discover on Flip Chat" },
      { property: "og:description", content: "Trending hashtags, suggested creators and fresh clips." },
    ],
  }),
  component: DiscoverPage,
});

const filters = ["Top", "Creators", "Videos", "Hashtags"] as const;

function DiscoverPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("Top");
  const { following, toggleFollow } = useFlip();

  const matchCreators = creators.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.handle.toLowerCase().includes(q.toLowerCase()),
  );
  const matchClips = clips.filter(
    (v) =>
      !q ||
      v.caption.toLowerCase().includes(q.toLowerCase()) ||
      v.hashtags.some((h) => h.includes(q.toLowerCase().replace("#", ""))),
  );
  const matchTags = trendingHashtags.filter((t) => !q || t.tag.includes(q.toLowerCase().replace("#", "")));

  return (
    <AppShell>
      <div className="bg-glow px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="mb-3 text-2xl font-bold">Discover</h1>
        <label className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Creators, usernames, videos, #hashtags"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-gradient-brand text-primary-foreground" : "bg-surface text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 px-4 py-4">
        {(filter === "Top" || filter === "Hashtags") && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-brand-cyan" /> Trending hashtags
            </h2>
            <div className="flex flex-wrap gap-2">
              {matchTags.map((t) => (
                <span key={t.tag} className="rounded-full bg-surface px-3 py-1.5 text-xs">
                  <span className="text-brand-cyan">#{t.tag}</span>
                  <span className="ml-1.5 text-muted-foreground">{t.posts}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {(filter === "Top" || filter === "Creators") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Suggested creators</h2>
            <div className="space-y-2">
              {matchCreators.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <img src={c.avatar} alt={c.name} className="h-11 w-11 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {c.name} {c.verified && <span className="text-brand-cyan">✔</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{c.handle} · {compact(c.followers)} followers
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFollow(c.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                      following.has(c.id)
                        ? "bg-surface-2 text-muted-foreground"
                        : "bg-gradient-brand text-primary-foreground"
                    }`}
                  >
                    {following.has(c.id) ? "Following" : "Follow"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold">Sponsored</h2>
          <Link to="/" className="block overflow-hidden rounded-2xl bg-surface">
            <div className="relative">
              <img src={ads[0]!.poster} alt={ads[0]!.caption} loading="lazy" className="h-40 w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest">
                Sponsored
              </span>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold">{ads[0]!.advertiser}</p>
              <p className="text-xs text-muted-foreground">{ads[0]!.caption}</p>
              <span className="bg-gradient-brand mt-2 inline-block rounded-full px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                {ads[0]!.cta}
              </span>
            </div>
          </Link>
        </section>

        {(filter === "Top" || filter === "Videos") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Videos</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {matchClips.map((v) => (
                <Link key={v.id} to="/" className="relative overflow-hidden rounded-xl">
                  <img src={v.poster} alt={v.caption} loading="lazy" className="aspect-[9/16] w-full object-cover" />
                  <span className="absolute bottom-1 left-1.5 text-[10px] font-medium">
                    ▶ {compact(v.views)}
                  </span>
                  <span className="absolute right-1.5 top-1.5 text-[10px] text-white/80">
                    @{creatorById(v.creatorId).handle}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

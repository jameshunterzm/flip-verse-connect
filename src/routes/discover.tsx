import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, TrendingUp, UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useFlip } from "@/lib/flip-store";
import {
  compact,
  useApprovedAds,
  useCreatorPages,
  useFollowing,
  useFriendActions,
  usePublicFeed,
  useSearchPeople,
  useToggleFollow,
} from "@/lib/data";

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

const filters = ["Top", "Creators", "People", "Videos", "Hashtags"] as const;

function DiscoverPage() {
  const { user } = useFlip();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("Top");

  const { data: pages = [] } = useCreatorPages(q);
  const { data: people = [] } = useSearchPeople(q, user?.id);
  const { data: posts = [] } = usePublicFeed(user?.id);
  const { data: ads = [] } = useApprovedAds();
  const { data: following } = useFollowing(user?.id);
  const follow = useToggleFollow(user?.id);
  const { sendRequest } = useFriendActions(user?.id);

  const needle = q.toLowerCase().replace("#", "");
  const matchClips = posts.filter(
    (p) => !q || (p.caption ?? "").toLowerCase().includes(needle) || p.hashtags.some((h) => h.includes(needle)),
  );
  const tags = [...new Set(posts.flatMap((p) => p.hashtags))].filter((t) => !q || t.includes(needle)).slice(0, 20);
  const ad = ads[0];

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
        {(filter === "Top" || filter === "Hashtags") && tags.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-brand-cyan" /> Trending hashtags
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => setQ(`#${t}`)}
                  className="rounded-full bg-surface px-3 py-1.5 text-xs text-brand-cyan"
                >
                  #{t}
                </button>
              ))}
            </div>
          </section>
        )}

        {(filter === "Top" || filter === "Creators") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Creators</h2>
            <div className="space-y-2">
              {pages.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <Link to="/c/$handle" params={{ handle: c.handle }} className="shrink-0">
                    <img src={c.avatar_url ?? undefined} alt="" className="h-11 w-11 rounded-full bg-surface-2 object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {c.name} {c.verified && <span className="text-brand-cyan">✔</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">@{c.handle}</p>
                  </div>
                  {c.owner_id !== user?.id && (
                    <button
                      onClick={() =>
                        follow.mutate({ pageId: c.id, ownerId: c.owner_id, following: !!following?.has(c.id) })
                      }
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                        following?.has(c.id)
                          ? "bg-surface-2 text-muted-foreground"
                          : "bg-gradient-brand text-primary-foreground"
                      }`}
                    >
                      {following?.has(c.id) ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              ))}
              {pages.length === 0 && <p className="text-sm text-muted-foreground">No creator pages found.</p>}
            </div>
          </section>
        )}

        {(filter === "People" || (filter === "Top" && people.length > 0)) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">People</h2>
            <div className="space-y-2">
              {people.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <img src={p.avatar_url ?? undefined} alt="" className="h-11 w-11 rounded-full bg-surface-2 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.display_name || p.username}</p>
                    <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
                  </div>
                  <button
                    onClick={() => sendRequest.mutate(p.id)}
                    className="bg-gradient-brand flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              ))}
              {people.length === 0 && <p className="text-sm text-muted-foreground">Search a username to add friends.</p>}
            </div>
          </section>
        )}

        {ad && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Sponsored</h2>
            <a href={ad.cta_url} target="_blank" rel="noreferrer noopener" className="block overflow-hidden rounded-2xl bg-surface">
              <div className="relative">
                <img src={ad.poster_url ?? ad.media_url} alt={ad.title} loading="lazy" className="h-40 w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest">
                  Sponsored
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold">{ad.advertiser}</p>
                <p className="text-xs text-muted-foreground">{ad.title}</p>
                <span className="bg-gradient-brand mt-2 inline-block rounded-full px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  {ad.cta_label}
                </span>
              </div>
            </a>
          </section>
        )}

        {(filter === "Top" || filter === "Videos") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Videos</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {matchClips.map((v) => (
                <Link key={v.id} to="/" className="relative overflow-hidden rounded-xl">
                  <img
                    src={v.poster_url ?? v.media_url}
                    alt={v.caption ?? ""}
                    loading="lazy"
                    className="aspect-[9/16] w-full bg-surface-2 object-cover"
                  />
                  <span className="absolute bottom-1 left-1.5 text-[10px] font-medium">
                    ▶ {compact(v.views_count)}
                  </span>
                </Link>
              ))}
              {matchClips.length === 0 && (
                <p className="col-span-3 text-sm text-muted-foreground">No public videos yet.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

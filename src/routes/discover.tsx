import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, TrendingUp, UserPlus, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DiscoverAdSlot } from "@/components/GoogleAd";
import { useFlip } from "@/lib/flip-store";
import { ADS_EVERY } from "@/lib/ads-config";
import {
  compact,
  useCreatorPages,
  useFollowing,
  useFriendActions,
  usePublicFeed,
  useSearchPeople,
  useToggleFollow,
  type FeedPost,
} from "@/lib/data";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover long-form videos — Flip Chat" },
      {
        name: "description",
        content:
          "Watch long-form videos from Flip Chat creators, plus trending shorts, hashtags and people to follow.",
      },
      { property: "og:title", content: "Discover on Flip Chat" },
      { property: "og:description", content: "Long-form videos, trending hashtags and suggested creators." },
    ],
  }),
  component: DiscoverPage,
});

const filters = ["Top", "Videos", "Shorts", "Creators", "People", "Hashtags"] as const;

function DiscoverPage() {
  const { user } = useFlip();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("Top");

  const { data: pages = [] } = useCreatorPages(q);
  const { data: people = [] } = useSearchPeople(q, user?.id);
  const { data: posts = [] } = usePublicFeed(user?.id);
  const { data: following } = useFollowing(user?.id);
  const follow = useToggleFollow(user?.id);
  const { sendRequest } = useFriendActions(user?.id);

  const needle = q.toLowerCase().replace("#", "");
  const matches = (p: FeedPost) =>
    !q || (p.caption ?? "").toLowerCase().includes(needle) || p.hashtags.some((h) => h.includes(needle));

  const longForm = posts.filter((p) => p.format === "long" && matches(p));
  const shorts = posts.filter((p) => p.format !== "long" && matches(p));
  const tags = [...new Set(posts.flatMap((p) => p.hashtags))].filter((t) => !q || t.includes(needle)).slice(0, 20);

  const showVideos = filter === "Top" || filter === "Videos";
  const showShorts = filter === "Top" || filter === "Shorts";

  return (
    <AppShell>
      <div className="bg-glow px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="mb-3 text-2xl font-bold">Discover</h1>
        <label className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Videos, creators, usernames, #hashtags"
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

        {showVideos && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Long-form videos</h2>
            <div className="space-y-3">
              {longForm.map((v, i) => (
                <div key={v.id} className="space-y-3">
                  <LongCard post={v} />
                  {(i + 1) % ADS_EVERY === 0 && <DiscoverAdSlot />}
                </div>
              ))}
              {longForm.length === 0 && (
                <p className="text-sm text-muted-foreground">No long-form videos match that search yet.</p>
              )}
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

        {showShorts && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Shorts</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {shorts.slice(0, filter === "Shorts" ? 60 : 6).map((v) => (
                <Link
                  key={v.id}
                  to="/watch/$postId"
                  params={{ postId: v.id }}
                  className="relative overflow-hidden rounded-xl"
                >
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
              {shorts.length === 0 && <p className="col-span-3 text-sm text-muted-foreground">No shorts yet.</p>}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function LongCard({ post }: { post: FeedPost }) {
  return (
    <Link to="/watch/$postId" params={{ postId: post.id }} className="block overflow-hidden rounded-2xl bg-surface">
      <div className="relative aspect-video w-full bg-surface-2">
        <img
          src={post.poster_url ?? undefined}
          alt={post.caption ?? ""}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium">
          {Math.round((post.duration_seconds ?? 0) / 60)} min
        </span>
        <span className="bg-gradient-brand absolute bottom-2 left-2 grid h-8 w-8 place-items-center rounded-full text-primary-foreground">
          <Play className="h-4 w-4" />
        </span>
      </div>
      <div className="flex gap-3 p-3">
        <img
          src={post.page?.avatar_url ?? post.author?.avatar_url ?? undefined}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full bg-surface-2 object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{post.caption}</p>
          <p className="truncate text-xs text-muted-foreground">
            {post.page?.name ?? post.author?.display_name} · {compact(post.views_count)} views
          </p>
        </div>
      </div>
    </Link>
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProfileBannerAd } from "@/components/AdMobBanner";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";
import { compact, useCreatorPage, useFollowing, usePageStats, usePublicFeed, useToggleFollow } from "@/lib/data";

export const Route = createFileRoute("/c/$handle")({
  head: () => ({
    meta: [
      { title: "Creator Page — Flip Chat" },
      { name: "description", content: "Watch public clips, follow the creator and share their Flip Chat page." },
      { property: "og:title", content: "Creator on Flip Chat" },
      { property: "og:description", content: "Public clips, followers and links." },
    ],
  }),
  component: PublicCreatorPage,
});

function PublicCreatorPage() {
  const { handle } = useParams({ from: "/c/$handle" });
  const { user } = useFlip();
  const { data: page, isLoading } = useCreatorPage(handle);
  const { data: stats } = usePageStats(page?.id);
  const { data: posts = [] } = usePublicFeed(user?.id);
  const { data: following } = useFollowing(user?.id);
  const follow = useToggleFollow(user?.id);

  if (isLoading) {
    return (
      <AppShell>
        <TopBar title="Creator" />
        <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (!page) {
    return (
      <AppShell>
        <TopBar title="Creator" />
        <p className="p-8 text-center text-sm text-muted-foreground">This creator page doesn’t exist.</p>
      </AppShell>
    );
  }

  const isFollowing = !!following?.has(page.id);
  const pagePosts = posts.filter((p) => p.creator_page_id === page.id);

  return (
    <AppShell>
      <TopBar title={`@${page.handle}`} />
      <div className="bg-glow px-4 pb-4">
        <div className="flex items-center gap-4">
          <img
            src={page.avatar_url ?? undefined}
            alt=""
            className="h-20 w-20 rounded-full bg-surface-2 object-cover ring-2 ring-brand-pink"
          />
          <div>
            <h1 className="flex items-center gap-1.5 text-lg font-bold">
              {page.name} {page.verified && <span className="text-brand-cyan">✔</span>}
            </h1>
            <p className="text-sm text-muted-foreground">@{page.handle}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-6">
          <Stat value={compact(stats?.followers ?? 0)} label="Followers" />
          <Stat value={compact(stats?.views ?? 0)} label="Views" />
          <Stat value={compact(stats?.likes ?? 0)} label="Likes" />
        </div>

        {page.bio && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{page.bio}</p>}

        {page.owner_id !== user?.id && (
          <button
            onClick={() => follow.mutate({ pageId: page.id, ownerId: page.owner_id, following: isFollowing })}
            className={`mt-4 w-full rounded-2xl py-2.5 text-sm font-semibold ${
              isFollowing ? "bg-surface text-muted-foreground" : "bg-gradient-brand text-primary-foreground"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-1.5">
        {pagePosts.map((v) => (
          <div key={v.id} className="relative overflow-hidden rounded-xl">
            <img
              src={v.poster_url ?? v.media_url}
              alt=""
              loading="lazy"
              className="aspect-[9/16] w-full bg-surface-2 object-cover"
            />
            <span className="absolute bottom-1 left-1.5 text-[10px] font-medium">▶ {compact(v.views_count)}</span>
          </div>
        ))}
        {pagePosts.length === 0 && (
          <p className="col-span-3 py-12 text-center text-sm text-muted-foreground">No public posts yet.</p>
        )}
      </div>

      <ProfileBannerAd />
    </AppShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-base font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

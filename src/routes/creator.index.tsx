import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Link2, MoreHorizontal, Play, Share2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { useFlip } from "@/lib/flip-store";
import { compact, useMyPosts, usePageStats } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/creator/")({
  head: () => ({
    meta: [
      { title: "My Creator Page — Flip Chat" },
      { name: "description", content: "Your public creator page with videos, followers, links and monetization." },
      { property: "og:title", content: "Creator Page on Flip Chat" },
      { property: "og:description", content: "Go public, grow followers and earn from gifts and ads." },
    ],
  }),
  component: CreatorPage,
});

function CreatorPage() {
  const { user, profile, creatorPage, refresh, setMode } = useFlip();
  const { data: stats } = usePageStats(creatorPage?.id);
  const { data: posts = [] } = useMyPosts(user?.id, creatorPage?.id);
  const [switcher, setSwitcher] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  if (!creatorPage) {
    return (
      <AppShell>
        <div className="bg-glow flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
          <h1 className="text-2xl font-bold">No Creator Page yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Each account can have one Creator Page. Go public, grow followers and earn.
          </p>
          <button
            disabled={!user || creating}
            onClick={async () => {
              if (!user || !profile) return;
              setCreating(true);
              const handle = `${profile.username}`.slice(0, 24);
              const { error } = await supabase.from("creator_pages").insert({
                owner_id: user.id,
                handle,
                name: profile.display_name || profile.username,
                avatar_url: profile.avatar_url,
              });
              setCreating(false);
              if (error) {
                window.alert(error.message);
                return;
              }
              await refresh();
              setMode("creator");
            }}
            className="bg-gradient-brand shadow-glow mt-6 rounded-2xl px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create Creator Page"}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="bg-glow px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex justify-end">
          <button onClick={() => setSwitcher(true)} aria-label="Account menu">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-4">
          <img
            src={creatorPage.avatar_url ?? undefined}
            alt=""
            className="h-20 w-20 rounded-full bg-surface-2 object-cover ring-2 ring-brand-pink"
          />
          <div>
            <h1 className="flex items-center gap-1.5 text-lg font-bold">
              {creatorPage.name} {creatorPage.verified && <span className="text-brand-cyan">✔</span>}
            </h1>
            <p className="text-sm text-muted-foreground">@{creatorPage.handle}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-6">
          <Stat value={compact(stats?.followers ?? 0)} label="Followers" />
          <Stat value={compact(stats?.views ?? 0)} label="Views" />
          <Stat value={compact(stats?.likes ?? 0)} label="Likes" />
        </div>

        {creatorPage.bio && (
          <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{creatorPage.bio}</p>
        )}
        {creatorPage.link_url && (
          <a href={creatorPage.link_url} className="mt-1 inline-flex items-center gap-1.5 text-xs text-brand-cyan">
            <Link2 className="h-3 w-3" /> {creatorPage.link_url}
          </a>
        )}

        <div className="mt-4 flex gap-2">
          <Link
            to="/creator/edit"
            className="bg-gradient-brand flex-1 rounded-2xl py-2.5 text-center text-sm font-semibold text-primary-foreground"
          >
            Edit page
          </Link>
          <Link
            to="/c/$handle"
            params={{ handle: creatorPage.handle }}
            className="flex-1 rounded-2xl bg-surface py-2.5 text-center text-sm font-semibold"
          >
            View public
          </Link>
          <Link
            to="/creator/dashboard"
            aria-label="Creator dashboard"
            className="grid w-12 place-items-center rounded-2xl bg-surface"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
          <button
            aria-label="Share page"
            onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/c/${creatorPage.handle}`)}
            className="grid w-12 place-items-center rounded-2xl bg-surface"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={async () => {
            if (!window.confirm("Delete this Creator Page?")) return;
            await supabase.from("creator_pages").delete().eq("id", creatorPage.id);
            await refresh();
            void navigate({ to: "/profile" });
          }}
          className="mt-3 flex items-center gap-2 text-[11px] text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Delete this Creator Page
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-1.5">
        {posts.map((v) => (
          <div key={v.id} className="relative overflow-hidden rounded-xl">
            <img
              src={v.poster_url ?? v.media_url}
              alt=""
              loading="lazy"
              className="aspect-[9/16] w-full bg-surface-2 object-cover"
            />
            <span className="absolute bottom-1 left-1.5 flex items-center gap-1 text-[10px] font-medium">
              <Play className="h-2.5 w-2.5 fill-current" /> {compact(v.views_count)}
            </span>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="col-span-3 py-12 text-center text-sm text-muted-foreground">
            No public posts yet — tap + to upload.
          </p>
        )}
      </div>

      <AccountSwitcher open={switcher} onOpenChange={setSwitcher} />
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

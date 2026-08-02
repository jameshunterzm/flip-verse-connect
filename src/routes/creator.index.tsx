import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Link2, MoreHorizontal, Play, Share2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { compact, creators, creatorVideos } from "@/lib/mock";
import { useFlip } from "@/lib/flip-store";

export const Route = createFileRoute("/creator/")({
  head: () => ({
    meta: [
      { title: "Alex King — Creator Page on Flip Chat" },
      { name: "description", content: "Public creator page with videos, followers, links and monetization." },
      { property: "og:title", content: "Alex King on Flip Chat" },
      { property: "og:description", content: "25.6K followers · 2.3M likes · Creating. Inspiring. Earning." },
    ],
  }),
  component: CreatorPage,
});

function CreatorPage() {
  const me = creators[0]!;
  const { hasCreatorPage, createCreatorPage, deleteCreatorPage } = useFlip();
  const [tab, setTab] = useState<"videos" | "shorts" | "pinned">("videos");
  const [switcher, setSwitcher] = useState(false);

  if (!hasCreatorPage) {
    return (
      <AppShell>
        <div className="bg-glow flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
          <h1 className="text-2xl font-bold">No Creator Page yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Each account can have one Creator Page. Go public, grow followers and earn.
          </p>
          <button
            onClick={createCreatorPage}
            className="bg-gradient-brand shadow-glow mt-6 rounded-2xl px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Create Creator Page
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
          <img src={me.avatar} alt={me.name} className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-pink" />
          <div>
            <h1 className="flex items-center gap-1.5 text-lg font-bold">
              {me.name} <span className="text-brand-cyan">✔</span>
            </h1>
            <p className="text-sm text-muted-foreground">@{me.handle}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-6">
          <Stat value="120" label="Following" />
          <Stat value={compact(me.followers)} label="Followers" />
          <Stat value="2.3M" label="Likes" />
        </div>

        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{me.bio}</p>
        <a href="#" className="mt-1 inline-flex items-center gap-1.5 text-xs text-brand-cyan">
          <Link2 className="h-3 w-3" /> flipchat.app/alexking
        </a>

        <div className="mt-4 flex gap-2">
          <button className="bg-gradient-brand flex-1 rounded-2xl py-2.5 text-sm font-semibold text-primary-foreground">
            Follow
          </button>
          <Link
            to="/creator/dashboard"
            aria-label="Creator dashboard"
            className="grid w-12 place-items-center rounded-2xl bg-surface"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
          <button aria-label="Share page" className="grid w-12 place-items-center rounded-2xl bg-surface">
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={deleteCreatorPage}
          className="mt-3 flex items-center gap-2 text-[11px] text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Delete this Creator Page
        </button>
      </div>

      <div className="flex border-b border-border">
        {(["videos", "shorts", "pinned"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex-1 py-3 text-sm capitalize ${
              tab === t ? "font-semibold text-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
            {tab === t && <span className="bg-gradient-brand absolute inset-x-6 bottom-0 h-0.5 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-1.5">
        {creatorVideos.map((v, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl">
            <img src={v.poster} alt="" loading="lazy" className="aspect-[9/16] w-full object-cover" />
            <span className="absolute bottom-1 left-1.5 flex items-center gap-1 text-[10px] font-medium">
              <Play className="h-2.5 w-2.5 fill-current" /> {v.views}
            </span>
          </div>
        ))}
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

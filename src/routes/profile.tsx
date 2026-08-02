import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Pencil, UserPlus, MoreHorizontal, Users, Ban, UserMinus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { media, personalPosts } from "@/lib/mock";
import { useFlip } from "@/lib/flip-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Personal Account — Flip Chat" },
      { name: "description", content: "Your private side: friends-only posts, friend requests and privacy controls." },
      { property: "og:title", content: "Personal Account on Flip Chat" },
      { property: "og:description", content: "Private by default. Only accepted friends can see your posts." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { friends, requests, removeFriend, blockFriend } = useFlip();
  const [tab, setTab] = useState<"posts" | "photos" | "friends">("posts");
  const [switcher, setSwitcher] = useState(false);

  return (
    <AppShell>
      <div className="bg-glow relative px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex justify-end">
          <button onClick={() => setSwitcher(true)} aria-label="Account menu">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-4">
          <img src={media.avatar1} alt="You" className="h-20 w-20 rounded-full object-cover ring-2 ring-brand" />
          <div>
            <h1 className="flex items-center gap-1.5 text-lg font-bold">
              My Vibes <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </h1>
            <p className="text-sm text-muted-foreground">@my.vibes</p>
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-center">
          <Stat value={friends.length} label="Friends" />
          <Stat value={personalPosts.length} label="Posts" />
          <Stat value={0} label="Followers" />
        </div>

        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
          Just me and my close circle.{"\n"}Live. Laugh. Share.
        </p>

        <div className="mt-4 flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-surface py-2.5 text-sm font-medium">
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
          <Link
            to="/requests"
            className="relative grid w-12 place-items-center rounded-2xl bg-surface"
            aria-label="Friend requests"
          >
            <UserPlus className="h-4 w-4" />
            {requests.length > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-brand-pink px-1.5 text-[10px] font-semibold">
                {requests.length}
              </span>
            )}
          </Link>
        </div>

        <p className="mt-3 rounded-xl bg-surface p-2.5 text-[11px] text-muted-foreground">
          Personal Accounts are private and can’t earn money. Create a Creator Page to go public.
        </p>
      </div>

      <div className="flex border-b border-border">
        {(["posts", "photos", "friends"] as const).map((t) => (
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

      {tab === "friends" ? (
        <div className="space-y-2 p-4">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
              <img src={f.avatar} alt={f.name} className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{f.name}</p>
                <p className="truncate text-xs text-muted-foreground">@{f.handle}</p>
              </div>
              <button
                onClick={() => removeFriend(f.id)}
                aria-label={`Remove ${f.name}`}
                className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted-foreground"
              >
                <UserMinus className="h-4 w-4" />
              </button>
              <button
                onClick={() => blockFriend(f.id)}
                aria-label={`Block ${f.name}`}
                className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-destructive"
              >
                <Ban className="h-4 w-4" />
              </button>
            </div>
          ))}
          {friends.length === 0 && (
            <p className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Users className="h-6 w-6" /> No friends yet — accept a request to start chatting.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 p-1.5">
          {personalPosts.map((p, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl">
              <img src={p} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              {i === personalPosts.length - 1 && (
                <span className="absolute inset-0 grid place-items-center bg-black/60 text-lg font-semibold">
                  +23
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <AccountSwitcher open={switcher} onOpenChange={setSwitcher} />
    </AppShell>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-base font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

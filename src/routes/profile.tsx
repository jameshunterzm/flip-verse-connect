import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, UserPlus, MoreHorizontal, Users, Ban, UserMinus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProfileBannerAd } from "@/components/AdMobBanner";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { useFlip } from "@/lib/flip-store";
import { useFriendActions, useFriendRequests, useFriends, useMyPosts } from "@/lib/data";

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
  const { user, profile } = useFlip();
  const { data: friends = [] } = useFriends(user?.id);
  const { data: requests } = useFriendRequests(user?.id);
  const { data: posts = [] } = useMyPosts(user?.id, null);
  const { removeFriend, blockUser } = useFriendActions(user?.id);
  const [tab, setTab] = useState<"posts" | "friends">("posts");
  const [switcher, setSwitcher] = useState(false);
  const pending = requests?.received.length ?? 0;

  return (
    <AppShell>
      <div className="bg-glow relative px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex justify-end">
          <button onClick={() => setSwitcher(true)} aria-label="Account menu">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-4">
          <img
            src={profile?.avatar_url ?? undefined}
            alt=""
            className="h-20 w-20 rounded-full bg-surface-2 object-cover ring-2 ring-brand"
          />
          <div>
            <h1 className="flex items-center gap-1.5 text-lg font-bold">
              {profile?.display_name || profile?.username || "Your account"}
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </h1>
            <p className="text-sm text-muted-foreground">@{profile?.username ?? "you"}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-center">
          <Stat value={friends.length} label="Friends" />
          <Stat value={posts.length} label="Posts" />
        </div>

        {profile?.bio && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{profile.bio}</p>}

        <div className="mt-4 flex gap-2">
          <Link
            to="/profile/edit"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-surface py-2.5 text-sm font-medium"
          >
            Edit Profile
          </Link>
          <Link
            to="/requests"
            className="relative grid w-12 place-items-center rounded-2xl bg-surface"
            aria-label="Friend requests"
          >
            <UserPlus className="h-4 w-4" />
            {pending > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-brand-pink px-1.5 text-[10px] font-semibold">
                {pending}
              </span>
            )}
          </Link>
        </div>

        <p className="mt-3 rounded-xl bg-surface p-2.5 text-[11px] text-muted-foreground">
          Personal Accounts are private and can’t earn money. Create a Creator Page to go public.
        </p>
      </div>

      <div className="flex border-b border-border">
        {(["posts", "friends"] as const).map((t) => (
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
              <img src={f.avatar_url ?? undefined} alt="" className="h-10 w-10 rounded-full bg-surface-2 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{f.display_name || f.username}</p>
                <p className="truncate text-xs text-muted-foreground">@{f.username}</p>
              </div>
              <button
                onClick={() => removeFriend.mutate(f.id)}
                aria-label={`Remove ${f.username}`}
                className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted-foreground"
              >
                <UserMinus className="h-4 w-4" />
              </button>
              <button
                onClick={() => blockUser.mutate(f.id)}
                aria-label={`Block ${f.username}`}
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
          {posts.map((p) => (
            <div key={p.id} className="relative overflow-hidden rounded-xl">
              <img
                src={p.poster_url ?? p.media_url}
                alt=""
                loading="lazy"
                className="aspect-square w-full bg-surface-2 object-cover"
              />
            </div>
          ))}
          {posts.length === 0 && (
            <p className="col-span-3 py-12 text-center text-sm text-muted-foreground">
              No posts yet — tap + to share with friends.
            </p>
          )}
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

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { UserPlus, Heart, MessageCircle, Share2, Gift, BadgeCheck, UserCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";
import { timeAgo, useMarkNotificationsRead, useNotifications } from "@/lib/data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Flip Chat" },
      { name: "description", content: "Follows, friend requests, likes, comments, gifts and monetization updates." },
      { property: "og:title", content: "Flip Chat notifications" },
      { property: "og:description", content: "Everything happening across both sides of your account." },
    ],
  }),
  component: NotificationsPage,
});

const icons: Record<string, typeof Heart> = {
  follow: UserPlus,
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  like: Heart,
  comment: MessageCircle,
  share: Share2,
  gift: Gift,
  monetization: Sparkles,
};

function NotificationsPage() {
  const { user } = useFlip();
  const { data: items = [], isLoading } = useNotifications(user?.id);
  const markRead = useMarkNotificationsRead(user?.id);

  useEffect(() => {
    if (user && items.some((n) => !n.read)) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, items.length]);

  return (
    <AppShell>
      <TopBar title="Notifications" />
      <div className="space-y-1.5 p-4">
        {!user && <p className="text-sm text-muted-foreground">Sign in to see your notifications.</p>}
        {user && !isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing yet — follows, likes and requests land here.</p>
        )}
        {items.map((n) => {
          const Icon = icons[n.kind] ?? BadgeCheck;
          const highlight = n.kind === "monetization" || n.kind === "gift";
          return (
            <div
              key={n.id}
              className={`animate-rise flex items-center gap-3 rounded-2xl p-3 ${
                highlight ? "bg-surface-2 ring-brand" : "bg-surface"
              }`}
            >
              {n.actor?.avatar_url ? (
                <img src={n.actor.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-full text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
              )}
              <p className="flex-1 text-sm">
                {n.actor && <span className="font-semibold">@{n.actor.username} </span>}
                {n.body}
              </p>
              <span className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import {
  UserPlus,
  Heart,
  MessageCircle,
  Share2,
  Gift,
  BadgeCheck,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { notifications } from "@/lib/mock";

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

const icons = {
  follow: UserPlus,
  request: UserPlus,
  accepted: UserCheck,
  like: Heart,
  comment: MessageCircle,
  share: Share2,
  gift: Gift,
  monetization: Sparkles,
} as const;

function NotificationsPage() {
  return (
    <AppShell>
      <TopBar title="Notifications" />
      <div className="space-y-1.5 p-4">
        {notifications.map((n) => {
          const Icon = icons[n.type] ?? BadgeCheck;
          const highlight = n.type === "monetization" || n.type === "gift";
          return (
            <div
              key={n.id}
              className={`animate-rise flex items-center gap-3 rounded-2xl p-3 ${
                highlight ? "bg-surface-2 ring-brand" : "bg-surface"
              }`}
            >
              {n.avatar ? (
                <img src={n.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-full text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
              )}
              <p className="flex-1 text-sm">{n.text}</p>
              <span className="text-[11px] text-muted-foreground">{n.time}</span>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

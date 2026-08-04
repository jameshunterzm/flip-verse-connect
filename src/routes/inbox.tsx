import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Bell, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useFlip } from "@/lib/flip-store";
import { timeAgo, useFriendRequests, useThreads } from "@/lib/data";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Flip Chat" },
      { name: "description", content: "Private chats with accepted friends, friend requests and activity." },
      { property: "og:title", content: "Flip Chat Inbox" },
      { property: "og:description", content: "Chat only with friends you've accepted. No ads, ever." },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const { user } = useFlip();
  const { data: threads = [] } = useThreads(user?.id);
  const { data: requests } = useFriendRequests(user?.id);
  const [q, setQ] = useState("");
  const list = threads.filter((t) =>
    (t.person.display_name || t.person.username).toLowerCase().includes(q.toLowerCase()),
  );
  const pending = requests?.received.length ?? 0;

  return (
    <AppShell>
      <div className="bg-glow px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <Link to="/notifications" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Link>
        </div>
        <label className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search friends"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <div className="px-4 py-3">
        <Link
          to="/requests"
          className="mb-4 flex items-center gap-3 rounded-2xl bg-surface p-3 transition-colors hover:bg-surface-2"
        >
          <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-full text-primary-foreground">
            <UserPlus className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Friend requests</span>
            <span className="block text-xs text-muted-foreground">{pending} waiting for your reply</span>
          </span>
          {pending > 0 && (
            <span className="rounded-full bg-brand-pink px-2 py-0.5 text-[11px] font-semibold">{pending}</span>
          )}
        </Link>

        <div className="space-y-1">
          {list.map((t) => (
            <Link
              key={t.person.id}
              to="/chat/$threadId"
              params={{ threadId: t.person.id }}
              className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-surface"
            >
              <img
                src={t.person.avatar_url ?? undefined}
                alt=""
                className="h-12 w-12 rounded-full bg-surface-2 object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {t.person.display_name || t.person.username}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t.last?.body ?? "Say hi 👋"}
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                {t.last ? timeAgo(t.last.created_at) : ""}
              </span>
              {t.unread > 0 && <span className="h-2 w-2 rounded-full bg-brand-pink" />}
            </Link>
          ))}
          {list.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No conversations yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

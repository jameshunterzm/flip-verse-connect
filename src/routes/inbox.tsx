import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Bell, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useFlip } from "@/lib/flip-store";

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
  const { threads, requests } = useFlip();
  const [q, setQ] = useState("");
  const list = threads.filter((t) => t.person.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <div className="bg-glow px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <Link to="/notifications" aria-label="Notifications" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-pink" />
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
            <span className="block text-xs text-muted-foreground">
              {requests.length} waiting for your reply
            </span>
          </span>
          {requests.length > 0 && (
            <span className="rounded-full bg-brand-pink px-2 py-0.5 text-[11px] font-semibold">
              {requests.length}
            </span>
          )}
        </Link>

        <div className="space-y-1">
          {list.map((t) => {
            const last = t.messages[t.messages.length - 1];
            return (
              <Link
                key={t.id}
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-surface"
              >
                <span className="relative">
                  <img src={t.person.avatar} alt={t.person.name} className="h-12 w-12 rounded-full object-cover" />
                  {t.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-success" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{t.person.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.typing ? (
                      <span className="text-brand-cyan">typing…</span>
                    ) : (
                      (last?.text ?? "Say hi 👋")
                    )}
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground">{last?.time ?? ""}</span>
              </Link>
            );
          })}
          {list.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No conversations yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

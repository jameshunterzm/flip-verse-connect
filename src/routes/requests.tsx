import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";
import { useFriendActions, useFriendRequests } from "@/lib/data";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "Friend Requests — Flip Chat" },
      { name: "description", content: "Accept or decline friend requests to unlock private chat on Flip Chat." },
      { property: "og:title", content: "Friend requests on Flip Chat" },
      { property: "og:description", content: "Chat opens only after both people agree." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { user } = useFlip();
  const { data } = useFriendRequests(user?.id);
  const { accept, decline } = useFriendActions(user?.id);
  const [tab, setTab] = useState<"received" | "sent">("received");

  const received = data?.received ?? [];
  const sent = data?.sent ?? [];
  const list = tab === "received" ? received : sent;

  return (
    <AppShell>
      <TopBar title="Friend Requests" back="/inbox" />
      <div className="flex gap-6 border-b border-border px-4">
        {(["received", "sent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative py-3 text-sm capitalize ${
              tab === t ? "font-semibold text-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
            {t === "received" && received.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-pink px-1.5 text-[10px] font-semibold">
                {received.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2 p-4">
        {list.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            <img
              src={r.person?.avatar_url ?? undefined}
              alt=""
              className="h-11 w-11 rounded-full bg-surface-2 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {r.person?.display_name || r.person?.username}
              </p>
              <p className="truncate text-xs text-muted-foreground">@{r.person?.username}</p>
            </div>
            {tab === "received" ? (
              <>
                <button
                  onClick={() => accept.mutate(r.id)}
                  className="bg-gradient-brand rounded-full px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Accept
                </button>
                <button
                  onClick={() => decline.mutate(r.id)}
                  className="rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  Decline
                </button>
              </>
            ) : (
              <button
                onClick={() => decline.mutate(r.id)}
                className="rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground"
              >
                Cancel
              </button>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nothing here yet.</p>
        )}
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";

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
  const { requests, sent, acceptRequest, declineRequest } = useFlip();
  const [tab, setTab] = useState<"received" | "sent">("received");

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
            {t === "received" && requests.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-pink px-1.5 text-[10px] font-semibold">
                {requests.length}
              </span>
            )}
            {tab === t && <span className="bg-gradient-brand absolute inset-x-0 bottom-0 h-0.5 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="space-y-2 p-4">
        {(tab === "received" ? requests : sent).map((p) => (
          <div key={p.id} className="animate-rise flex items-center gap-3 rounded-2xl bg-surface p-3">
            <img src={p.avatar} alt={p.name} className="h-11 w-11 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {tab === "received" ? "Wants to be your friend" : "Request sent"}
              </p>
            </div>
            {tab === "received" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => acceptRequest(p.id)}
                  className="bg-gradient-brand rounded-full px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Accept
                </button>
                <button
                  onClick={() => declineRequest(p.id)}
                  className="rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  Decline
                </button>
              </div>
            ) : (
              <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground">Pending</span>
            )}
          </div>
        ))}
        {(tab === "received" ? requests : sent).length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nothing here right now.</p>
        )}
      </div>
    </AppShell>
  );
}

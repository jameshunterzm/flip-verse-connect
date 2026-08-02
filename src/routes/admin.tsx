import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Flag, Star, Trash2, Users, DollarSign, Megaphone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import {
  adminMonetizationQueue,
  adminReports,
  adminUsers,
  monetization,
  platformStats,
} from "@/lib/mock";
import { useFlip } from "@/lib/flip-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Flip Chat" },
      { name: "description", content: "Moderate users, creator pages, reports, ads and monetization approvals." },
      { property: "og:title", content: "Flip Chat admin dashboard" },
      { property: "og:description", content: "Platform analytics, moderation queue and advertising controls." },
    ],
  }),
  component: AdminPage,
});

const tabs = ["Overview", "Users", "Reports", "Ads", "Monetization"] as const;

function AdminPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const { adFrequency, setAdFrequency } = useFlip();
  const [share, setShare] = useState(monetization.revenueShare);
  const [users, setUsers] = useState(adminUsers);
  const [reports, setReports] = useState(adminReports);
  const [queue, setQueue] = useState(adminMonetizationQueue);

  return (
    <AppShell>
      <TopBar title="Admin Dashboard" back="/settings" />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              tab === t ? "bg-gradient-brand text-primary-foreground" : "bg-surface text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4 px-4 pb-4">
        {tab === "Overview" && (
          <div className="grid grid-cols-2 gap-2">
            {platformStats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-xl font-bold">{s.value}</p>
                <p className={`text-xs ${s.delta.startsWith("-") ? "text-destructive" : "text-success"}`}>
                  {s.delta}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "Users" && (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="rounded-2xl bg-surface p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="flex-1 text-sm font-semibold">
                    {u.name} {u.verified && <BadgeCheck className="inline h-3.5 w-3.5 text-brand-cyan" />}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      u.status === "Active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {u.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  @{u.handle} · {u.creator ? "Creator Page" : "Personal only"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip
                    label={u.verified ? "Unverify" : "Verify"}
                    onClick={() =>
                      setUsers((list) =>
                        list.map((x) => (x.id === u.id ? { ...x, verified: !x.verified } : x)),
                      )
                    }
                  />
                  <Chip label="Feature" />
                  <Chip
                    label={u.status === "Active" ? "Suspend" : "Reinstate"}
                    danger={u.status === "Active"}
                    onClick={() =>
                      setUsers((list) =>
                        list.map((x) =>
                          x.id === u.id ? { ...x, status: x.status === "Active" ? "Suspended" : "Active" } : x,
                        ),
                      )
                    }
                  />
                  <Chip label="Ban" danger />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Reports" && (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="rounded-2xl bg-surface p-3">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-brand-pink" />
                  <p className="flex-1 text-sm font-semibold">{r.target}</p>
                  <span className="text-[11px] text-muted-foreground">{r.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.reason} · reported by {r.reporter}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <Chip label="Dismiss" onClick={() => setReports((l) => l.filter((x) => x.id !== r.id))} />
                  <Chip
                    label="Remove content"
                    danger
                    onClick={() => setReports((l) => l.filter((x) => x.id !== r.id))}
                  />
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Queue is clear 🎉</p>
            )}
          </div>
        )}

        {tab === "Ads" && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-surface p-4">
              <div className="mb-2 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-brand-cyan" />
                <p className="flex-1 text-sm font-semibold">Ad frequency</p>
                <span className="text-sm font-bold">every {adFrequency}</span>
              </div>
              <input
                type="range"
                min={5}
                max={10}
                value={adFrequency}
                onChange={(e) => setAdFrequency(Number(e.target.value))}
                className="w-full accent-[var(--brand-pink)]"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                One sponsored clip after every {adFrequency} public videos. Ads never appear in personal feeds,
                chats, friend requests or settings.
              </p>
            </div>

            <div className="rounded-2xl bg-surface p-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-brand-pink" />
                <p className="flex-1 text-sm font-semibold">Creator revenue share</p>
                <span className="text-sm font-bold">{share}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={80}
                value={share}
                onChange={(e) => setShare(Number(e.target.value))}
                className="w-full accent-[var(--brand-pink)]"
              />
            </div>

            <div className="rounded-2xl bg-surface p-3">
              <p className="text-sm font-semibold">Pending ad reviews</p>
              <div className="mt-2 space-y-2">
                {["Volt Runners — Shop Now", "Nova Bank — Learn More"].map((a) => (
                  <div key={a} className="flex items-center gap-2 rounded-xl bg-surface-2 p-2.5">
                    <p className="flex-1 text-xs">{a}</p>
                    <Chip label="Approve" />
                    <Chip label="Reject" danger />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "Monetization" && (
          <div className="space-y-2">
            {queue.map((q) => (
              <div key={q.id} className="rounded-2xl bg-surface p-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-brand-pink" />
                  <p className="flex-1 text-sm font-semibold">{q.page}</p>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px]">{q.program}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {q.followers} followers · {q.views}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <Chip label="Approve" onClick={() => setQueue((l) => l.filter((x) => x.id !== q.id))} />
                  <Chip label="Reject" danger onClick={() => setQueue((l) => l.filter((x) => x.id !== q.id))} />
                  <Chip label="Remove video" />
                </div>
              </div>
            ))}
            {queue.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No pending approvals.</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Chip({ label, danger, onClick }: { label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium ${
        danger ? "bg-destructive/15 text-destructive" : "bg-surface-2 text-foreground"
      }`}
    >
      {danger && <Trash2 className="h-3 w-3" />}
      {label}
    </button>
  );
}

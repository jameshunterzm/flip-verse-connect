import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";
import { compact, useAdminActions, useAdminData, usePlatformSettings } from "@/lib/data";
import { useAdminApplications, useReviewApplication } from "@/lib/monetization";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Flip Chat" },
      { name: "description", content: "Moderate users, creator pages, reports, ads and platform settings." },
      { property: "og:title", content: "Flip Chat admin" },
      { property: "og:description", content: "Platform analytics, moderation and monetization controls." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useFlip();
  const { data } = useAdminData(isAdmin);
  const { data: settings } = usePlatformSettings();
  const { setSettings, setAdStatus, updatePage, suspendUser, resolveReport } = useAdminActions();

  if (!isAdmin) {
    return (
      <AppShell>
        <TopBar title="Admin" back="/settings" />
        <p className="p-8 text-center text-sm text-muted-foreground">
          You need an administrator role to view this dashboard.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar title="Admin dashboard" back="/settings" />
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Users" value={compact(data?.profiles.length ?? 0)} />
          <Metric label="Creator pages" value={compact(data?.pages.length ?? 0)} />
          <Metric label="Posts" value={compact(data?.totalPosts ?? 0)} />
          <Metric label="Total views" value={compact(data?.totalViews ?? 0)} />
        </div>

        <Section title="Ad settings">
          <Slider
            label="Ad frequency (1 ad every N videos)"
            value={settings?.ad_frequency ?? 6}
            min={5}
            max={10}
            onChange={(v) => setSettings.mutate({ ad_frequency: v })}
          />
          <Slider
            label="Gift revenue share (%)"
            value={settings?.gift_revenue_share ?? 70}
            min={0}
            max={100}
            onChange={(v) => setSettings.mutate({ gift_revenue_share: v })}
          />
          <Slider
            label="Ad revenue share (%)"
            value={settings?.ad_revenue_share ?? 55}
            min={0}
            max={100}
            onChange={(v) => setSettings.mutate({ ad_revenue_share: v })}
          />
        </Section>

        <Section title="Advertisements">
          {(data?.ads ?? []).map((ad) => (
            <div key={ad.id} className="flex items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{ad.title}</p>
                <p className="text-xs text-muted-foreground">
                  {ad.advertiser} · {ad.status}
                </p>
              </div>
              <button
                onClick={() => setAdStatus.mutate({ id: ad.id, status: "approved" })}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs text-brand-cyan"
              >
                Approve
              </button>
              <button
                onClick={() => setAdStatus.mutate({ id: ad.id, status: "rejected" })}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs text-destructive"
              >
                Reject
              </button>
            </div>
          ))}
          {(data?.ads.length ?? 0) === 0 && <Empty>No ads submitted.</Empty>}
        </Section>

        <Section title="Reports">
          {(data?.reports ?? []).map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-3 py-3">
              <p className="min-w-0 flex-1 truncate text-sm">{r.reason}</p>
              {!r.resolved && (
                <button
                  onClick={() => resolveReport.mutate(r.id)}
                  className="rounded-full bg-surface-2 px-3 py-1 text-xs text-brand-cyan"
                >
                  Resolve
                </button>
              )}
            </div>
          ))}
          {(data?.reports.length ?? 0) === 0 && <Empty>No open reports.</Empty>}
        </Section>

        <Section title="Creator pages">
          {(data?.pages ?? []).map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">@{p.handle}</p>
              </div>
              <button
                onClick={() => updatePage.mutate({ id: p.id, patch: { verified: !p.verified } })}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs text-brand-cyan"
              >
                {p.verified ? "Unverify" : "Verify"}
              </button>
              <button
                onClick={() => updatePage.mutate({ id: p.id, patch: { featured: !p.featured } })}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs"
              >
                {p.featured ? "Unfeature" : "Feature"}
              </button>
              <button
                onClick={() => updatePage.mutate({ id: p.id, patch: { suspended: !p.suspended } })}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs text-destructive"
              >
                {p.suspended ? "Restore" : "Suspend"}
              </button>
            </div>
          ))}
        </Section>

        <Section title="Users">
          {(data?.profiles ?? []).map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.display_name || u.username}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
              <button
                onClick={() => suspendUser.mutate({ id: u.id, suspended: !u.suspended })}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs text-destructive"
              >
                {u.suspended ? "Unsuspend" : "Suspend"}
              </button>
            </div>
          ))}
        </Section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-3 text-sm text-muted-foreground">{children}</p>;
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="px-3 py-3">
      <p className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold text-brand-pink">{value}</span>
      </p>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--brand)]"
      />
    </div>
  );
}

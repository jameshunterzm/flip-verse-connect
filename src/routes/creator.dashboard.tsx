import { createFileRoute } from "@tanstack/react-router";
import { Gift, Megaphone, TrendingUp, Clock, Eye, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { compact, creatorVideos, futureFeatures, monetization } from "@/lib/mock";

export const Route = createFileRoute("/creator/dashboard")({
  head: () => ({
    meta: [
      { title: "Creator Dashboard — Flip Chat" },
      { name: "description", content: "Followers, views, watch time, gift and ad earnings, and monetization progress." },
      { property: "og:title", content: "Creator Dashboard on Flip Chat" },
      { property: "og:description", content: "Track eligibility for the Gifts and Ads programs and your earnings." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const m = monetization;
  const giftsEligible =
    m.gifts.followers.current >= m.gifts.followers.target && m.gifts.views.current >= m.gifts.views.target;
  const adsEligible =
    m.ads.followers.current >= m.ads.followers.target && m.ads.views.current >= m.ads.views.target;

  return (
    <AppShell>
      <TopBar title="Creator Dashboard" back="/creator" />
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Metric icon={Users} label="Followers" value={compact(m.ads.followers.current)} />
          <Metric icon={Eye} label="Views (90d)" value={compact(m.ads.views.current)} />
          <Metric icon={Clock} label="Watch time" value={m.watchTime} />
          <Metric icon={TrendingUp} label="Rev. share" value={`${m.revenueShare}%`} />
        </div>

        <div className="bg-gradient-brand-3 shadow-glow rounded-3xl p-[1px]">
          <div className="rounded-3xl bg-surface p-4">
            <p className="text-xs text-muted-foreground">Estimated earnings · {m.earnings.month}</p>
            <p className="mt-1 text-3xl font-bold">${m.earnings.total.toLocaleString()}</p>
            <div className="mt-3 flex gap-4 text-xs">
              <span className="text-muted-foreground">
                Gifts <span className="ml-1 font-semibold text-foreground">${m.earnings.gifts.toLocaleString()}</span>
              </span>
              <span className="text-muted-foreground">
                Ads <span className="ml-1 font-semibold text-foreground">${m.earnings.ads.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>

        <Program
          icon={Gift}
          title="Gifts Program"
          eligible={giftsEligible}
          rows={[
            { label: "1,000 Followers", current: m.gifts.followers.current, target: m.gifts.followers.target },
            {
              label: `500K Views (${m.gifts.views.window})`,
              current: m.gifts.views.current,
              target: m.gifts.views.target,
            },
          ]}
        />

        <Program
          icon={Megaphone}
          title="Ads Program"
          eligible={adsEligible}
          rows={[
            { label: "10K Followers", current: m.ads.followers.current, target: m.ads.followers.target },
            {
              label: `5M Views (${m.ads.views.window})`,
              current: m.ads.views.current,
              target: m.ads.views.target,
            },
          ]}
        />

        <p className="rounded-2xl bg-surface p-3 text-[11px] text-muted-foreground">
          Creators don’t earn for watching ads. Eligible Creator Pages earn a share of ad revenue generated
          around their public videos.
        </p>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Top-performing videos</h2>
          <div className="space-y-2">
            {creatorVideos.slice(0, 4).map((v, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-surface p-2.5">
                <img src={v.poster} alt="" loading="lazy" className="h-14 w-10 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Clip #{i + 1}</p>
                  <p className="text-xs text-muted-foreground">{v.views} views</p>
                </div>
                <span className="text-xs text-success">+{12 - i * 2}%</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Coming soon</h2>
          <div className="flex flex-wrap gap-2">
            {futureFeatures.map((f) => (
              <span key={f} className="rounded-full bg-surface px-3 py-1.5 text-[11px] text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3">
      <Icon className="mb-1.5 h-4 w-4 text-brand-cyan" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Program({
  icon: Icon,
  title,
  eligible,
  rows,
}: {
  icon: typeof Gift;
  title: string;
  eligible: boolean;
  rows: { label: string; current: number; target: number }[];
}) {
  return (
    <div className="rounded-3xl bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="bg-gradient-brand grid h-8 w-8 place-items-center rounded-xl text-primary-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="flex-1 text-sm font-semibold">{title}</h2>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            eligible ? "bg-success/15 text-success" : "bg-surface-2 text-muted-foreground"
          }`}
        >
          {eligible ? "Eligible ✓" : "In progress"}
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((r) => {
          const pct = Math.min(100, (r.current / r.target) * 100);
          return (
            <div key={r.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">{r.label}</span>
                <span>
                  {compact(r.current)} / {compact(r.target)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="bg-gradient-brand-3 h-full rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

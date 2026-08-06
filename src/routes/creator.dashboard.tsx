import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Megaphone, TrendingUp, Clock, Eye, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";
import { compact, useMyPosts, usePageStats, usePlatformSettings } from "@/lib/data";
import {
  PROGRAM_RULES,
  isEligible,
  useApplyForProgram,
  useMonetizationStats,
  useMyApplications,
  type Program as ProgramKey,
} from "@/lib/monetization";

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

const futureFeatures = [
  "Live streaming",
  "Stories",
  "AI captions",
  "AI moderation",
  "Subscriptions",
  "Collaborations",
  "Music library",
  "Marketplace",
  "Premium memberships",
];

function DashboardPage() {
  const { user, creatorPage } = useFlip();
  const { data: stats } = usePageStats(creatorPage?.id);
  const { data: posts = [] } = useMyPosts(user?.id, creatorPage?.id);
  const { data: settings } = usePlatformSettings();
  const { data: mon } = useMonetizationStats(creatorPage?.id);
  const { data: apps = [] } = useMyApplications(creatorPage?.id);
  const apply = useApplyForProgram(creatorPage?.id, user?.id);

  const followers = stats?.followers ?? 0;
  const views = stats?.views ?? 0;
  const watchTime = `${compact(Math.round(mon?.watchHours ?? 0))}h`;

  const giftsEligible = isEligible("gifts", mon);
  const adsEligible = isEligible("ads", mon);
  const appFor = (program: ProgramKey) => apps.find((a) => a.program === program) ?? null;
  const giftsApproved = appFor("gifts")?.status === "approved";
  const adsApproved = appFor("ads")?.status === "approved";

  const giftShare = (settings?.gift_revenue_share ?? 70) / 100;
  const adShare = (settings?.ad_revenue_share ?? 55) / 100;
  // Estimated payouts: RPM-style model applied to approved, eligible public views.
  const giftEarnings = giftsApproved ? Math.round((views / 1000) * 0.4 * giftShare) : 0;
  const adEarnings = adsApproved ? Math.round((views / 1000) * 1.8 * adShare) : 0;

  const top = [...posts].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)).slice(0, 4);

  if (!creatorPage) {
    return (
      <AppShell>
        <TopBar title="Creator Dashboard" back="/creator" />
        <div className="p-4">
          <p className="rounded-2xl bg-surface p-4 text-sm text-muted-foreground">
            You don’t have a Creator Page yet.{" "}
            <Link to="/creator" className="text-brand-cyan underline">
              Create one
            </Link>{" "}
            to unlock public posting and monetization.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar title="Creator Dashboard" back="/creator" />
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Metric icon={Users} label="Followers" value={compact(followers)} />
          <Metric icon={Eye} label="Total views" value={compact(views)} />
          <Metric icon={Clock} label="Watch time" value={watchTime} />
          <Metric icon={TrendingUp} label="Rev. share" value={`${settings?.ad_revenue_share ?? 55}%`} />
        </div>

        <div className="bg-gradient-brand-3 shadow-glow rounded-3xl p-[1px]">
          <div className="rounded-3xl bg-surface p-4">
            <p className="text-xs text-muted-foreground">Estimated earnings</p>
            <p className="mt-1 text-3xl font-bold">${(giftEarnings + adEarnings).toLocaleString()}</p>
            <div className="mt-3 flex gap-4 text-xs">
              <span className="text-muted-foreground">
                Gifts <span className="ml-1 font-semibold text-foreground">${giftEarnings.toLocaleString()}</span>
              </span>
              <span className="text-muted-foreground">
                Ads <span className="ml-1 font-semibold text-foreground">${adEarnings.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>

        <Program
          icon={Gift}
          title="Gifts, donations & memberships"
          eligible={giftsEligible}
          status={appFor("gifts")?.status ?? null}
          onApply={() => apply.mutate("gifts")}
          applying={apply.isPending}
          rows={[
            { label: "2,000 Followers", current: followers, target: PROGRAM_RULES.gifts.followers },
            {
              label: "4,000 watch hours (12 months)",
              current: Math.round(mon?.watchHours ?? 0),
              target: PROGRAM_RULES.gifts.watchHours,
            },
            {
              label: "or 5M short views (3 months)",
              current: mon?.shortViews ?? 0,
              target: PROGRAM_RULES.gifts.shortViews,
            },
          ]}
        />

        <Program
          icon={Megaphone}
          title="Ads Program"
          eligible={adsEligible}
          status={appFor("ads")?.status ?? null}
          onApply={() => apply.mutate("ads")}
          applying={apply.isPending}
          rows={[
            { label: "7,000 Followers", current: followers, target: PROGRAM_RULES.ads.followers },
            {
              label: "6,000 watch hours (12 months)",
              current: Math.round(mon?.watchHours ?? 0),
              target: PROGRAM_RULES.ads.watchHours,
            },
            {
              label: "or 12M short views (3 months)",
              current: mon?.shortViews ?? 0,
              target: PROGRAM_RULES.ads.shortViews,
            },
          ]}
        />

        <p className="rounded-2xl bg-surface p-3 text-[11px] text-muted-foreground">
          Creators don’t earn for watching ads. Eligible Creator Pages earn a share of ad revenue generated around
          their public videos.
        </p>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Top-performing videos</h2>
          <div className="space-y-2">
            {top.map((v) => (
              <Link
                key={v.id}
                to="/watch/$postId"
                params={{ postId: v.id }}
                className="flex items-center gap-3 rounded-2xl bg-surface p-2.5"
              >
                <img
                  src={v.poster_url ?? v.media_url}
                  alt=""
                  loading="lazy"
                  className="h-14 w-10 rounded-lg bg-surface-2 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.caption || "Untitled clip"}</p>
                  <p className="text-xs text-muted-foreground">{compact(v.views_count ?? 0)} views</p>
                </div>
                <span className="text-xs text-muted-foreground">{v.format === "long" ? "Long" : "Short"}</span>
              </Link>
            ))}
            {top.length === 0 && <p className="text-sm text-muted-foreground">Post a public video to see analytics.</p>}
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
  status,
  onApply,
  applying,
  rows,
}: {
  icon: typeof Gift;
  title: string;
  eligible: boolean;
  status: "pending" | "approved" | "rejected" | null;
  onApply: () => void;
  applying: boolean;
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

      <div className="mt-4">
        {status === "approved" ? (
          <p className="rounded-2xl bg-success/15 px-3 py-2.5 text-xs font-semibold text-success">
            Approved — you're earning from this program.
          </p>
        ) : status === "pending" ? (
          <p className="rounded-2xl bg-surface-2 px-3 py-2.5 text-xs text-muted-foreground">
            Application under review by the Flip Chat team.
          </p>
        ) : (
          <>
            <button
              disabled={!eligible || applying}
              onClick={onApply}
              className="bg-gradient-brand w-full rounded-2xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {applying ? "Sending…" : status === "rejected" ? "Apply again" : "Apply to join"}
            </button>
            {!eligible && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Meet the follower target and one of the watch-time or views targets to apply.
              </p>
            )}
            {status === "rejected" && (
              <p className="mt-2 text-center text-[11px] text-destructive">Your last application was declined.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Ban, Lock, Eye, Shield, LogOut, ChevronRight, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Flip Chat" },
      { name: "description", content: "Privacy, notifications, blocked accounts and Creator Page management." },
      { property: "og:title", content: "Flip Chat settings" },
      { property: "og:description", content: "Control who can see your posts, message you and follow you." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { privacy, setPrivacy, blocked, hasCreatorPage, deleteCreatorPage } = useFlip();

  return (
    <AppShell>
      <TopBar title="Settings" back="/profile" />
      <div className="space-y-6 p-4">
        <Group title="Privacy">
          <Toggle
            icon={Lock}
            label="Private account"
            sub="Only accepted friends see your posts"
            value={privacy.privateAccount}
            onChange={(v) => setPrivacy("privateAccount", v)}
          />
          <Toggle
            icon={Eye}
            label="Friends-only comments"
            sub="Limit comments on personal posts"
            value={privacy.friendsOnlyComments}
            onChange={(v) => setPrivacy("friendsOnlyComments", v)}
          />
          <Toggle
            icon={Bell}
            label="Show online status"
            sub="Friends can see when you're active"
            value={privacy.showOnline}
            onChange={(v) => setPrivacy("showOnline", v)}
          />
        </Group>

        <Group title="Blocked accounts">
          {blocked.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No blocked accounts.</p>
          ) : (
            blocked.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-3 py-3">
                <img src={b.avatar} alt={b.name} className="h-9 w-9 rounded-full object-cover" />
                <p className="flex-1 text-sm">{b.name}</p>
                <Ban className="h-4 w-4 text-destructive" />
              </div>
            ))
          )}
        </Group>

        <Group title="Creator">
          <Link to="/creator/dashboard" className="flex items-center gap-3 px-3 py-3.5 text-sm">
            <Star className="h-4 w-4 text-brand-pink" />
            <span className="flex-1">Manage Creator Page</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          {hasCreatorPage && (
            <button onClick={deleteCreatorPage} className="flex w-full items-center gap-3 px-3 py-3.5 text-sm text-destructive">
              <Ban className="h-4 w-4" />
              <span className="flex-1 text-left">Delete Creator Page</span>
            </button>
          )}
        </Group>

        <Group title="Admin">
          <Link to="/admin" className="flex items-center gap-3 px-3 py-3.5 text-sm">
            <Shield className="h-4 w-4 text-brand-cyan" />
            <span className="flex-1">Admin dashboard</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </Group>

        <Link
          to="/auth"
          className="flex items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 text-sm font-medium text-destructive"
        >
          <LogOut className="h-4 w-4" /> Log out
        </Link>
      </div>
    </AppShell>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">{children}</div>
    </section>
  );
}

function Toggle({
  icon: Icon,
  label,
  sub,
  value,
  onChange,
}: {
  icon: typeof Lock;
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center gap-3 px-3 py-3.5 text-left">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">
        <span className="block text-sm">{label}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          value ? "bg-gradient-brand" : "bg-surface-2"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            value ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

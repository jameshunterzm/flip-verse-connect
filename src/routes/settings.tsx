import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, Ban, Lock, Eye, Shield, LogOut, ChevronRight, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";
import { useBlocked, useFriendActions } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

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
  const { user, profile, creatorPage, hasCreatorPage, isAdmin, refresh, signOut } = useFlip();
  const { data: blocked = [] } = useBlocked(user?.id);
  const { unblock } = useFriendActions(user?.id);
  const navigate = useNavigate();

  const setPrivacy = async (key: "private_account" | "friends_only_comments" | "show_online", value: boolean) => {
    if (!user) return;
    await supabase.from("profiles").update({ [key]: value }).eq("id", user.id);
    await refresh();
  };

  return (
    <AppShell>
      <TopBar title="Settings" back="/profile" />
      <div className="space-y-6 p-4">
        <Group title="Privacy">
          <Toggle
            icon={Lock}
            label="Private account"
            sub="Only accepted friends see your posts"
            value={profile?.private_account ?? true}
            onChange={(v) => void setPrivacy("private_account", v)}
          />
          <Toggle
            icon={Eye}
            label="Friends-only comments"
            sub="Limit comments on personal posts"
            value={profile?.friends_only_comments ?? true}
            onChange={(v) => void setPrivacy("friends_only_comments", v)}
          />
          <Toggle
            icon={Bell}
            label="Show online status"
            sub="Friends can see when you're active"
            value={profile?.show_online ?? true}
            onChange={(v) => void setPrivacy("show_online", v)}
          />
        </Group>

        <Group title="Blocked accounts">
          {blocked.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No blocked accounts.</p>
          ) : (
            blocked.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-3 py-3">
                <img src={b.avatar_url ?? undefined} alt="" className="h-9 w-9 rounded-full bg-surface-2 object-cover" />
                <p className="flex-1 text-sm">{b.display_name || b.username}</p>
                <button onClick={() => unblock.mutate(b.id)} className="text-xs text-brand-cyan">
                  Unblock
                </button>
              </div>
            ))
          )}
        </Group>

        <Group title="Creator">
          <Link to="/creator" className="flex items-center gap-3 px-3 py-3.5 text-sm">
            <Star className="h-4 w-4 text-brand-pink" />
            <span className="flex-1">{hasCreatorPage ? "Manage Creator Page" : "Create Creator Page"}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          {hasCreatorPage && creatorPage && (
            <button
              onClick={async () => {
                if (!window.confirm("Delete your Creator Page? Public posts will be removed.")) return;
                await supabase.from("creator_pages").delete().eq("id", creatorPage.id);
                await refresh();
              }}
              className="flex w-full items-center gap-3 px-3 py-3.5 text-sm text-destructive"
            >
              <Ban className="h-4 w-4" />
              <span className="flex-1 text-left">Delete Creator Page</span>
            </button>
          )}
        </Group>

        {isAdmin && (
          <Group title="Admin">
            <Link to="/admin" className="flex items-center gap-3 px-3 py-3.5 text-sm">
              <Shield className="h-4 w-4 text-brand-cyan" />
              <span className="flex-1">Admin dashboard</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Group>
        )}

        <button
          onClick={() => void signOut().then(() => navigate({ to: "/auth" }))}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 text-sm font-medium text-destructive"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
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
    <div className="flex items-center gap-3 px-3 py-3.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`h-6 w-11 rounded-full p-0.5 transition-colors ${value ? "bg-gradient-brand" : "bg-surface-2"}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}

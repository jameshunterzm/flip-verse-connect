import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Plus, MessageSquare, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AccountSwitcher } from "./AccountSwitcher";
import { useFlip } from "@/lib/flip-store";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/inbox", label: "Inbox", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({
  children,
  dark = false,
}: {
  children: ReactNode;
  /** Immersive screens (feed) sit under a transparent nav. */
  dark?: boolean;
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const navigate = useNavigate();
  const { mode } = useFlip();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background">
      <main className={dark ? "flex-1" : "flex-1 pb-24"}>{children}</main>

      <nav
        className={`fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] items-center justify-around px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 ${
          dark ? "bg-gradient-to-t from-black/85 to-transparent" : "glass-strong"
        }`}
      >
        {tabs.slice(0, 2).map((t) => (
          <NavItem key={t.to} {...t} active={pathname === t.to} />
        ))}

        <button
          type="button"
          onClick={() => navigate({ to: "/create" })}
          aria-label="Create"
          className="bg-gradient-brand shadow-glow -mt-1 grid h-11 w-14 place-items-center rounded-2xl text-primary-foreground transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>

        {tabs.slice(2).map((t) =>
          t.to === "/profile" ? (
            <button
              key={t.to}
              type="button"
              onClick={() => navigate({ to: mode === "creator" ? "/creator" : "/profile" })}
              onContextMenu={(e) => {
                e.preventDefault();
                setSwitcherOpen(true);
              }}
              className={`flex w-16 flex-col items-center gap-1 py-1 text-[10px] ${
                pathname === "/profile" || pathname === "/creator"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <User className="h-5 w-5" />
              Profile
            </button>
          ) : (
            <NavItem key={t.to} {...t} active={pathname.startsWith(t.to)} />
          ),
        )}
      </nav>

      <AccountSwitcher open={switcherOpen} onOpenChange={setSwitcherOpen} />
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex w-16 flex-col items-center gap-1 py-1 text-[10px] transition-colors ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_var(--brand)]" : ""}`} />
      {label}
    </Link>
  );
}

import { useNavigate } from "@tanstack/react-router";
import { Settings, Star, User, LogOut, X, Shield } from "lucide-react";
import { useFlip } from "@/lib/flip-store";

export function AccountSwitcher({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { mode, setMode, hasCreatorPage, createCreatorPage } = useFlip();
  const navigate = useNavigate();
  if (!open) return null;

  const close = () => onOpenChange(false);
  const go = (to: string) => {
    close();
    navigate({ to });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 pb-6" onClick={close}>
      <div
        className="glass-strong animate-rise w-full max-w-[440px] rounded-3xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Switch Account</h2>
          <button onClick={close} aria-label="Close" className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => {
            setMode("personal");
            go("/profile");
          }}
          className={`mb-2 flex w-full items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left ${
            mode === "personal" ? "ring-brand" : ""
          }`}
        >
          <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-full text-primary-foreground">
            <User className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Personal Account</span>
            <span className="block text-xs text-muted-foreground">Private. Only friends.</span>
          </span>
        </button>

        {hasCreatorPage ? (
          <button
            onClick={() => {
              setMode("creator");
              go("/creator");
            }}
            className={`mb-2 flex w-full items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left ${
              mode === "creator" ? "ring-brand" : ""
            }`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-pink text-primary-foreground">
              <Star className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Creator Page</span>
              <span className="block text-xs text-muted-foreground">Public. Grow &amp; earn.</span>
            </span>
          </button>
        ) : (
          <button
            onClick={() => {
              createCreatorPage();
              setMode("creator");
              go("/creator");
            }}
            className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-dashed border-border p-3 text-left text-sm font-medium"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2">
              <Star className="h-5 w-5 text-brand-pink" />
            </span>
            Create your Creator Page
          </button>
        )}

        <div className="mt-2 space-y-1 border-t border-border pt-2 text-sm">
          <Row icon={Settings} label="Manage Creator Page" onClick={() => go("/creator/dashboard")} accent />
          <Row icon={Shield} label="Admin Dashboard" onClick={() => go("/admin")} />
          <Row icon={Settings} label="Settings" onClick={() => go("/settings")} />
          <Row icon={LogOut} label="Log out" onClick={() => go("/auth")} />
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: typeof Settings;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-2 ${
        accent ? "text-brand-pink" : "text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

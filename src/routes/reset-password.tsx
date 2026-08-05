import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Flip Chat" },
      { name: "description", content: "Choose a new password for your Flip Chat account." },
      { property: "og:title", content: "Reset your Flip Chat password" },
      { property: "og:description", content: "Set a new password and get back to flipping." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function save() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(err.message);
    else await navigate({ to: "/" });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-6">
      <div className="rounded-3xl bg-surface p-6 text-center">
        <KeyRound className="mx-auto h-8 w-8 text-brand-cyan" />
        <h1 className="mt-3 text-lg font-semibold">Set a new password</h1>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          className="mt-4 w-full rounded-2xl bg-surface-2 px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        {error && <p className="mt-2 text-xs text-brand-pink">{error}</p>}
        <button
          onClick={() => void save()}
          disabled={busy || password.length < 8}
          className="bg-gradient-brand mt-4 w-full rounded-2xl py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          Update password
        </button>
      </div>
    </div>
  );
}

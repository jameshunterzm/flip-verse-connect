import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import logo from "@/assets/flip-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useFlip } from "@/lib/flip-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Flip Chat" },
      { name: "description", content: "Sign up or log in to Flip Chat with email or Google and start flipping." },
      { property: "og:title", content: "Join Flip Chat" },
      { property: "og:description", content: "Flip Between Friends. Flip Into Fame." },
    ],
  }),
  component: AuthPage,
});

type Step = "signup" | "login" | "reset";

function AuthPage() {
  const [step, setStep] = useState<Step>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session } = useFlip();

  useEffect(() => {
    if (session) void navigate({ to: "/" });
  }, [session, navigate]);

  async function submit() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (step === "reset") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setMessage("Check your inbox for a password reset link.");
      } else if (step === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username || email.split("@")[0], display_name: username || email.split("@")[0] },
          },
        });
        if (err) throw err;
        if (data.session) await navigate({ to: "/" });
        else setMessage("Account created. Check your email to confirm, then log in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        await navigate({ to: "/" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (err) throw err;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-6 py-10">
      <div className="bg-glow pointer-events-none absolute inset-x-0 top-0 h-72" />

      <div className="relative text-center">
        <img src={logo.url} alt="Flip Chat" width={72} height={72} className="mx-auto rounded-2xl" />
        <h1 className="mt-4 text-3xl font-bold">
          Flip <span className="text-gradient-brand">Chat</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Flip Between Friends. Flip Into Fame.</p>
      </div>

      <div className="relative mt-8 space-y-3">
        <div className="flex rounded-2xl bg-surface p-1">
          {(["signup", "login"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium ${
                step === s ? "bg-gradient-brand text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {s === "signup" ? "Sign up" : "Log in"}
            </button>
          ))}
        </div>

        {step === "signup" && (
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        )}

        <label className="flex items-center gap-2 rounded-2xl bg-surface px-4">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>

        {step !== "reset" && (
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={step === "signup" ? "new-password" : "current-password"}
            placeholder="Password"
            className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        )}

        {error && <p className="text-xs text-brand-pink">{error}</p>}
        {message && <p className="text-xs text-brand-cyan">{message}</p>}

        <button
          onClick={() => void submit()}
          disabled={busy || !email}
          className="bg-gradient-brand shadow-glow flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {step === "signup" ? "Create account" : step === "login" ? "Log in" : "Send reset link"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <button
          onClick={() => setStep(step === "reset" ? "login" : "reset")}
          className="w-full text-center text-xs text-muted-foreground"
        >
          {step === "reset" ? "Back to log in" : "Forgot password?"}
        </button>

        <div className="flex items-center gap-3 py-1 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
        </div>

        <button onClick={() => void google()} className="w-full rounded-2xl bg-surface py-3.5 text-sm font-medium">
          Continue with Google
        </button>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          Every new account starts as a private Personal Account. You can add one Creator Page later to earn from ads.
        </p>
        <Link to="/" className="block text-center text-[11px] text-muted-foreground underline">
          Keep browsing without an account
        </Link>
      </div>
    </div>
  );
}

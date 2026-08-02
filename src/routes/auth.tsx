import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, ShieldCheck, ArrowRight } from "lucide-react";
import logo from "@/assets/flip-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Flip Chat" },
      { name: "description", content: "Sign up or log in to Flip Chat with email, Google or your phone number." },
      { property: "og:title", content: "Join Flip Chat" },
      { property: "og:description", content: "Flip Between Friends. Flip Into Fame." },
    ],
  }),
  component: AuthPage,
});

type Step = "signup" | "login" | "verify" | "reset";

function AuthPage() {
  const [step, setStep] = useState<Step>("signup");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const navigate = useNavigate();

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
        {step === "verify" ? (
          <div className="rounded-3xl bg-surface p-5 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-brand-cyan" />
            <h2 className="mt-3 text-base font-semibold">Verify your {method}</h2>
            <p className="mt-1 text-xs text-muted-foreground">We sent you a 6-digit code.</p>
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  maxLength={1}
                  inputMode="numeric"
                  aria-label={`Digit ${i + 1}`}
                  className="h-12 w-10 rounded-xl bg-surface-2 text-center text-lg outline-none focus:ring-brand"
                />
              ))}
            </div>
            <button
              onClick={() => navigate({ to: "/" })}
              className="bg-gradient-brand shadow-glow mt-5 w-full rounded-2xl py-3.5 text-sm font-semibold text-primary-foreground"
            >
              Confirm
            </button>
          </div>
        ) : (
          <>
            <div className="flex rounded-2xl bg-surface p-1">
              {(["signup", "login"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`flex-1 rounded-xl py-2 text-sm font-medium capitalize ${
                    step === s ? "bg-gradient-brand text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s === "signup" ? "Sign up" : "Log in"}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Method active={method === "email"} onClick={() => setMethod("email")} icon={Mail} label="Email" />
              <Method active={method === "phone"} onClick={() => setMethod("phone")} icon={Phone} label="Phone" />
            </div>

            <input
              placeholder={method === "email" ? "you@example.com" : "+1 555 000 1234"}
              className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            {step !== "reset" && (
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
              />
            )}

            <button
              onClick={() => setStep("verify")}
              className="bg-gradient-brand shadow-glow flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              {step === "signup" ? "Create account" : "Log in"} <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setStep("reset")}
              className="w-full text-center text-xs text-muted-foreground"
            >
              Forgot password?
            </button>

            <div className="flex items-center gap-3 py-1 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
            </div>

            <button className="w-full rounded-2xl bg-surface py-3.5 text-sm font-medium">
              Continue with Google
            </button>

            <p className="pt-2 text-center text-[11px] text-muted-foreground">
              Every new account starts as a private Personal Account. You can add one Creator Page later.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Method({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mail;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-sm ${
        active ? "bg-surface-2 ring-brand" : "bg-surface text-muted-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

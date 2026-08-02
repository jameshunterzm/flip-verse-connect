import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Film, Image as ImageIcon, Globe, Lock, Sparkles } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { AppShell } from "@/components/AppShell";
import { useFlip } from "@/lib/flip-store";
import { media } from "@/lib/mock";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create — Flip Chat" },
      { name: "description", content: "Post a short clip or image to your Personal Account or Creator Page." },
      { property: "og:title", content: "Create on Flip Chat" },
      { property: "og:description", content: "Share privately with friends or publicly as a creator." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const { mode, hasCreatorPage } = useFlip();
  const navigate = useNavigate();
  const [type, setType] = useState<"clip" | "image">("clip");
  const [audience, setAudience] = useState<"personal" | "creator">(mode);
  const [caption, setCaption] = useState("");

  return (
    <AppShell>
      <TopBar title="New post" />
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Choice active={type === "clip"} onClick={() => setType("clip")} icon={Film} label="Short clip" />
          <Choice active={type === "image"} onClick={() => setType("image")} icon={ImageIcon} label="Image" />
        </div>

        <div className="relative grid aspect-[9/16] max-h-[42vh] place-items-center overflow-hidden rounded-3xl border border-dashed border-border bg-surface">
          <img src={media.feed3} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="relative text-center">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-brand-pink" />
            <p className="text-sm font-medium">Tap to select from camera roll</p>
            <p className="text-xs text-muted-foreground">Up to 90 seconds · 9:16</p>
          </div>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="Say something… add #hashtags"
          className="w-full rounded-2xl bg-surface p-3 text-sm outline-none placeholder:text-muted-foreground"
        />

        <div className="grid grid-cols-2 gap-2">
          <Choice
            active={audience === "personal"}
            onClick={() => setAudience("personal")}
            icon={Lock}
            label="Friends only"
            sub="Personal Account"
          />
          <Choice
            active={audience === "creator"}
            onClick={() => hasCreatorPage && setAudience("creator")}
            icon={Globe}
            label="Public"
            sub={hasCreatorPage ? "Creator Page" : "Create a page first"}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {audience === "personal"
            ? "Private posts never show ads and are only visible to accepted friends."
            : "Public posts appear in Discover and the public feed, where ads may appear nearby."}
        </p>

        <button
          onClick={() => navigate({ to: audience === "creator" ? "/creator" : "/profile" })}
          className="bg-gradient-brand shadow-glow w-full rounded-2xl py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Post
        </button>
      </div>
    </AppShell>
  );
}

function Choice({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Film;
  label: string;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-3 text-left transition-colors ${
        active ? "bg-surface-2 ring-brand" : "bg-surface"
      }`}
    >
      <Icon className={`mb-1.5 h-4 w-4 ${active ? "text-brand-pink" : "text-muted-foreground"}`} />
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </button>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Film, Image as ImageIcon, Loader2, Scissors, Upload } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { AppShell } from "@/components/AppShell";
import { useFlip } from "@/lib/flip-store";
import { supabase } from "@/integrations/supabase/client";
import {
  LONG_MAX_SECONDS,
  SHORT_MAX_SECONDS,
  capturePoster,
  formatTime,
  maxSecondsFor,
  readVideoDuration,
  uploadToR2,
  type VideoFormat,
} from "@/lib/media";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create — Flip Chat" },
      { name: "description", content: "Upload a short clip, a long-form video or an image and trim it before posting." },
      { property: "og:title", content: "Create on Flip Chat" },
      { property: "og:description", content: "Share privately with friends or publicly from your Creator Page." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const { mode, creatorPage, user } = useFlip();
  const navigate = useNavigate();
  const [type, setType] = useState<"clip" | "image">("clip");
  const [format, setFormat] = useState<VideoFormat>("short");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const limit = maxSecondsFor(format);
  const trimEnd = Math.min(duration, trimStart + limit);
  const overLimit = duration > limit;

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    setTrimStart(0);
  }, [format, file]);

  async function pick(f: File | undefined) {
    if (!f) return;
    setError(null);
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
    if (f.type.startsWith("video")) {
      try {
        const d = await readVideoDuration(f);
        setDuration(d);
        if (d > SHORT_MAX_SECONDS) setFormat("long");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read that video");
      }
    } else {
      setDuration(0);
    }
  }

  async function post() {
    if (!user) {
      await navigate({ to: "/auth" });
      return;
    }
    if (!file) {
      setError("Pick a video or image first");
      return;
    }
    setError(null);
    setProgress(0);
    try {
      const isVideo = file.type.startsWith("video");
      const mediaUrl = await uploadToR2(file, isVideo ? "videos" : "images", file.name, setProgress);

      let posterUrl: string | null = null;
      if (isVideo) {
        const poster = (await capturePoster(file, trimStart)) ?? (await capturePoster(file, 0));
        if (poster) posterUrl = await uploadToR2(poster, "posters", "poster.jpg");
      }

      const hashtags = [...caption.matchAll(/#(\w+)/g)].map((m) => m[1]!.toLowerCase());
      const publishing = mode === "creator" && creatorPage;

      const { error: err } = await supabase.from("posts").insert({
        author_id: user.id,
        creator_page_id: publishing ? creatorPage.id : null,
        kind: isVideo ? "clip" : "image",
        visibility: publishing ? "public" : "friends",
        format: isVideo ? format : null,
        media_url: mediaUrl,
        poster_url: posterUrl ?? (isVideo ? null : mediaUrl),
        caption: caption.replace(/#\w+/g, "").trim(),
        hashtags,
        duration_seconds: isVideo ? Math.min(duration, limit) : null,
        trim_start: isVideo ? trimStart : 0,
        trim_end: isVideo ? trimEnd : null,
      });
      if (err) throw err;
      await navigate({ to: publishing ? "/creator" : "/profile" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setProgress(null);
    }
  }

  return (
    <AppShell>
      <TopBar title="New post" />
      <div className="space-y-4 p-4">
        <p className="rounded-2xl bg-surface p-3 text-xs text-muted-foreground">
          Posting to{" "}
          <span className="font-semibold text-foreground">
            {mode === "creator" && creatorPage ? `Creator Page @${creatorPage.handle} (public)` : "your Personal Account (friends only)"}
          </span>
          . Switch accounts from the profile menu to post to the other one.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Choice active={type === "clip"} onClick={() => setType("clip")} icon={Film} label="Video" />
          <Choice active={type === "image"} onClick={() => setType("image")} icon={ImageIcon} label="Image" />
        </div>

        {type === "clip" && (
          <div className="grid grid-cols-2 gap-2">
            <Choice
              active={format === "short"}
              onClick={() => setFormat("short")}
              icon={Film}
              label="Short"
              sub="Up to 60 seconds"
            />
            <Choice
              active={format === "long"}
              onClick={() => setFormat("long")}
              icon={Film}
              label="Long-form"
              sub="Up to 5 minutes"
            />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={type === "clip" ? "video/*" : "image/*"}
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />

        <button
          onClick={() => inputRef.current?.click()}
          className="relative grid aspect-[9/16] max-h-[42vh] w-full place-items-center overflow-hidden rounded-3xl border border-dashed border-border bg-surface"
        >
          {previewUrl ? (
            type === "clip" ? (
              <video ref={videoRef} src={previewUrl} className="h-full w-full object-cover" muted playsInline controls />
            ) : (
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="text-center">
              <Upload className="mx-auto mb-2 h-6 w-6 text-brand-pink" />
              <p className="text-sm font-medium">Tap to select from your device</p>
              <p className="text-xs text-muted-foreground">
                {type === "clip" ? "Shorts up to 60s · Long-form up to 5:00 · 9:16" : "JPG or PNG"}
              </p>
            </div>
          )}
        </button>

        {type === "clip" && duration > 0 && (
          <div className="space-y-2 rounded-2xl bg-surface p-3">
            <p className="flex items-center gap-2 text-xs font-medium">
              <Scissors className="h-3.5 w-3.5 text-brand-cyan" />
              {overLimit
                ? `Your video is ${formatTime(duration)} — we'll cut it to ${formatTime(limit)}.`
                : `Full length ${formatTime(duration)} — under the ${formatTime(limit)} limit.`}
            </p>
            {overLimit && (
              <>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, duration - limit)}
                  step={0.5}
                  value={trimStart}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setTrimStart(v);
                    if (videoRef.current) videoRef.current.currentTime = v;
                  }}
                  aria-label="Trim start"
                  className="w-full accent-[var(--brand)]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Starts {formatTime(trimStart)}</span>
                  <span className="text-brand-cyan">Ends {formatTime(trimEnd)}</span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="bg-gradient-brand absolute inset-y-0 rounded-full"
                    style={{
                      left: `${(trimStart / duration) * 100}%`,
                      width: `${((trimEnd - trimStart) / duration) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {format === "short" ? "Shorts" : "Long-form videos"} auto-cut at {formatTime(limit)}. Drag to choose
                  where the cut starts.
                </p>
              </>
            )}
            {duration > LONG_MAX_SECONDS && format === "long" && (
              <p className="text-[11px] text-brand-pink">Anything past 5:00 won't be shown.</p>
            )}
          </div>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="Say something… add #hashtags"
          className="w-full rounded-2xl bg-surface p-3 text-sm outline-none placeholder:text-muted-foreground"
        />

        {error && <p className="text-xs text-brand-pink">{error}</p>}
        {progress !== null && (
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            <span className="bg-gradient-brand block h-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <button
          onClick={() => void post()}
          disabled={progress !== null}
          className="bg-gradient-brand shadow-glow flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {progress !== null ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading {progress}%
            </>
          ) : (
            "Post"
          )}
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
      className={`rounded-2xl p-3 text-left transition-colors ${active ? "bg-surface-2 ring-brand" : "bg-surface"}`}
    >
      <Icon className={`mb-1.5 h-4 w-4 ${active ? "text-brand-pink" : "text-muted-foreground"}`} />
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </button>
  );
}

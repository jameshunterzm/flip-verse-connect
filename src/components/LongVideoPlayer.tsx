import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize, Pause, Play, Settings2, Volume2, VolumeX } from "lucide-react";
import { PREROLL_HOLD_MS, maybeShowInterstitial } from "@/lib/admob";

const SPEEDS = [0.5, 1, 1.25, 1.5, 2] as const;

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Long-form player with Flip Chat controls: scrub bar, skip, speed, mute,
 * fullscreen — plus an AdMob pre-roll gate before playback starts.
 */
export function LongVideoPlayer({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string | null;
  title?: string | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [preroll, setPreroll] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  function nudgeControls() {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2800);
  }

  async function start() {
    if (started) return;
    setPreroll(true);
    // Pre-roll: hand off to the native AdMob interstitial when available.
    maybeShowInterstitial();
    await new Promise((r) => setTimeout(r, PREROLL_HOLD_MS));
    setPreroll(false);
    setStarted(true);
    void ref.current?.play();
    nudgeControls();
  }

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
    nudgeControls();
  }

  function seekBy(delta: number) {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || 0);
    nudgeControls();
  }

  return (
    <div ref={wrapRef} className="relative aspect-video w-full overflow-hidden bg-black">
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        className="h-full w-full bg-black object-contain"
        onClick={() => (started ? (controlsVisible ? toggle() : nudgeControls()) : void start())}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
      />

      {!started && !preroll && (
        <button
          type="button"
          onClick={() => void start()}
          aria-label="Play video"
          className="absolute inset-0 grid place-items-center bg-black/40"
        >
          <span className="bg-gradient-brand shadow-glow grid h-16 w-16 place-items-center rounded-full">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
        </button>
      )}

      {preroll && (
        <div className="absolute inset-0 grid place-items-center bg-black/85 text-center">
          <div>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-cyan" />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-brand-cyan">Sponsored</p>
            <p className="text-xs text-muted-foreground">Your video starts after this ad</p>
          </div>
        </div>
      )}

      {buffering && started && (
        <Loader2 className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 animate-spin text-white/80" />
      )}

      {started && (
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 transition-opacity ${
            controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            aria-label="Seek"
            onChange={(e) => {
              const v = ref.current;
              if (v) v.currentTime = Number(e.target.value);
              nudgeControls();
            }}
            className="w-full accent-[var(--brand)]"
          />
          <div className="flex items-center gap-3 text-xs text-white/90">
            <button onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
            <button onClick={() => seekBy(-10)} aria-label="Back 10 seconds" className="font-semibold">
              −10
            </button>
            <button onClick={() => seekBy(10)} aria-label="Forward 10 seconds" className="font-semibold">
              +10
            </button>
            <span className="tabular-nums">
              {clock(time)} / {clock(duration)}
            </span>
            <div className="relative ml-auto flex items-center gap-3">
              {speedOpen && (
                <div className="absolute bottom-7 right-0 rounded-xl bg-black/85 p-1 backdrop-blur-md">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSpeed(s);
                        setSpeedOpen(false);
                        if (ref.current) ref.current.playbackRate = s;
                      }}
                      className={`block w-full rounded-lg px-3 py-1 text-left text-xs ${
                        s === speed ? "text-brand-cyan" : "text-white/80"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setSpeedOpen((o) => !o)} aria-label="Playback speed">
                <Settings2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const v = ref.current;
                  if (!v) return;
                  v.muted = !v.muted;
                  setMuted(v.muted);
                }}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => void wrapRef.current?.requestFullscreen?.().catch(() => undefined)}
                aria-label="Fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
          {title && <p className="mt-1 truncate text-[11px] text-white/60">{title}</p>}
        </div>
      )}
    </div>
  );
}

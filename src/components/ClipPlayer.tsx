import { useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { setSoundOn, useSoundOn } from "@/lib/sound";

/** Plays a clip constrained to its trim window and loops inside it. */
export function ClipPlayer({
  src,
  poster,
  active,
  trimStart = 0,
  trimEnd,
  className = "",
}: {
  src: string;
  poster?: string | null;
  active: boolean;
  trimStart?: number;
  trimEnd?: number | null;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const soundOn = useSoundOn();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = !soundOn || !active;
    if (active) {
      if (video.currentTime < trimStart) video.currentTime = trimStart;
      void video.play().catch(() => {
        // Autoplay with sound can be blocked — fall back to muted playback.
        video.muted = true;
        void video.play().catch(() => undefined);
      });
    } else {
      video.pause();
      video.currentTime = trimStart;
    }
  }, [active, trimStart, soundOn]);

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        muted={!soundOn}
        playsInline
        loop={!trimEnd}
        preload="metadata"
        className={className}
        onLoadedMetadata={(e) => {
          e.currentTarget.currentTime = trimStart;
        }}
        onTimeUpdate={(e) => {
          if (trimEnd && e.currentTarget.currentTime >= trimEnd) e.currentTarget.currentTime = trimStart;
        }}
      />
      {active && (
        <button
          type="button"
          onClick={() => setSoundOn(!soundOn)}
          aria-label={soundOn ? "Mute video" : "Unmute video"}
          className="absolute right-3 top-16 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/45 backdrop-blur-md"
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      )}
    </>
  );
}

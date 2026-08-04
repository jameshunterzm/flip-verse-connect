import { useEffect, useRef } from "react";

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

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (active) {
      if (video.currentTime < trimStart) video.currentTime = trimStart;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = trimStart;
    }
  }, [active, trimStart]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      muted
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
  );
}

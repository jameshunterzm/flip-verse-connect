import { useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  setSoundOn,
  useSoundOn,
} from "@/lib/sound";

import {
  registerShortWatched,
} from "@/lib/admob";

/**
 * Plays a Short constrained to its trim window.
 *
 * Every completed Short is reported exactly once to the native
 * Android application.
 *
 * Android is responsible for counting Shorts and showing the
 * interstitial after every 4 completed Shorts.
 */
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

  /**
   * Prevents the same Short from being reported more than once.
   *
   * timeupdate can fire many times around trimEnd.
   */
  const reportedRef = useRef(false);

  /**
   * Reports one completed Short.
   */
  function reportShortWatched() {
    if (reportedRef.current) {
      return;
    }

    reportedRef.current = true;

    registerShortWatched();
  }

  /**
   * Handle active/inactive Short playback.
   */
  useEffect(() => {
    const video = ref.current;

    if (!video) {
      return;
    }

    video.muted =
      !soundOn || !active;

    if (active) {
      /*
       * New active Short.
       *
       * Arm the completion reporter.
       */
      reportedRef.current = false;

      if (
        video.currentTime < trimStart
      ) {
        video.currentTime = trimStart;
      }

      void video.play().catch(() => {
        /*
         * Autoplay with sound can be blocked.
         * Fall back to muted playback.
         */
        video.muted = true;

        void video.play().catch(
          () => undefined
        );
      });
    } else {
      video.pause();

      video.currentTime = trimStart;

      /*
       * The next time this Short becomes active,
       * it is a new playback cycle.
       */
      reportedRef.current = false;
    }
  }, [
    active,
    trimStart,
    soundOn,
  ]);

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={
          poster ?? undefined
        }
        muted={!soundOn}
        playsInline
        loop={!trimEnd}
        preload="metadata"
        className={className}
        onLoadedMetadata={(event) => {
          event.currentTarget.currentTime =
            trimStart;
        }}
        onTimeUpdate={(event) => {
          const video =
            event.currentTarget;

          const currentTime =
            video.currentTime;

          /*
           * Trimmed Short.
           */
          if (
            trimEnd &&
            currentTime >= trimEnd
          ) {
            video.currentTime =
              trimStart;

            reportShortWatched();

            return;
          }

          /*
           * Untrimmed Short:
           *
           * If playback loops naturally, arm the
           * reporter again near the beginning.
           */
          if (
            !trimEnd &&
            currentTime <
              trimStart + 0.3
          ) {
            reportedRef.current =
              false;
          }
        }}
        onEnded={() => {
          /*
           * Only relevant for an untrimmed
           * video where loop is disabled.
           */
          if (!trimEnd) {
            reportShortWatched();
          }
        }}
      />

      {active && (
        <button
          type="button"
          onClick={() =>
            setSoundOn(!soundOn)
          }
          aria-label={
            soundOn
              ? "Mute video"
              : "Unmute video"
          }
          className="absolute right-3 top-16 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/45 backdrop-blur-md"
        >
          {soundOn ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>
      )}
    </>
  );
}

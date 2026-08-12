import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Loader2,
  Maximize,
  Pause,
  Play,
  Settings2,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  requestNativeLongFormPreRoll,
} from "@/lib/admob";

const SPEEDS = [
  0.5,
  1,
  1.25,
  1.5,
  2,
] as const;

function clock(seconds: number) {
  const s = Math.max(
    0,
    Math.floor(seconds || 0)
  );

  const h = Math.floor(
    s / 3600
  );

  const m = Math.floor(
    (s % 3600) / 60
  );

  const r = s % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(
      2,
      "0"
    )}:${String(r).padStart(
      2,
      "0"
    )}`;
  }

  return `${m}:${String(r).padStart(
    2,
    "0"
  )}`;
}

/**
 * Long-form video player.
 *
 * Native Android controls the real AdMob pre-roll.
 *
 * Flow:
 *
 * User presses Play
 *      ↓
 * AndroidAds.longFormVideoStarted()
 *      ↓
 * Android shows long-form interstitial if ready
 *      ↓
 * Android calls window.startLongFormVideoFromAndroid()
 *      ↓
 * Video starts
 *
 * If Android has no ad ready, it calls the same callback
 * immediately and playback starts.
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
  const ref =
    useRef<HTMLVideoElement>(null);

  const wrapRef =
    useRef<HTMLDivElement>(null);

  const [
    started,
    setStarted,
  ] = useState(false);

  const [
    preroll,
    setPreroll,
  ] = useState(false);

  const [
    playing,
    setPlaying,
  ] = useState(false);

  const [
    muted,
    setMuted,
  ] = useState(false);

  const [
    time,
    setTime,
  ] = useState(0);

  const [
    duration,
    setDuration,
  ] = useState(0);

  const [
    speed,
    setSpeed,
  ] = useState(1);

  const [
    speedOpen,
    setSpeedOpen,
  ] = useState(false);

  const [
    buffering,
    setBuffering,
  ] = useState(false);

  const [
    controlsVisible,
    setControlsVisible,
  ] = useState(true);

  const hideTimer =
    useRef<
      ReturnType<typeof setTimeout>
    >(undefined);

  /**
   * Prevents duplicate Android pre-roll requests
   * if the user rapidly taps Play.
   */
  const androidPendingRef =
    useRef(false);

  /**
   * Clean up controls timer.
   */
  useEffect(() => {
    return () => {
      clearTimeout(
        hideTimer.current
      );
    };
  }, []);

  /**
   * Android calls this after:
   *
   * 1. The long-form AdMob interstitial is dismissed
   * OR
   * 2. No ad was ready and Android decided playback
   *    should continue immediately.
   */
  useEffect(() => {
    const startFromAndroid =
      () => {
        /*
         * Ignore callbacks that don't belong to
         * an active Android pre-roll request.
         */
        if (
          !androidPendingRef.current
        ) {
          return;
        }

        androidPendingRef.current =
          false;

        setPreroll(false);

        setStarted(true);

        const video =
          ref.current;

        if (video) {
          void video.play()
            .then(() => {
              setPlaying(true);
            })
            .catch(() => {
              /*
               * Browser/WebView may require user
               * interaction. The Play button remains
               * available.
              */
              setPlaying(false);
            });
        }

        nudgeControls();
      };

    (
      window as unknown as Record<
        string,
        unknown
      >
    ).startLongFormVideoFromAndroid =
      startFromAndroid;

    return () => {
      delete (
        window as unknown as Record<
          string,
          unknown
        >
      ).startLongFormVideoFromAndroid;
    };
  }, []);

  function nudgeControls() {
    setControlsVisible(true);

    clearTimeout(
      hideTimer.current
    );

    hideTimer.current =
      setTimeout(() => {
        setControlsVisible(false);
      }, 2800);
  }

  /**
   * Start the long-form video.
   */
  async function start() {
    /*
     * Prevent duplicate starts.
     */
    if (
      started ||
      androidPendingRef.current
    ) {
      return;
    }

    /*
     * Check whether the dedicated native
     * Android bridge exists.
     */
    const androidAds =
      typeof window !== "undefined"
        ? (window as any).AndroidAds
        : undefined;

    const hasAndroidPreRoll =
      androidAds &&
      typeof androidAds.longFormVideoStarted ===
        "function";

    if (hasAndroidPreRoll) {
      /*
       * Tell Android that the user wants
       * to start a long-form video.
       *
       * Android will either:
       *
       * A. show the ad and call our callback
       *    after dismissal
       *
       * OR
       *
       * B. immediately call our callback if
       *    no ad is ready.
       */
      androidPendingRef.current =
        true;

      setPreroll(true);

      const requested =
        requestNativeLongFormPreRoll();

      /*
       * If the native call itself failed,
       * don't leave the player permanently
       * waiting.
       */
      if (!requested) {
        androidPendingRef.current =
          false;

        setPreroll(false);

        setStarted(true);

        void ref.current?.play();

        setPlaying(true);

        nudgeControls();
      }

      return;
    }

    /*
     * Normal browser fallback.
     *
     * No native Android bridge means no
     * native AdMob pre-roll.
     */
    setStarted(true);

    const video =
      ref.current;

    if (video) {
      try {
        await video.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }

    nudgeControls();
  }

  /**
   * Play/pause toggle after the video has started.
   */
  function toggle() {
    const video =
      ref.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play()
        .then(() => {
          setPlaying(true);
        })
        .catch(() => {
          setPlaying(false);
        });
    } else {
      video.pause();
      setPlaying(false);
    }

    nudgeControls();
  }

  /**
   * Seek forward/backward.
   */
  function seekBy(
    delta: number
  ) {
    const video =
      ref.current;

    if (!video) {
      return;
    }

    video.currentTime =
      Math.min(
        Math.max(
          0,
          video.currentTime + delta
        ),
        video.duration || 0
      );

    nudgeControls();
  }

  /**
   * Change playback speed.
   */
  function changeSpeed(
    newSpeed: number
  ) {
    const video =
      ref.current;

    setSpeed(newSpeed);

    if (video) {
      video.playbackRate =
        newSpeed;
    }

    setSpeedOpen(false);

    nudgeControls();
  }

  /**
   * Toggle mute.
   */
  function toggleMute() {
    const video =
      ref.current;

    if (!video) {
      return;
    }

    video.muted =
      !video.muted;

    setMuted(video.muted);

    nudgeControls();
  }

  /**
   * Toggle fullscreen.
   */
  async function toggleFullscreen() {
    const wrapper =
      wrapRef.current;

    if (!wrapper) {
      return;
    }

    try {
      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();
      } else {
        await wrapper.requestFullscreen();
      }
    } catch {
      // Fullscreen may not be supported.
    }

    nudgeControls();
  }

  return (
    <div
      ref={wrapRef}
      className="relative aspect-video w-full overflow-hidden bg-black"
      onMouseMove={nudgeControls}
      onTouchStart={nudgeControls}
    >
      <video
        ref={ref}
        src={src}
        poster={
          poster ?? undefined
        }
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onLoadedMetadata={(event) => {
          setDuration(
            event.currentTarget.duration ||
              0
          );

          event.currentTarget.playbackRate =
            speed;

          event.currentTarget.muted =
            muted;
        }}
        onTimeUpdate={(event) => {
          setTime(
            event.currentTarget.currentTime
          );
        }}
        onPlay={() => {
          setPlaying(true);
          nudgeControls();
        }}
        onPause={() => {
          setPlaying(false);
          nudgeControls();
        }}
        onWaiting={() => {
          setBuffering(true);
        }}
        onCanPlay={() => {
          setBuffering(false);
        }}
        onEnded={() => {
          setPlaying(false);
          setStarted(false);
          setTime(0);
        }}
      />

      {/* ------------------------------------------------------------
          PRE-ROLL WAITING SCREEN
          ------------------------------------------------------------ */}

      {preroll && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-3 text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin" />

            <div className="text-sm font-medium">
              Preparing video...
            </div>

            <div className="text-xs text-white/60">
              Advertisement
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          BUFFERING
          ------------------------------------------------------------ */}

      {buffering &&
        started &&
        !preroll && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

      {/* ------------------------------------------------------------
          PLAY BUTTON BEFORE VIDEO STARTS
          ------------------------------------------------------------ */}

      {!started &&
        !preroll && (
          <button
            type="button"
            onClick={start}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/20"
            aria-label="Play video"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
              <Play className="ml-1 h-7 w-7 fill-current" />
            </span>
          </button>
        )}

      {/* ------------------------------------------------------------
          VIDEO CONTROLS
          ------------------------------------------------------------ */}

      {started &&
        !preroll && (
          <div
            className={`absolute inset-x-0 bottom-0 z-20 transition-opacity ${
              controlsVisible
                ? "opacity-100"
                : "opacity-0"
            }`}
          >
            <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-10">
              {/* Progress */}
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(
                  time,
                  duration || 0
                )}
                onChange={(event) => {
                  const video =
                    ref.current;

                  if (!video) {
                    return;
                  }

                  const newTime =
                    Number(
                      event.target.value
                    );

                  video.currentTime =
                    newTime;

                  setTime(newTime);

                  nudgeControls();
                }}
                className="mb-2 w-full cursor-pointer"
              />

              <div className="flex items-center gap-2 text-white">
                {/* Play/Pause */}
                <button
                  type="button"
                  onClick={toggle}
                  className="rounded p-1.5 hover:bg-white/10"
                  aria-label={
                    playing
                      ? "Pause"
                      : "Play"
                  }
                >
                  {playing ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="h-5 w-5 fill-current" />
                  )}
                </button>

                {/* Back 10 */}
                <button
                  type="button"
                  onClick={() =>
                    seekBy(-10)
                  }
                  className="rounded px-1.5 py-1 text-xs hover:bg-white/10"
                >
                  -10
                </button>

                {/* Forward 10 */}
                <button
                  type="button"
                  onClick={() =>
                    seekBy(10)
                  }
                  className="rounded px-1.5 py-1 text-xs hover:bg-white/10"
                >
                  +10
                </button>

                {/* Time */}
                <span className="mr-auto text-xs text-white/80">
                  {clock(time)} /{" "}
                  {clock(duration)}
                </span>

                {/* Mute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded p-1.5 hover:bg-white/10"
                  aria-label={
                    muted
                      ? "Unmute"
                      : "Mute"
                  }
                >
                  {muted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>

                {/* Speed */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setSpeedOpen(
                        !speedOpen
                      )
                    }
                    className="rounded p-1.5 hover:bg-white/10"
                    aria-label="Playback speed"
                  >
                    <Settings2 className="h-5 w-5" />
                  </button>

                  {speedOpen && (
                    <div className="absolute bottom-10 right-0 rounded-lg bg-black/95 p-1 shadow-xl">
                      {SPEEDS.map(
                        (value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              changeSpeed(
                                value
                              )
                            }
                            className={`block w-16 rounded px-3 py-2 text-left text-xs hover:bg-white/10 ${
                              speed ===
                              value
                                ? "text-white"
                                : "text-white/70"
                            }`}
                          >
                            {value}x
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={
                    toggleFullscreen
                  }
                  className="rounded p-1.5 hover:bg-white/10"
                  aria-label="Fullscreen"
                >
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ------------------------------------------------------------
          TITLE
          ------------------------------------------------------------ */}

      {title && (
        <div
          className={`absolute left-3 top-3 z-10 max-w-[80%] text-sm font-medium text-white transition-opacity ${
            controlsVisible
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          {title}
        </div>
      )}
    </div>
  );
}

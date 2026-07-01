"use client";

import { useRef, useState } from "react";
import { Download, Pause, Play, TriangleAlert } from "lucide-react";
import { formatDuration } from "@/lib/metrics";
import { waveBars } from "@/lib/waveform";
import { cn } from "@/lib/utils";

export function AudioPlayer({
  src,
  seed,
  durationSeconds,
  fileName = "recording.mp3",
}: {
  src: string;
  seed: string;
  durationSeconds: number;
  fileName?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wave = waveBars(seed);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [errored, setErrored] = useState(false);

  const progress = duration > 0 ? current / duration : 0;

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  }

  function seekToClientX(clientX: number, rect: DOMRect) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    el.currentTime = pct * duration;
    setCurrent(el.currentTime);
  }

  // Pointer events cover mouse + touch + pen, including drag-to-scrub.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    seekToClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      seekToClientX(e.clientX, e.currentTarget.getBoundingClientRect());
    }
  }

  function nudge(seconds: number) {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = Math.min(duration, Math.max(0, el.currentTime + seconds));
    setCurrent(el.currentTime);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const el = audioRef.current;
    if (!el || !duration) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      nudge(5);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      nudge(-5);
    } else if (e.key === "Home") {
      e.preventDefault();
      el.currentTime = 0;
      setCurrent(0);
    } else if (e.key === "End") {
      e.preventDefault();
      el.currentTime = duration;
      setCurrent(duration);
    }
  }

  if (errored) {
    return (
      <div className="liquid-glass flex items-center gap-2 p-4 text-sm text-foreground-muted sm:p-5">
        <TriangleAlert className="h-4 w-4 text-foreground-subtle" aria-hidden="true" />
        Recording couldn&apos;t be loaded.
      </div>
    );
  }

  return (
    <div className="liquid-glass p-4 sm:p-5">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onEnded={() => setPlaying(false)}
        onError={() => setErrored(true)}
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause recording" : "Play recording"}
          className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105"
        >
          {playing ? (
            <Pause className="h-4 w-4" fill="currentColor" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4 translate-x-px" fill="currentColor" aria-hidden="true" />
          )}
        </button>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Seek recording"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={`${formatDuration(current)} of ${formatDuration(duration)}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onKeyDown={onKeyDown}
          className="focus-ring flex h-10 flex-1 cursor-pointer touch-none items-center gap-[2px]"
        >
          {wave.map((v, i) => {
            const filled = i / wave.length <= progress;
            return (
              <span
                key={i}
                aria-hidden="true"
                className={cn(
                  "w-full rounded-full transition-colors",
                  filled ? "bg-primary" : "bg-foreground/20",
                )}
                style={{ height: `${Math.round(v * 100)}%` }}
              />
            );
          })}
        </div>

        <span className="shrink-0 text-sm tnum text-foreground-muted">
          {formatDuration(current)} / {formatDuration(duration)}
        </span>

        <a
          href={src}
          download={fileName}
          aria-label="Download recording"
          title="Download recording"
          className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <Download className="h-[18px] w-[18px]" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

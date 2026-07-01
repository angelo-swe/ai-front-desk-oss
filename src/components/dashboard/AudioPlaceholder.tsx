import { Lock, MicOff, Play } from "lucide-react";
import { formatDuration } from "@/lib/metrics";
import { waveBars } from "@/lib/waveform";

export function AudioPlaceholder({
  seed,
  durationSeconds,
  isDemo = true,
}: {
  seed: string;
  durationSeconds: number;
  /** Demo tenant (sample data) vs a live call that simply has no recording. */
  isDemo?: boolean;
}) {
  const wave = waveBars(seed);
  return (
    <div className="liquid-glass p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <div
          className={
            isDemo
              ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white"
              : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground-subtle"
          }
        >
          {isDemo ? (
            <Play className="h-4 w-4 translate-x-px" fill="currentColor" aria-hidden="true" />
          ) : (
            <MicOff className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        <div className="flex h-10 flex-1 items-center gap-[2px]">
          {wave.map((v, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="w-full rounded-full bg-foreground/25"
              style={{ height: `${Math.round(v * 100)}%` }}
            />
          ))}
        </div>

        <span className="shrink-0 text-sm tnum text-foreground-muted">
          {formatDuration(durationSeconds)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-foreground-subtle">
        <Lock className="h-3 w-3" aria-hidden="true" />
        {isDemo
          ? "Call recording — available in the live version"
          : "No recording was captured for this call"}
      </div>
    </div>
  );
}

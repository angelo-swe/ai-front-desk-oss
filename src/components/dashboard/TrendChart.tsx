"use client";

import { m, useReducedMotion } from "motion/react";
import type { DailyPoint } from "@/lib/types";

const MAX_BARS = 30;

interface Bar {
  start: string;
  end: string;
  calls: number;
  answered: number;
}

/** Group daily points into at most MAX_BARS buckets so 60/90-day views stay readable. */
function toBars(data: DailyPoint[]): Bar[] {
  if (data.length <= MAX_BARS) {
    return data.map((d) => ({
      start: d.date,
      end: d.date,
      calls: d.calls,
      answered: d.answered,
    }));
  }
  const size = Math.ceil(data.length / MAX_BARS);
  const bars: Bar[] = [];
  for (let i = 0; i < data.length; i += size) {
    const slice = data.slice(i, i + size);
    bars.push({
      start: slice[0].date,
      end: slice[slice.length - 1].date,
      calls: slice.reduce((s, d) => s + d.calls, 0),
      answered: slice.reduce((s, d) => s + d.answered, 0),
    });
  }
  return bars;
}

function fmt(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TrendChart({ data }: { data: DailyPoint[] }) {
  const prefersReduced = useReducedMotion();
  const bars = toBars(data);
  const max = bars.reduce((mx, b) => Math.max(mx, b.calls), 0) || 1;
  const totalCalls = bars.reduce((s, b) => s + b.calls, 0);
  const peak = bars.reduce((mx, b) => (b.calls > mx.calls ? b : mx), bars[0]);

  return (
    <div
      role="img"
      aria-label={
        peak
          ? `Call volume over time: ${totalCalls} calls total, peak of ${peak.calls} around ${fmt(peak.start)}.`
          : "Call volume over time"
      }
    >
      {/* Screen-reader equivalent of the bar chart */}
      <ul className="sr-only">
        {bars.map((b) => {
          const label = b.start === b.end ? fmt(b.start) : `${fmt(b.start)}–${fmt(b.end)}`;
          return (
            <li key={`sr-${b.start}`}>
              {label}: {b.calls} calls, {b.answered} completed
            </li>
          );
        })}
      </ul>
      <div className="flex h-28 items-end gap-1" aria-hidden="true">
        {bars.map((b, i) => {
        const h = Math.max(6, Math.round((b.calls / max) * 100));
        const answeredH = b.calls > 0 ? Math.round((b.answered / b.calls) * h) : 0;
        const label = b.start === b.end ? fmt(b.start) : `${fmt(b.start)}–${fmt(b.end)}`;
        return (
          <div
            key={b.start}
            className="group relative flex h-full flex-1 items-end justify-center"
          >
            <m.div
              className="relative w-full max-w-[18px] overflow-hidden rounded-t-[4px] bg-primary/25"
              style={{ height: `${h}%`, transformOrigin: "bottom" }}
              initial={prefersReduced ? false : { scaleY: 0 }}
              animate={prefersReduced ? undefined : { scaleY: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.2 + i * 0.02,
                ease: "easeOut",
              }}
            >
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-[4px] bg-primary"
                style={{ height: `${answeredH}%` }}
              />
            </m.div>

            <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg-card px-2 py-1 text-[11px] text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {label}: {b.calls} call{b.calls === 1 ? "" : "s"} · {b.answered} completed
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}

// Pure functions over the client-safe DTOs. No fabricated values — every number
// traces back to real Assistable data (calls handled, sentiment, timestamps).
// These run unchanged on live data once the server proxy is wired.
//
// Note on "answered": the 30-day total mixes inbound calls with outbound
// voicemail-drop campaigns, so a raw completed/total ratio is NOT a meaningful
// "answered rate" and is deliberately not surfaced as "missed". We lead with the
// honest, unambiguous numbers: calls handled, completed conversations, sentiment.

import type { DailyPoint, RangeKey, Snapshot, Stats } from "@/lib/types";

export interface Kpis {
  callsHandled: number;
  completed: number;
  avgDurationSeconds: number;
  toReview: number; // callers who sounded unhappy (real: negative sentiment)
  positive: number;
  neutral: number;
  negative: number;
  talkTimeMinutes: number; // total connected talk time (excludes 0s no-pickups)
}

export function computeKpis(stats: Stats): Kpis {
  const { positive, neutral, negative } = stats.sentimentBreakdown;
  return {
    callsHandled: stats.totalCalls,
    completed: stats.completedCalls,
    avgDurationSeconds: stats.avgDurationSeconds,
    toReview: negative,
    positive,
    neutral,
    negative,
    talkTimeMinutes: stats.totalDurationMinutes,
  };
}

/** KPIs for a selected time window, computed from real per-window stats. */
export function kpisForRange(snapshot: Snapshot, range: RangeKey): Kpis {
  return computeKpis(snapshot.ranges[range].stats);
}

/** Last N days of the 90-day daily series for the selected window. */
export function trendForRange(snapshot: Snapshot, range: RangeKey): DailyPoint[] {
  const n = Number(range);
  return snapshot.dailyTrend90.slice(-n);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${rem}s`;
  return `${m}m ${rem.toString().padStart(2, "0")}s`;
}

/** Human "time saved" — minutes -> "2h 6m" / "45 min" / "3 hrs". */
export function formatHoursMinutes(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem} min`;
  if (rem === 0) return `${h} hr${h === 1 ? "" : "s"}`;
  return `${h}h ${rem}m`;
}

export function formatRelativeTime(
  iso: string,
  now = new Date(),
  timeZone?: string,
): string {
  const then = new Date(iso);
  if (!iso || Number.isNaN(then.getTime())) return "";
  const diffMs = now.getTime() - then.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  // Old-date fallback: format the calendar date in the clinic's tz (not the
  // viewer's), matching formatClock's convention.
  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  });
}

/** Absolute call time, formatted in the CLINIC's timezone (not the viewer's). */
export function formatClock(iso: string, timeZone?: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  });
}

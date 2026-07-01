// Pure call-aggregation. Computes windowed Stats from per-call rows.
//
// This is the SEAM for live data: the demo's build script and the future
// server-side BFF both feed Assistable call rows into `windowStats` and get the
// same client-safe Stats out. No fabrication — every number derives from rows.
//
// Sentiment rules (agreed with product):
//   - POSITIVE  -> positive
//   - NEGATIVE  -> negative   (strict: only Assistable NEGATIVE; failed/no-answer
//                              calls are NEUTRAL, never negative)
//   - everything else (NEUTRAL / MIXED / UNKNOWN / null) counts as neutral ONLY
//     if the call had real talk time (duration > 0). Zero-duration no-pickups are
//     excluded from sentiment entirely.
// Talk time (= "time saved") sums duration of calls with duration > 0, so
// no-answer/busy/failed calls (which never connect) don't inflate it.

import type { DailyPoint, Stats } from "./types";

export interface CallRow {
  durationSeconds: number;
  status: string; // COMPLETED | NO_ANSWER | BUSY | FAILED | CANCELED | ...
  sentiment: string; // POSITIVE | NEUTRAL | NEGATIVE | MIXED | UNKNOWN | "" | null
  startedAt: string; // ISO 8601
}

const DAY_MS = 86_400_000;

/** YYYY-MM-DD for an instant in a given IANA timezone. */
export function localDateKey(ms: number, timeZone: string): string {
  // en-CA renders as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/** Daily call/answered counts for the last `days` days (clinic-local), zero-filled. */
export function dailySeries(
  rows: CallRow[],
  days: number,
  nowMs: number,
  timeZone: string,
): DailyPoint[] {
  const buckets = new Map<string, { calls: number; answered: number }>();
  for (const r of rows) {
    if (!inWindow(r, days, nowMs)) continue;
    const key = localDateKey(Date.parse(r.startedAt), timeZone);
    const b = buckets.get(key) ?? { calls: 0, answered: 0 };
    b.calls++;
    if ((r.status || "").toUpperCase() === "COMPLETED") b.answered++;
    buckets.set(key, b);
  }
  const out: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = localDateKey(nowMs - i * DAY_MS, timeZone);
    const b = buckets.get(key);
    out.push({ date: key, calls: b?.calls ?? 0, answered: b?.answered ?? 0 });
  }
  return out;
}

export function inWindow(row: CallRow, days: number, nowMs: number): boolean {
  const t = Date.parse(row.startedAt);
  if (Number.isNaN(t)) return false;
  return t > nowMs - days * DAY_MS && t <= nowMs;
}

interface Acc {
  positive: number;
  neutral: number;
  negative: number;
  talkSeconds: number;
  connectedCalls: number;
  completed: number;
  errors: number;
  total: number;
}

function newAcc(): Acc {
  return {
    positive: 0,
    neutral: 0,
    negative: 0,
    talkSeconds: 0,
    connectedCalls: 0,
    completed: 0,
    errors: 0,
    total: 0,
  };
}

function addRow(acc: Acc, row: CallRow): void {
  acc.total++;

  const status = (row.status || "").toUpperCase();
  if (status === "COMPLETED") acc.completed++;
  if (status === "FAILED") acc.errors++;

  const hasTalk = row.durationSeconds > 0;
  if (hasTalk) {
    acc.talkSeconds += row.durationSeconds;
    acc.connectedCalls++;
  }

  const sentiment = (row.sentiment || "").toUpperCase();
  if (sentiment === "POSITIVE") acc.positive++;
  else if (sentiment === "NEGATIVE") acc.negative++;
  else if (hasTalk) acc.neutral++; // NEUTRAL/MIXED/UNKNOWN/null with real talk time
  // zero-duration unclassified calls: excluded from sentiment
}

function finalize(acc: Acc): Stats {
  return {
    totalCalls: acc.total,
    completedCalls: acc.completed,
    errorCalls: acc.errors,
    totalDurationMinutes: Math.round(acc.talkSeconds / 60),
    avgDurationSeconds: acc.connectedCalls
      ? Math.round(acc.talkSeconds / acc.connectedCalls)
      : 0,
    sentimentBreakdown: {
      positive: acc.positive,
      neutral: acc.neutral,
      negative: acc.negative,
    },
  };
}

export function windowStats(
  rows: CallRow[],
  days: number,
  nowMs: number,
): Stats {
  const acc = newAcc();
  for (const row of rows) {
    if (inWindow(row, days, nowMs)) addRow(acc, row);
  }
  return finalize(acc);
}

/** Compute several windows (e.g. 7/30/60/90) in ONE pass over rows, parsing each
 * timestamp once instead of re-parsing per window. Returns Stats keyed by day count.
 * Identical semantics to calling windowStats() once per window. */
export function windowStatsMulti(
  rows: CallRow[],
  daysList: number[],
  nowMs: number,
): Record<number, Stats> {
  const accs = daysList.map(() => newAcc());
  for (const row of rows) {
    const t = Date.parse(row.startedAt);
    if (Number.isNaN(t) || t > nowMs) continue;
    const ageDays = (nowMs - t) / DAY_MS;
    for (let i = 0; i < daysList.length; i++) {
      if (ageDays < daysList[i]) addRow(accs[i], row);
    }
  }
  const out: Record<number, Stats> = {};
  daysList.forEach((d, i) => {
    out[d] = finalize(accs[i]);
  });
  return out;
}

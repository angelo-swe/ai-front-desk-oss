import { describe, expect, test } from "bun:test";
import { windowStats, inWindow, type CallRow } from "./aggregate";

const NOW = Date.parse("2026-06-05T12:00:00Z");
const DAY = 86_400_000;
const at = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();

const rows: CallRow[] = [
  { durationSeconds: 60, status: "COMPLETED", sentiment: "POSITIVE", startedAt: at(1) },
  { durationSeconds: 30, status: "COMPLETED", sentiment: "", startedAt: at(2) }, // unknown + talk -> neutral
  { durationSeconds: 0, status: "NO_ANSWER", sentiment: "", startedAt: at(1) }, // no-pickup -> excluded from sentiment & talk
  { durationSeconds: 45, status: "COMPLETED", sentiment: "NEGATIVE", startedAt: at(3) },
  { durationSeconds: 0, status: "FAILED", sentiment: "UNKNOWN", startedAt: at(1) }, // failed, 0s -> excluded
  { durationSeconds: 90, status: "COMPLETED", sentiment: "NEUTRAL", startedAt: at(10) }, // outside 7d
];

describe("windowStats", () => {
  const s = windowStats(rows, 7, NOW);

  test("counts only calls within the window", () => {
    expect(s.totalCalls).toBe(5); // the day-10 row is excluded
  });

  test("completed and error counts by status", () => {
    expect(s.completedCalls).toBe(3);
    expect(s.errorCalls).toBe(1);
  });

  test("talk time excludes 0-duration no-pickups", () => {
    // 60 + 30 + 45 = 135s -> 2 min
    expect(s.totalDurationMinutes).toBe(2);
  });

  test("avg duration is over connected calls only", () => {
    expect(s.avgDurationSeconds).toBe(45); // 135 / 3 connected
  });

  test("unknown/blank sentiment with talk counts as neutral", () => {
    expect(s.sentimentBreakdown.neutral).toBe(1); // the blank-sentiment 30s call
  });

  test("negative is strict; failed/no-answer never negative", () => {
    expect(s.sentimentBreakdown.negative).toBe(1);
    expect(s.sentimentBreakdown.positive).toBe(1);
    // 0-duration unknown/failed calls excluded entirely from sentiment
    const classified =
      s.sentimentBreakdown.positive +
      s.sentimentBreakdown.neutral +
      s.sentimentBreakdown.negative;
    expect(classified).toBe(3);
  });
});

describe("inWindow", () => {
  test("respects the window bounds", () => {
    expect(inWindow({ durationSeconds: 1, status: "", sentiment: "", startedAt: at(6) }, 7, NOW)).toBe(true);
    expect(inWindow({ durationSeconds: 1, status: "", sentiment: "", startedAt: at(8) }, 7, NOW)).toBe(false);
  });
  test("rejects unparseable dates", () => {
    expect(inWindow({ durationSeconds: 1, status: "", sentiment: "", startedAt: "nope" }, 7, NOW)).toBe(false);
  });
});

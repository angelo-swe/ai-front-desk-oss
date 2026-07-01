import { describe, expect, test } from "bun:test";
import {
  computeKpis,
  formatDuration,
  formatHoursMinutes,
  formatClock,
  formatRelativeTime,
} from "./metrics";
import type { Stats } from "./types";

describe("formatDuration", () => {
  test("seconds under a minute", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(59)).toBe("59s");
  });
  test("minutes and padded seconds", () => {
    expect(formatDuration(75)).toBe("1m 15s");
    expect(formatDuration(125)).toBe("2m 05s");
  });
  test("clamps negatives", () => {
    expect(formatDuration(-10)).toBe("0s");
  });
});

describe("formatHoursMinutes", () => {
  test("minutes only", () => {
    expect(formatHoursMinutes(0)).toBe("0 min");
    expect(formatHoursMinutes(45)).toBe("45 min");
  });
  test("whole hours", () => {
    expect(formatHoursMinutes(60)).toBe("1 hr");
    expect(formatHoursMinutes(120)).toBe("2 hrs");
  });
  test("hours and minutes", () => {
    expect(formatHoursMinutes(126)).toBe("2h 6m");
    expect(formatHoursMinutes(669)).toBe("11h 9m");
  });
});

describe("formatClock", () => {
  test("renders a UTC instant in the clinic's timezone", () => {
    // 2026-06-05T13:06Z is 9:06 AM EDT
    const out = formatClock("2026-06-05T13:06:00Z", "America/New_York");
    expect(out).toContain("9:06");
    expect(out).toContain("EDT");
  });
  test("returns empty (not 'Invalid Date') for empty/garbage input", () => {
    expect(formatClock("")).toBe("");
    expect(formatClock("not-a-date")).toBe("");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-06-11T12:00:00Z");
  test("recent times read as relative", () => {
    expect(formatRelativeTime("2026-06-11T11:30:00Z", now)).toBe("30m ago");
    expect(formatRelativeTime("2026-06-11T11:59:50Z", now)).toBe("just now");
  });
  test("returns empty (not 'Invalid Date') for empty/garbage input", () => {
    expect(formatRelativeTime("", now)).toBe("");
    expect(formatRelativeTime("not-a-date", now)).toBe("");
  });
});

describe("computeKpis", () => {
  const stats: Stats = {
    totalCalls: 1255,
    completedCalls: 679,
    errorCalls: 18,
    totalDurationMinutes: 669,
    avgDurationSeconds: 59,
    sentimentBreakdown: { positive: 77, neutral: 586, negative: 18 },
  };
  const k = computeKpis(stats);

  test("passes talk time through as time-saved minutes", () => {
    expect(k.talkTimeMinutes).toBe(669);
  });
  test("to-review equals strict negative count", () => {
    expect(k.toReview).toBe(18);
  });
  test("surfaces real sentiment counts", () => {
    expect(k.positive).toBe(77);
    expect(k.negative).toBe(18);
  });
});

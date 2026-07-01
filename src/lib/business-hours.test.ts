import { describe, expect, test } from "bun:test";
import {
  DEFAULT_BUSINESS_HOURS,
  formatHourLabel,
  hoursFromCookie,
  isAfterHours,
  mergeHoursIntoCookie,
  parseBusinessHours,
} from "./business-hours";

const NY = "America/New_York";

describe("isAfterHours (default 9–5 Mon–Fri)", () => {
  test("weekday mid-morning is within hours", () => {
    // 2026-06-08 is a Monday; 14:00Z = 10 AM EDT
    expect(isAfterHours("2026-06-08T14:00:00Z", NY)).toBe(false);
  });
  test("weekday before open is after hours", () => {
    // 11:00Z = 7 AM EDT
    expect(isAfterHours("2026-06-08T11:00:00Z", NY)).toBe(true);
  });
  test("weekend is after hours", () => {
    // 2026-06-06 is a Saturday, 14:00Z = 10 AM EDT
    expect(isAfterHours("2026-06-06T14:00:00Z", NY)).toBe(true);
  });
  test("garbage timestamp is not after hours", () => {
    expect(isAfterHours("", NY)).toBe(false);
  });
});

describe("isAfterHours (custom hours)", () => {
  const sat10to6 = { openHour: 10, closeHour: 18, days: [1, 2, 3, 4, 5, 6] };
  test("Saturday 10 AM is now within hours", () => {
    expect(isAfterHours("2026-06-06T14:00:00Z", NY, sat10to6)).toBe(false);
  });
  test("Monday 9 AM is now before the 10 AM open", () => {
    // 13:00Z = 9 AM EDT
    expect(isAfterHours("2026-06-08T13:00:00Z", NY, sat10to6)).toBe(true);
  });
  test("Sunday is still closed", () => {
    expect(isAfterHours("2026-06-07T14:00:00Z", NY, sat10to6)).toBe(true);
  });
});

describe("parseBusinessHours", () => {
  test("accepts a valid object and de-dupes/sorts days", () => {
    expect(parseBusinessHours({ openHour: 8, closeHour: 20, days: [5, 1, 1, 3] })).toEqual({
      openHour: 8,
      closeHour: 20,
      days: [1, 3, 5],
    });
  });
  test("rejects close <= open", () => {
    expect(parseBusinessHours({ openHour: 17, closeHour: 9, days: [1] })).toBeNull();
  });
  test("rejects out-of-range hours and days", () => {
    expect(parseBusinessHours({ openHour: -1, closeHour: 9, days: [1] })).toBeNull();
    expect(parseBusinessHours({ openHour: 9, closeHour: 17, days: [7] })).toBeNull();
  });
  test("rejects non-objects", () => {
    expect(parseBusinessHours(null)).toBeNull();
    expect(parseBusinessHours("9-5")).toBeNull();
  });
});

describe("cookie helpers", () => {
  test("round-trips hours for a slug", () => {
    const hrs = { openHour: 10, closeHour: 18, days: [1, 2, 3, 4, 5, 6] };
    const cookie = mergeHoursIntoCookie(undefined, "acme", hrs);
    expect(hoursFromCookie(cookie, "acme")).toEqual(hrs);
  });
  test("keeps other tenants' hours when merging", () => {
    let cookie = mergeHoursIntoCookie(undefined, "acme", DEFAULT_BUSINESS_HOURS);
    cookie = mergeHoursIntoCookie(cookie, "beta", { openHour: 7, closeHour: 22, days: [0, 6] });
    expect(hoursFromCookie(cookie, "acme")).toEqual(DEFAULT_BUSINESS_HOURS);
    expect(hoursFromCookie(cookie, "beta")?.openHour).toBe(7);
  });
  test("returns null for an unknown slug or bad cookie", () => {
    expect(hoursFromCookie(undefined, "acme")).toBeNull();
    expect(hoursFromCookie("not json", "acme")).toBeNull();
  });
});

describe("formatHourLabel", () => {
  test("formats 12-hour labels", () => {
    expect(formatHourLabel(0)).toBe("12 AM");
    expect(formatHourLabel(9)).toBe("9 AM");
    expect(formatHourLabel(12)).toBe("12 PM");
    expect(formatHourLabel(17)).toBe("5 PM");
  });
});

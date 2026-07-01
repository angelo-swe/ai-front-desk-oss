// Per-tenant business hours. Pure + client-safe so the Settings form and the
// server-side "after hours" computation share one source of truth. There is no
// database yet, so a tenant's edits are persisted in a cookie (see
// /api/business-hours); the default below applies when nothing is saved.

export interface BusinessHours {
  /** Opening hour in the clinic's local time, 0–23 (e.g. 9 = 9 AM). */
  openHour: number;
  /** Closing hour in the clinic's local time, 0–24 (e.g. 17 = 5 PM). */
  closeHour: number;
  /** Open weekdays, 0=Sun … 6=Sat. */
  days: number[];
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  openHour: 9,
  closeHour: 17,
  days: [1, 2, 3, 4, 5], // Mon–Fri
};

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Cookie holding saved hours per tenant: `{ "<slug>": BusinessHours }`. */
export const BUSINESS_HOURS_COOKIE = "afd_business_hours";

/** Read the saved hours for a tenant slug from the cookie's JSON map. */
export function hoursFromCookie(
  cookieValue: string | undefined,
  slug: string,
): BusinessHours | null {
  if (!cookieValue) return null;
  try {
    const map = JSON.parse(cookieValue) as Record<string, unknown>;
    return parseBusinessHours(map?.[slug]);
  } catch {
    return null;
  }
}

/** Merge a tenant's new hours into the cookie's JSON map, returning the new value. */
export function mergeHoursIntoCookie(
  cookieValue: string | undefined,
  slug: string,
  hours: BusinessHours,
): string {
  let map: Record<string, BusinessHours> = {};
  if (cookieValue) {
    try {
      const parsed = JSON.parse(cookieValue);
      if (parsed && typeof parsed === "object") map = parsed;
    } catch {
      map = {};
    }
  }
  map[slug] = hours;
  return JSON.stringify(map);
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Validate/normalize an untrusted value into BusinessHours, or null if invalid. */
export function parseBusinessHours(raw: unknown): BusinessHours | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const openHour = Number(o.openHour);
  const closeHour = Number(o.closeHour);
  const days = Array.isArray(o.days) ? o.days.map(Number) : null;
  if (!Number.isInteger(openHour) || openHour < 0 || openHour > 23) return null;
  if (!Number.isInteger(closeHour) || closeHour < 1 || closeHour > 24) return null;
  if (closeHour <= openHour) return null;
  if (!days || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return null;
  // de-dupe + sort the open days
  const uniqueDays = [...new Set(days)].sort((a, b) => a - b);
  return { openHour, closeHour, days: uniqueDays };
}

/** True if the instant falls outside the given business hours, in the clinic's tz.
 * Defaults to 9–5 Mon–Fri, preserving the original hardcoded behavior. */
export function isAfterHours(
  iso: string,
  timeZone: string,
  hours: BusinessHours = DEFAULT_BUSINESS_HOURS,
): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date(t));
  const weekday = WEEKDAY_INDEX[parts.find((p) => p.type === "weekday")?.value ?? ""] ?? 0;
  let hour = Number(parts.find((p) => p.type === "hour")?.value ?? "12");
  if (hour === 24) hour = 0; // some runtimes render midnight as 24 under hour12:false
  if (!hours.days.includes(weekday)) return true;
  return hour < hours.openHour || hour >= hours.closeHour;
}

/** "9 AM", "12 PM", "5 PM" — for labels and selects. */
export function formatHourLabel(hour: number): string {
  const h = ((hour + 11) % 12) + 1;
  const suffix = hour < 12 || hour === 24 ? "AM" : "PM";
  return `${h} ${suffix}`;
}

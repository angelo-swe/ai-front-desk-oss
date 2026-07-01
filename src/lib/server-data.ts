import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionData } from "./session";
import {
  isLive,
  tenantBySlug,
  tenantOptions,
  type Tenant,
} from "./tenants";
import {
  fetchCallDetail,
  fetchCallRows,
  fetchCalls,
  type CallPage,
} from "./assistable";
import { dailySeries, windowStatsMulti } from "./aggregate";
import { snapshot as demoSnapshot, displayCalls, getCallById } from "./snapshot";
import {
  type BusinessHours,
  BUSINESS_HOURS_COOKIE,
  DEFAULT_BUSINESS_HOURS,
  hoursFromCookie,
  isAfterHours,
} from "./business-hours";
import type { CallRecord, RangeKey, Snapshot } from "./types";

const WINDOWS: RangeKey[] = ["7", "30", "60", "90"];

/** Decoded session for the current request, from the signed cookie.
 * `cache()`d so the cookie read + HMAC verify runs once per request even though
 * the layout, header, and page each ask for it. */
export const currentSession = cache(
  async (): Promise<SessionData | null> => {
    const jar = await cookies();
    return verifySession(jar.get(SESSION_COOKIE)?.value);
  },
);

/** Tenant the current request is viewing. Clients are locked to their own tenant;
 * admins view their session's active tenant. `cache()`d per request. */
export const currentTenant = cache(async (): Promise<Tenant | null> => {
  const s = await currentSession();
  if (!s) return null;
  const slug = s.role === "client" ? s.id : s.active;
  return tenantBySlug(slug) ?? null;
});

/** A tenant's saved business hours (cookie-backed), or the 9–5 Mon–Fri default.
 * `cache()`d so the cookie read happens once per request. */
export const businessHoursFor = cache(
  async (slug: string): Promise<BusinessHours> => {
    const jar = await cookies();
    return (
      hoursFromCookie(jar.get(BUSINESS_HOURS_COOKIE)?.value, slug) ??
      DEFAULT_BUSINESS_HOURS
    );
  },
);

/** Recompute each call's after-hours flag against the tenant's saved hours.
 * The demo snapshot bakes afterHours with the default rule; this lets edits to
 * the hours setting reflect on demo data too. */
function applyHours(
  calls: CallRecord[],
  timeZone: string,
  hours: BusinessHours,
): CallRecord[] {
  if (hours === DEFAULT_BUSINESS_HOURS) return calls;
  return calls.map((c) => ({
    ...c,
    afterHours: isAfterHours(c.startedAt, timeZone, hours),
  }));
}

export interface HeaderContext {
  activeName: string;
  activeSlug: string;
  isAdmin: boolean;
  tenants: { slug: string; name: string }[];
}

/** Everything the header needs: active tenant + (for admins) the switcher list. */
export async function getHeaderContext(): Promise<HeaderContext | null> {
  const s = await currentSession();
  if (!s) return null;
  const tenant = await currentTenant();
  if (!tenant) return null;
  const isAdmin = s.role === "admin";
  return {
    activeName: tenant.name,
    activeSlug: tenant.slug,
    isAdmin,
    tenants: isAdmin ? tenantOptions() : [],
  };
}

/** Overview data in the Snapshot shape — static for demo, live for real tenants. */
export async function getOverviewData(tenant: Tenant): Promise<Snapshot> {
  if (!isLive(tenant) || !tenant.subaccountId) {
    return demoSnapshot;
  }
  const sub = tenant.subaccountId;
  const tz = tenant.timezone;
  const now = Date.now();

  const rows = await fetchCallRows(sub, 90);

  // All four windows in a single pass over rows (the 90-day pull is a superset).
  const statsByDays = windowStatsMulti(
    rows,
    WINDOWS.map(Number),
    now,
  );
  const ranges = Object.fromEntries(
    WINDOWS.map((w) => [w, { days: Number(w), stats: statsByDays[Number(w)] }]),
  ) as Snapshot["ranges"];

  const dailyTrend90 = dailySeries(rows, 90, now, tz);

  return {
    generatedAt: new Date(now).toISOString().slice(0, 10),
    client: {
      name: tenant.name,
      assistantName: tenant.assistantName,
      timezone: tz,
    },
    rangeDays: 30,
    stats: ranges["30"].stats,
    dailyTrend: dailyTrend90.slice(-14),
    dailyTrend90,
    ranges,
    calls: [], // per-call list is fetched separately for the calls page
  };
}

export interface CallsQuery {
  page?: number;
  pageSize?: number;
  sentiment?: string;
  search?: string;
}

export async function getCalls(
  tenant: Tenant,
  query: CallsQuery = {},
): Promise<CallPage> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? 25;
  const hours = await businessHoursFor(tenant.slug);

  if (isLive(tenant) && tenant.subaccountId) {
    return fetchCalls(tenant.subaccountId, tenant.timezone, {
      page,
      limit: pageSize,
      sentiment: query.sentiment,
      search: query.search,
      hours,
    });
  }

  // demo: filter + paginate the static sample in memory
  const q = (query.search ?? "").trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const filtered = displayCalls().filter((c) => {
    const passSentiment = !query.sentiment || c.sentiment === query.sentiment;
    const passSearch =
      !q ||
      c.contactName.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      // Only match on phone when the query actually has digits — String.includes("")
      // is always true, which would return every call for a non-digit no-match query.
      (qDigits.length > 0 &&
        c.contactPhoneMasked.replace(/\D/g, "").includes(qDigits));
    return passSentiment && passSearch;
  });
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return {
    calls: applyHours(
      filtered.slice(start, start + pageSize),
      tenant.timezone,
      hours,
    ),
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    total,
  };
}

export async function getRecentCalls(
  tenant: Tenant,
  limit: number,
): Promise<CallRecord[]> {
  const hours = await businessHoursFor(tenant.slug);
  if (!isLive(tenant) || !tenant.subaccountId) {
    return applyHours(displayCalls().slice(0, limit), tenant.timezone, hours);
  }
  // pull a small page and prefer real conversations for the overview preview
  const { calls } = await fetchCalls(tenant.subaccountId, tenant.timezone, {
    page: 1,
    limit: 25,
    hours,
  });
  const real = calls.filter((c) => c.summary !== "No conversation recorded");
  return (real.length >= limit ? real : calls).slice(0, limit);
}

export async function getCallDetail(
  tenant: Tenant,
  id: string,
): Promise<CallRecord | null> {
  const hours = await businessHoursFor(tenant.slug);
  if (!isLive(tenant) || !tenant.subaccountId) {
    const call = getCallById(id);
    if (!call) return null;
    return applyHours([call], tenant.timezone, hours)[0];
  }
  const call = await fetchCallDetail(
    tenant.subaccountId,
    tenant.timezone,
    id,
    hours,
  );
  if (call?.hasRecording) {
    // expose only our gated proxy path; the raw R2 URL stays server-side
    call.recordingUrl = `/api/recording/${encodeURIComponent(call.id)}`;
  }
  return call;
}

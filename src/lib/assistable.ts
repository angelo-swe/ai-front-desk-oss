import "server-only";
import { unstable_cache } from "next/cache";
import type { CallRecord, CallStatus, Sentiment } from "./types";
import type { CallRow } from "./aggregate";
import { deriveCallerName, maskPhone } from "./phone";
import { cleanTranscript } from "./transcript";
import {
  type BusinessHours,
  DEFAULT_BUSINESS_HOURS,
  isAfterHours,
} from "./business-hours";

// Server-only Assistable REST client. Holds the API key and injects the tenant's
// X-Subaccount-Id. NEVER imported by client components. Every response is mapped
// into the client-safe DTOs in types.ts — cost/revenue, internal IDs, and recording
// URLs are dropped here so they never leave the server.

const BASE = "https://api.assistable.ai";

function key(): string {
  const k = process.env.ASSISTABLE_API_KEY;
  if (!k) throw new Error("ASSISTABLE_API_KEY is not set");
  return k;
}

async function api<T>(
  path: string,
  subaccountId: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key()}`,
      "X-Subaccount-Id": subaccountId,
    },
    // Cache aggregates briefly so the browser doesn't drive repeated upstream calls.
    next: { revalidate: 120 },
    // Bound the upstream call so a slow/hung Assistable response can't hold a
    // request slot until the platform 504s.
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Assistable ${path} -> ${res.status}`);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

const iso = (d: Date) => d.toISOString();

const MAX_PAGES = 60; // backstop against runaway pagination
const PAGE_CONCURRENCY = 8; // parallel page fetches per batch

type RowsPage = { calls: Array<Record<string, unknown>>; total_pages?: number };

function toRow(c: Record<string, unknown>): CallRow {
  return {
    durationSeconds: Number(c.totalDurationSeconds ?? 0),
    status: String(c.callStatus ?? ""),
    sentiment: String(c.userSentiment ?? ""),
    startedAt: String(c.startTimestamp ?? c.createdAt ?? ""),
  };
}

async function fetchCallRowsUncached(
  subaccountId: string,
  startIso: string,
  endIso: string,
): Promise<CallRow[]> {
  const fetchPage = (page: number) =>
    api<RowsPage>("/v3/calls", subaccountId, {
      start_date: startIso,
      end_date: endIso,
      limit: 100,
      page,
    });

  // Page 1 tells us how many pages there are; fetch the rest in parallel batches
  // instead of one serial round-trip per page (was up to 60 sequential requests).
  const first = await fetchPage(1);
  const rows = (first.calls ?? []).map(toRow);
  const totalPages = Math.min(first.total_pages ?? 1, MAX_PAGES);

  for (let p = 2; p <= totalPages; p += PAGE_CONCURRENCY) {
    const batch = [];
    for (let i = p; i < p + PAGE_CONCURRENCY && i <= totalPages; i++) {
      batch.push(fetchPage(i));
    }
    // allSettled, not all: one 429/500 page shouldn't fail the whole 90-day pull
    // and trip the overview error boundary. Drop the bad page, keep the rest.
    const results = await Promise.allSettled(batch);
    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const c of result.value.calls ?? []) rows.push(toRow(c));
      } else {
        console.warn("Assistable call page failed, skipping:", result.reason);
      }
    }
  }
  return rows;
}

/** Lightweight rows for aggregation (no PII needed). Paginates the window in
 * parallel and caches the result briefly so repeat visitors / the same render
 * don't re-pull the whole 90-day window. */
export async function fetchCallRows(
  subaccountId: string,
  days: number,
): Promise<CallRow[]> {
  const now = Date.now();
  const end = new Date(now);
  const start = new Date(now - days * 86_400_000);
  const dayKey = end.toISOString().slice(0, 10); // refresh the cache daily
  const cached = unstable_cache(
    () => fetchCallRowsUncached(subaccountId, iso(start), iso(end)),
    ["call-rows", subaccountId, String(days), dayKey],
    { revalidate: 120, tags: [`calls-${subaccountId}`] },
  );
  return cached();
}

function mapCall(
  c: Record<string, unknown>,
  timeZone: string,
  hours: BusinessHours = DEFAULT_BUSINESS_HOURS,
): CallRecord {
  const status = String(c.callStatus ?? "") as CallStatus;
  const startedAt = String(c.startTimestamp ?? c.createdAt ?? "");
  const contact = (c.contact ?? {}) as Record<string, unknown>;
  const assistant = (c.assistant ?? {}) as Record<string, unknown>;
  return {
    id: String(c.id ?? c.callId ?? ""),
    direction: c.direction === "outbound" ? "outbound" : "inbound",
    status,
    answered: status === "COMPLETED",
    afterHours: isAfterHours(startedAt, timeZone, hours),
    contactName: deriveCallerName(contact.name, contact.phone),
    contactPhoneMasked: maskPhone(contact.phone),
    durationSeconds: Number(c.totalDurationSeconds ?? 0),
    sentiment: (String(c.userSentiment || "NEUTRAL").toUpperCase() as Sentiment) ?? "NEUTRAL",
    summary:
      c.callSummary && c.callSummary !== "No conversation data available"
        ? String(c.callSummary)
        : "No conversation recorded",
    startedAt,
    assistantName: String(assistant.name ?? ""),
    hasRecording: Boolean(c.recordingUrl),
    // recordingUrl intentionally dropped — recordings come later behind signed URLs
  };
}

export interface CallPage {
  calls: CallRecord[];
  page: number;
  totalPages: number;
  total: number;
}

export async function fetchCalls(
  subaccountId: string,
  timeZone: string,
  opts: {
    page?: number;
    limit?: number;
    sentiment?: string;
    search?: string;
    hours?: BusinessHours;
  } = {},
): Promise<CallPage> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = opts.limit ?? 25;
  const data = await api<{
    calls: Array<Record<string, unknown>>;
    total_records?: number;
    total_pages?: number;
  }>("/v3/calls", subaccountId, {
    page,
    limit,
    sentiment: opts.sentiment,
    search: opts.search,
  });
  const calls = (data.calls ?? []).map((c) => mapCall(c, timeZone, opts.hours));
  const total = data.total_records ?? calls.length;
  // When the API reports total_records, derive pages from it (exact) so the
  // "Next" button can't enable past the last page on total_pages drift. Only
  // trust the API's total_pages when we have no record count to compute from.
  const totalPages =
    data.total_records !== undefined
      ? Math.max(1, Math.ceil(total / limit))
      : (data.total_pages ?? 1);
  return { calls, page, totalPages, total };
}

export async function fetchCallDetail(
  subaccountId: string,
  timeZone: string,
  id: string,
  hours?: BusinessHours,
): Promise<CallRecord | null> {
  try {
    const c = await api<Record<string, unknown>>(
      `/v3/calls/${encodeURIComponent(id)}`,
      subaccountId,
    );
    const base = mapCall(c, timeZone, hours);
    const turns = (c.transcriptObject ?? []) as Array<Record<string, unknown>>;
    base.transcript = cleanTranscript(turns);
    return base;
  } catch {
    return null;
  }
}

/** Server-only: the raw recording URL for a call. Never returned to the browser —
 * used by the auth-gated /api/recording proxy to stream the audio. */
export async function fetchRecordingUrl(
  subaccountId: string,
  id: string,
): Promise<string | null> {
  try {
    const c = await api<Record<string, unknown>>(
      `/v3/calls/${encodeURIComponent(id)}`,
      subaccountId,
    );
    const url = c.recordingUrl;
    return typeof url === "string" && url ? url : null;
  } catch {
    return null;
  }
}

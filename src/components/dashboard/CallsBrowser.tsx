"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, PhoneOff, Search, X } from "lucide-react";
import { CallRow } from "./CallRow";
import { cn } from "@/lib/utils";
import type { CallRecord } from "@/lib/types";

const FILTERS = [
  { key: "", label: "All" },
  { key: "POSITIVE", label: "Happy" },
  { key: "NEUTRAL", label: "Neutral" },
  { key: "NEGATIVE", label: "Unhappy" },
];

export function CallsBrowser({
  calls,
  page,
  totalPages,
  total,
  sentiment,
  q,
  timeZone,
}: {
  calls: CallRecord[];
  page: number;
  totalPages: number;
  total: number;
  sentiment: string;
  q: string;
  timeZone?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(q);

  function go(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in updates)) next.delete("page"); // reset to page 1 on filter/search change
    const qs = next.toString();
    // Don't push an identical URL — on live tenants each push re-fetches calls.
    if (qs === params.toString()) return;
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: query.trim() });
        }}
        className="relative"
      >
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
          aria-hidden="true"
        />
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          aria-label="Search calls"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by first name, last 4 of phone, or what was said..."
          className="focus-ring w-full rounded-xl border border-border bg-bg-card py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-foreground-subtle"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              go({ q: "" });
            }}
            className="focus-ring absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key || "all"}
            type="button"
            aria-pressed={sentiment === f.key}
            onClick={() => go({ sentiment: f.key })}
            className={cn(
              "focus-ring rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              sentiment === f.key
                ? "border-primary bg-primary text-white"
                : "border-border text-foreground-muted hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-foreground-subtle tnum">
          {total.toLocaleString()} call{total === 1 ? "" : "s"}
        </span>
      </div>

      <section className="liquid-glass overflow-hidden">
        {calls.length > 0 ? (
          <div className="divide-y divide-border">
            {calls.map((call) => (
              <CallRow key={call.id} call={call} timeZone={timeZone} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <PhoneOff className="h-7 w-7 text-foreground-subtle" aria-hidden="true" />
            {sentiment || q ? (
              <>
                <p className="font-medium text-foreground">No calls match</p>
                <p className="max-w-xs text-sm text-foreground-muted">
                  Try a different filter or clear your search.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground">No calls yet</p>
                <p className="max-w-xs text-sm text-foreground-muted">
                  As soon as your AI line takes a call, it&apos;ll appear here.
                </p>
              </>
            )}
          </div>
        )}
      </section>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => go({ page: String(page - 1) })}
            className="focus-ring inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Prev
          </button>
          <span className="text-sm text-foreground-subtle tnum">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => go({ page: String(page + 1) })}
            className="focus-ring inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import {
  type BusinessHours,
  DAY_LABELS,
  formatHourLabel,
} from "@/lib/business-hours";
import { cn } from "@/lib/utils";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h); // 0–23
const CLOSE_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1); // 1–24

export function BusinessHoursForm({
  initial,
  timezone,
}: {
  initial: BusinessHours;
  timezone: string;
}) {
  const router = useRouter();
  const [openHour, setOpenHour] = useState(initial.openHour);
  const [closeHour, setCloseHour] = useState(initial.closeHour);
  const [days, setDays] = useState<number[]>(initial.days);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = closeHour > openHour && days.length > 0;

  function toggleDay(d: number) {
    setSaved(false);
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  }

  async function save() {
    if (!valid) {
      setError("Pick a closing time after opening, and at least one open day.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/business-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openHour, closeHour, days }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save. Try again.");
      } else {
        setSaved(true);
        router.refresh(); // re-renders call lists so the After-hours badge updates
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setSaving(false);
  }

  const tzLabel = timezone.replace("_", " ");

  return (
    <section className="liquid-glass p-5 sm:p-6">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Business hours
      </h2>
      <p className="mt-1 text-sm text-foreground-muted">
        Calls outside these hours get an “After hours” badge. Times are in your
        timezone ({tzLabel}).
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
            Opens
          </span>
          <select
            value={openHour}
            onChange={(e) => {
              setSaved(false);
              setOpenHour(Number(e.target.value));
            }}
            className="focus-ring rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-foreground"
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {formatHourLabel(h)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
            Closes
          </span>
          <select
            value={closeHour}
            onChange={(e) => {
              setSaved(false);
              setCloseHour(Number(e.target.value));
            }}
            className="focus-ring rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-foreground"
          >
            {CLOSE_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {formatHourLabel(h)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Open days
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_LABELS.map((label, d) => {
            const on = days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d)}
                className={cn(
                  "focus-ring min-w-11 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-border text-foreground-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !valid}
          aria-busy={saving}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="sr-only">Saving…</span>
            </>
          ) : (
            "Save hours"
          )}
        </button>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success-text">
            <Check className="h-4 w-4" aria-hidden="true" />
            Saved
          </span>
        ) : null}
      </div>
    </section>
  );
}

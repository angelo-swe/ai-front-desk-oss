"use client";

import { RANGE_OPTIONS, type RangeKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DayRangeSwitcher({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (r: RangeKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Time range"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-bg-card/60 p-1"
    >
      {RANGE_OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "focus-ring rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors sm:px-3",
              active
                ? "bg-primary text-white"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {opt.key}
            <span className="ml-1">days</span>
          </button>
        );
      })}
    </div>
  );
}

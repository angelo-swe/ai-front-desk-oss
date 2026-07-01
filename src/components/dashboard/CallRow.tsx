import Link from "next/link";
import { ChevronRight, Clock, Moon, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { SentimentChip } from "./SentimentChip";
import { formatDuration, formatRelativeTime } from "@/lib/metrics";
import type { CallRecord } from "@/lib/types";

export function CallRow({
  call,
  timeZone,
}: {
  call: CallRecord;
  timeZone?: string;
}) {
  const Dir = call.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;
  const relative = formatRelativeTime(call.startedAt, undefined, timeZone);
  return (
    <Link
      href={`/calls/${call.id}`}
      className="focus-ring group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-foreground/[0.03] sm:px-5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground-muted">
        <Dir className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">
          {call.direction === "inbound" ? "Inbound call" : "Outbound call"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground">
            {call.contactName}
          </span>
          {call.afterHours ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary"
              title="Caught outside business hours"
            >
              <Moon className="h-2.5 w-2.5" aria-hidden="true" /> After hours
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-sm text-foreground-muted">
          {call.summary}
        </p>
        {/* Mobile: the desktop right column is hidden, so surface sentiment + time
            here. Without this, phone users see no sentiment, duration, or time. */}
        <div className="mt-2 flex items-center gap-2 text-xs text-foreground-subtle sm:hidden">
          <SentimentChip sentiment={call.sentiment} />
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatDuration(call.durationSeconds)}
          </span>
          {relative ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{relative}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
        <SentimentChip sentiment={call.sentiment} />
        <span className="flex items-center gap-2 text-xs text-foreground-subtle">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatDuration(call.durationSeconds)}
          </span>
          {relative ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{relative}</span>
            </>
          ) : null}
        </span>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-foreground-subtle transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

import raw from "@/data/demo-snapshot.json";
import type { CallRecord, Snapshot } from "@/lib/types";

export const snapshot = raw as Snapshot;

export function getCallById(id: string): CallRecord | undefined {
  return snapshot.calls.find((c) => c.id === id);
}

// The static snapshot never changes, so filter+sort it once and reuse the array
// (previously recomputed on every overview/calls navigation).
const displayCallsCache: CallRecord[] = snapshot.calls
  .filter((c) => c.summary && c.summary !== "No conversation data available")
  .slice()
  .sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

/** Calls that have a real summary (drops voicemail/no-data rows) for list display. */
export function displayCalls(): CallRecord[] {
  return displayCallsCache;
}

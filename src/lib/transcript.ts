import type { TranscriptLine } from "./types";

// Roles that the AI speaks under.
const AGENT_ROLES = new Set(["agent", "assistant", "ai", "bot"]);
// Internal turns the model exchanges with backend tools — never spoken aloud,
// never shown to a client (they carry raw JSON payloads).
const TOOL_ROLES = new Set([
  "tool",
  "function",
  "system",
  "developer",
  "tool_call",
  "function_call",
]);

/** True when a transcript line is an internal tool/function payload (a JSON blob
 * the assistant exchanged with a backend tool) rather than spoken conversation.
 * Clients read these transcripts, so the raw JSON must never surface. */
function isToolPayload(text: string): boolean {
  const t = text.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return false;
  try {
    return typeof JSON.parse(t) === "object";
  } catch {
    return false;
  }
}

/** Map Assistable `transcriptObject` turns to client-safe transcript lines:
 * keep only spoken agent/caller turns, drop tool/function/system turns and any
 * JSON tool payloads, and trim empties. Pure so the live BFF can reuse + test it. */
export function cleanTranscript(
  turns: Array<Record<string, unknown>>,
): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  for (const t of turns) {
    const role = String(t.role ?? "").toLowerCase().trim();
    const text = String(t.content ?? "").trim();
    if (!text) continue;
    if (TOOL_ROLES.has(role)) continue;
    if (isToolPayload(text)) continue;
    // Agent roles map to "agent"; any other speaking role (user/caller/customer/
    // human/…) falls back to "caller" so we never drop a real human turn.
    lines.push({ role: AGENT_ROLES.has(role) ? "agent" : "caller", text });
  }
  return lines;
}

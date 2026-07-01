// Pure caller-identity helpers. Kept out of the server-only assistable.ts so they
// stay unit-testable and reusable. No PII leaves these functions beyond a masked
// last-4 — the full phone number is never returned.

const digitsOf = (raw: unknown): string => String(raw ?? "").replace(/\D/g, "");

/** Mask a raw phone number to the snapshot style ("+1 ••• ••• 7098"). The full
 * E.164 number is PII and must never reach the client DTO — only the last 4 and a
 * country-code hint survive. Returns "" when there aren't enough digits to mask. */
export function maskPhone(raw: unknown): string {
  const d = digitsOf(raw);
  if (d.length < 4) return "";
  const last4 = d.slice(-4);
  const cc = d.length > 10 ? `+${d.slice(0, d.length - 10)}` : "+1";
  return `${cc} ••• ••• ${last4}`;
}

/** A human caller label that is never the literal "Unknown caller". Falls back
 * from a real contact name to a masked-phone label ("Caller ••7098") to a plain
 * "Caller". We deliberately do NOT parse names out of the AI summary — a wrong
 * name (e.g. the assistant or a staff member named in the summary) is worse for a
 * client than a clean phone-derived label. */
export function deriveCallerName(rawName: unknown, rawPhone: unknown): string {
  const name = String(rawName ?? "").trim();
  if (name) return name;
  const d = digitsOf(rawPhone);
  if (d.length >= 4) return `Caller ••${d.slice(-4)}`;
  return "Caller";
}

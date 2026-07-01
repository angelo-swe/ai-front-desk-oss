// Pure Slack-channel helpers shared by the admin settings form and the
// server-side resolver. No `server-only` import so this stays unit-testable
// (same pattern as business-hours.ts). Channel ids are validated; the store is
// a single JSON blob keyed by tenant slug.

/** KV key holding the per-tenant override map: `{ "<slug>": "<channelId>" }`. */
export const SLACK_CHANNELS_KEY = "afd:slack-channels";

// Slack channel/group/DM ids: C/G/D then uppercase alphanumerics. Real ids are
// ~11 chars (e.g. "C0ABC123XYZ"); allow some slack but reject obvious junk.
const CHANNEL_ID_RE = /^[CGD][A-Z0-9]{7,}$/;

export function isValidSlackChannelId(id: string): boolean {
  return CHANNEL_ID_RE.test(id);
}

/** Parse the KV JSON blob into a `{ slug: channelId }` map, dropping any entry
 *  that isn't a valid channel id. Invalid/absent input yields `{}`. */
export function parseSlackMap(
  raw: string | null | undefined,
): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [slug, id] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof id === "string" && isValidSlackChannelId(id)) out[slug] = id;
    }
    return out;
  } catch {
    return {};
  }
}

/** Merge (or clear, when `channelId` is null/empty) one tenant's channel id into
 *  the KV JSON blob, returning the new blob. Other tenants are preserved. */
export function mergeSlackChannel(
  raw: string | null | undefined,
  slug: string,
  channelId: string | null,
): string {
  const map = parseSlackMap(raw);
  if (channelId) map[slug] = channelId;
  else delete map[slug];
  return JSON.stringify(map);
}

import "server-only";

// Minimal Upstash-compatible Redis REST client (zero dependency). Works with
// Vercel KV or an Upstash Redis integration — both expose a REST URL + token as
// env vars. If neither is configured, the app runs in env-only mode and none of
// these functions are called (see tenant-settings.ts / isSlackStoreWritable).

function kvConfig(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function isKvConfigured(): boolean {
  return kvConfig() !== null;
}

export async function kvGet(key: string): Promise<string | null> {
  const cfg = kvConfig();
  if (!cfg) return null;
  const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV GET failed: ${res.status}`);
  const data = (await res.json()) as { result: string | null };
  return data.result;
}

export async function kvSet(key: string, value: string): Promise<void> {
  const cfg = kvConfig();
  if (!cfg) throw new Error("KV not configured");
  // Upstash REST accepts the value in the request body for POST /set/<key>.
  const res = await fetch(`${cfg.url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}` },
    body: value,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV SET failed: ${res.status}`);
}

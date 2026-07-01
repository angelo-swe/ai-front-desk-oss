// Zero-dependency fixed-window rate limiter — a brute-force guard for auth.
//
// State lives in a caller-owned Map, so limits are enforced PER SERVER INSTANCE.
// On Vercel's Fluid Compute this meaningfully blunts brute-force for a
// low-traffic app, but it is NOT globally consistent across many instances.
// To make it distributed, back the same checkRateLimit() call with Upstash
// Redis (@upstash/ratelimit) instead of an in-memory Map — the signature and
// call sites stay the same.
//
// Pure and time-injectable (`now`) so it can be tested deterministically.

export type RateLimitEntry = { count: number; windowStart: number };
export type RateLimitStore = Map<string, RateLimitEntry>;

export type RateLimitOutcome = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

// Cap on distinct keys held at once. An attacker rotating a spoofed
// X-Forwarded-For could otherwise grow the Map without bound; when the cap is
// hit we drop expired entries (and, if still full, clear) before admitting a
// new key. Windows are short, so clearing only briefly relaxes limits.
const DEFAULT_MAX_ENTRIES = 10_000;

function pruneExpired(
  store: RateLimitStore,
  windowMs: number,
  now: number,
): void {
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= windowMs) store.delete(key);
  }
}

/**
 * Record one hit against `key` and report whether it is allowed.
 * Fixed window of `windowMs`; at most `limit` hits per window.
 * A blocked call does NOT consume further budget.
 */
export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowMs: number,
  now: number,
  maxEntries: number = DEFAULT_MAX_ENTRIES,
): RateLimitOutcome {
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    if (!entry && store.size >= maxEntries) {
      pruneExpired(store, windowMs, now);
      if (store.size >= maxEntries) store.clear();
    }
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((entry.windowStart + windowMs - now) / 1000),
      ),
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfterSeconds: 0 };
}

/** Clear a key's budget — call after a successful login so a legit user who
 *  fumbled their password a few times isn't left throttled. */
export function resetRateLimit(store: RateLimitStore, key: string): void {
  store.delete(key);
}

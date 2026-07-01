import { describe, expect, test } from "bun:test";
import {
  checkRateLimit,
  resetRateLimit,
  type RateLimitStore,
} from "./rate-limit";

const WINDOW = 60_000; // 1 minute

describe("checkRateLimit", () => {
  test("allows up to the limit, then blocks within the window", () => {
    const store: RateLimitStore = new Map();
    const t = 1_000;
    for (let i = 1; i <= 3; i++) {
      const r = checkRateLimit(store, "ip:a", 3, WINDOW, t);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(3 - i);
    }
    const blocked = checkRateLimit(store, "ip:a", 3, WINDOW, t);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  test("retryAfterSeconds counts down as the window elapses", () => {
    const store: RateLimitStore = new Map();
    checkRateLimit(store, "k", 1, WINDOW, 0); // consume the only slot
    const blocked = checkRateLimit(store, "k", 1, WINDOW, 45_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(15); // 60s - 45s
  });

  test("resets once the window fully elapses", () => {
    const store: RateLimitStore = new Map();
    checkRateLimit(store, "k", 1, WINDOW, 0);
    expect(checkRateLimit(store, "k", 1, WINDOW, 30_000).allowed).toBe(false);
    const after = checkRateLimit(store, "k", 1, WINDOW, WINDOW); // window rolled
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(0);
  });

  test("keys are independent", () => {
    const store: RateLimitStore = new Map();
    checkRateLimit(store, "ip:a", 1, WINDOW, 0);
    // a different key is unaffected by a's exhausted budget
    expect(checkRateLimit(store, "ip:b", 1, WINDOW, 0).allowed).toBe(true);
    expect(checkRateLimit(store, "ip:a", 1, WINDOW, 0).allowed).toBe(false);
  });

  test("resetRateLimit clears a key's budget (success path)", () => {
    const store: RateLimitStore = new Map();
    checkRateLimit(store, "k", 2, WINDOW, 0);
    checkRateLimit(store, "k", 2, WINDOW, 0); // budget now exhausted
    expect(checkRateLimit(store, "k", 2, WINDOW, 0).allowed).toBe(false);
    resetRateLimit(store, "k");
    expect(checkRateLimit(store, "k", 2, WINDOW, 0).allowed).toBe(true);
  });

  test("evicts expired entries when the max-entries cap is hit", () => {
    const store: RateLimitStore = new Map();
    // Fill two stale entries at t=0 with a tiny cap.
    checkRateLimit(store, "old:1", 5, WINDOW, 0, 2);
    checkRateLimit(store, "old:2", 5, WINDOW, 0, 2);
    expect(store.size).toBe(2);
    // A new key well after the window: stale entries are pruned to make room.
    const r = checkRateLimit(store, "fresh", 5, WINDOW, WINDOW + 1, 2);
    expect(r.allowed).toBe(true);
    expect(store.has("old:1")).toBe(false);
    expect(store.has("old:2")).toBe(false);
    expect(store.has("fresh")).toBe(true);
  });
});

import { beforeAll, describe, expect, test } from "bun:test";
import { signSession, verifySession, type SessionData } from "./session";

beforeAll(() => {
  process.env.AFD_SESSION_SECRET = "test-secret-do-not-use-in-prod";
});

const admin: SessionData = { id: "a@x.com", role: "admin", active: "acme" };

describe("session", () => {
  test("round-trips a valid session", async () => {
    const cookie = await signSession(admin);
    expect(await verifySession(cookie)).toEqual(admin);
  });

  test("rejects a tampered payload", async () => {
    const cookie = await signSession(admin);
    const [payload, sig] = cookie.split(".");
    // flip a char in the payload, keep the old signature
    const tampered = `${payload.slice(0, -1)}${payload.slice(-1) === "A" ? "B" : "A"}.${sig}`;
    expect(await verifySession(tampered)).toBeNull();
  });

  test("rejects garbage and empty", async () => {
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("nope")).toBeNull();
    expect(await verifySession("a.b.c")).toBeNull();
  });

  test("a client cannot forge admin role without the secret", async () => {
    // signed with a different secret -> signature won't verify
    process.env.AFD_SESSION_SECRET = "attacker-secret";
    const forged = await signSession({ id: "demo", role: "admin", active: "acme" });
    process.env.AFD_SESSION_SECRET = "test-secret-do-not-use-in-prod";
    expect(await verifySession(forged)).toBeNull();
  });
});

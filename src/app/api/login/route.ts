import { NextResponse } from "next/server";
import { defaultActiveSlug, verifyLogin } from "@/lib/tenants";
import {
  checkRateLimit,
  resetRateLimit,
  type RateLimitStore,
} from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  type SessionData,
} from "@/lib/session";

// Brute-force guard. Two fixed windows per 15 min: a broad per-IP cap that
// blunts credential-stuffing across accounts, and a tighter per-email cap
// against targeted guessing of one account. State is per server instance
// (see rate-limit.ts).
const WINDOW_MS = 15 * 60 * 1000;
const IP_MAX = 30;
const EMAIL_MAX = 5;
const ipStore: RateLimitStore = new Map();
const emailStore: RateLimitStore = new Map();

// Use the client IP that the platform sets and the client cannot forge.
// Vercel injects `x-vercel-forwarded-for` at the edge (overwriting anything the
// client sent); `x-real-ip` is likewise platform-set. We deliberately do NOT
// trust the client-controllable leftmost `x-forwarded-for`, which would let an
// attacker rotate a spoofed value to dodge the per-IP limit. Off-platform
// (local dev) there is no trusted source, so we bucket under "unknown" — where
// spoofing isn't a concern anyway.
function clientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: Request) {
  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "");
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = clientIp(req);
  const emailKey = email.toLowerCase();
  const now = Date.now();
  const ipCheck = checkRateLimit(ipStore, ip, IP_MAX, WINDOW_MS, now);
  const emailCheck = checkRateLimit(emailStore, emailKey, EMAIL_MAX, WINDOW_MS, now);
  if (!ipCheck.allowed || !emailCheck.allowed) {
    const retryAfter = Math.max(ipCheck.retryAfterSeconds, emailCheck.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const auth = verifyLogin(email, password);
  if (!auth) {
    return NextResponse.json(
      { error: "Incorrect email or password" },
      { status: 401 },
    );
  }

  // Successful login — clear the targeted counter so a legit user who mistyped
  // a few times isn't left throttled. The broad per-IP cap intentionally stays.
  resetRateLimit(emailStore, emailKey);

  const session: SessionData =
    auth.role === "client"
      ? { id: auth.slug, role: "client", active: auth.slug }
      : { id: auth.id, role: "admin", active: defaultActiveSlug() };

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

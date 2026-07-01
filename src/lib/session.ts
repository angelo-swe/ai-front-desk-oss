// Signed-cookie session. Uses Web Crypto (HMAC-SHA256) so it runs in BOTH the Edge
// middleware and Node route handlers with no dependency. The cookie carries the
// identity, role, and the tenant currently being viewed; the signature prevents
// tampering (a client can't forge role:"admin" or point at another tenant).

export const SESSION_COOKIE = "afd_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  id: string; // identity: clinic slug, or admin id
  role: "admin" | "client";
  active: string; // tenant slug currently being viewed
}

function secret(): string {
  const s = process.env.AFD_SESSION_SECRET;
  if (!s) throw new Error("AFD_SESSION_SECRET is not set");
  return s;
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return toHex(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function b64urlEncode(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
}

export async function signSession(data: SessionData): Promise<string> {
  const payload = b64urlEncode(JSON.stringify(data));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySession(
  value: string | undefined,
): Promise<SessionData | null> {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!timingSafeEqual(sig, await hmac(payload))) return null;
  try {
    const data = JSON.parse(b64urlDecode(payload)) as SessionData;
    if (!data?.id || !data?.role || !data?.active) return null;
    return data;
  } catch {
    return null;
  }
}

import { NextResponse } from "next/server";
import { currentSession } from "@/lib/server-data";
import { tenantBySlug } from "@/lib/tenants";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";

// Admin-only: re-point the session at a different tenant. Clients are rejected,
// so they can never switch away from their own data.
export async function POST(req: Request) {
  const session = await currentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let slug = "";
  try {
    slug = String((await req.json()).slug ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!tenantBySlug(slug)) {
    return NextResponse.json({ error: "Unknown tenant" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    SESSION_COOKIE,
    await signSession({ id: session.id, role: "admin", active: slug }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    },
  );
  return res;
}

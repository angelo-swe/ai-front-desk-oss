import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentTenant } from "@/lib/server-data";
import {
  BUSINESS_HOURS_COOKIE,
  mergeHoursIntoCookie,
  parseBusinessHours,
} from "@/lib/business-hours";

// Save the current tenant's business hours. Auth-scoped to the viewer's tenant:
// a client edits only their own; an admin edits the client they're viewing.
// Persisted in a cookie (no DB yet) keyed by tenant slug.
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const hours = parseBusinessHours(body);
  if (!hours) {
    return NextResponse.json(
      { error: "Invalid business hours" },
      { status: 400 },
    );
  }

  const jar = await cookies();
  const next = mergeHoursIntoCookie(
    jar.get(BUSINESS_HOURS_COOKIE)?.value,
    tenant.slug,
    hours,
  );

  const res = NextResponse.json({ ok: true, hours });
  res.cookies.set(BUSINESS_HOURS_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}

import { NextResponse } from "next/server";
import { currentTenant } from "@/lib/server-data";
import { isLive } from "@/lib/tenants";
import { fetchRecordingUrl } from "@/lib/assistable";

// Auth-gated recording proxy. Verifies the session, resolves the raw recording URL
// server-side (scoped to the tenant's subaccount, so a tenant can only reach their
// own calls), and streams the audio back. The raw R2 URL never reaches the browser,
// and the proxy path only works with a valid session cookie.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const tenant = await currentTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isLive(tenant) || !tenant.subaccountId) {
    return NextResponse.json({ error: "No recording" }, { status: 404 });
  }

  const { id } = await params;
  const url = await fetchRecordingUrl(tenant.subaccountId, id);
  if (!url) {
    return NextResponse.json({ error: "No recording" }, { status: 404 });
  }

  const range = _req.headers.get("range");
  const upstream = await fetch(url, {
    headers: range ? { Range: range } : {},
  });
  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "Recording unavailable" }, { status: 502 });
  }

  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("content-type")) headers.set("content-type", "audio/mpeg");
  headers.set("cache-control", "private, max-age=300");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}

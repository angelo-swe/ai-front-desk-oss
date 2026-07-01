import { NextResponse } from "next/server";
import { currentSession } from "@/lib/server-data";
import { tenantBySlug } from "@/lib/tenants";
import { isSlackStoreWritable, setSlackChannelId } from "@/lib/tenant-settings";
import { isValidSlackChannelId } from "@/lib/slack";

// Admin-only: set/clear a tenant's Slack channel id in the shared KV store.
// Clients are rejected (403), matching switch-tenant/route.ts. Requires a
// writable store (Vercel KV / Upstash); returns 501 in env-only mode.
export async function POST(req: Request) {
  const session = await currentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isSlackStoreWritable()) {
    return NextResponse.json(
      {
        error:
          "No writable store configured. Add Vercel KV / Upstash to edit Slack channels in-app.",
      },
      { status: 501 },
    );
  }

  let slug = "";
  let channelId = "";
  try {
    const body = await req.json();
    slug = String(body.slug ?? "");
    channelId = String(body.channelId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!tenantBySlug(slug)) {
    return NextResponse.json({ error: "Unknown tenant" }, { status: 400 });
  }
  if (channelId && !isValidSlackChannelId(channelId)) {
    return NextResponse.json(
      { error: "Invalid Slack channel id (expected e.g. C0ABC123XYZ)." },
      { status: 400 },
    );
  }

  try {
    await setSlackChannelId(slug, channelId || null);
  } catch {
    return NextResponse.json({ error: "Couldn't save. Try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, channelId: channelId || null });
}

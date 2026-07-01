import "server-only";
import { cache } from "react";
import { tenantBySlug } from "./tenants";
import { isKvConfigured, kvGet, kvSet } from "./kv";
import { SLACK_CHANNELS_KEY, mergeSlackChannel, parseSlackMap } from "./slack";

// Runtime-editable tenant settings that overlay the env config. Today this is
// just the Slack channel id. Env (AFD_TENANTS) is the baseline; when a KV store
// is configured, an admin's edits are persisted there and win over the env
// default. With no store, everything degrades to env-only (read-only in the UI).

/** True when a writable KV store is configured, so the admin edit UI can show. */
export function isSlackStoreWritable(): boolean {
  return isKvConfigured();
}

/** KV override map `{ slug: channelId }`, `cache()`d so the KV read runs once
 *  per request even though the resolver may be asked for several tenants. */
const slackOverrides = cache(async (): Promise<Record<string, string>> => {
  if (!isKvConfigured()) return {};
  try {
    return parseSlackMap(await kvGet(SLACK_CHANNELS_KEY));
  } catch {
    return {};
  }
});

/** Resolve a tenant's Slack channel id: KV override wins, else the env default
 *  (`tenant.slackChannelId`). */
export async function getSlackChannelId(
  slug: string,
): Promise<string | undefined> {
  const overrides = await slackOverrides();
  return overrides[slug] ?? tenantBySlug(slug)?.slackChannelId;
}

/** Persist (or clear, when `channelId` is null) a tenant's Slack channel id to
 *  the shared KV store. Throws if no store is configured — callers should gate
 *  on isSlackStoreWritable() first. */
export async function setSlackChannelId(
  slug: string,
  channelId: string | null,
): Promise<void> {
  if (!isKvConfigured()) throw new Error("No writable store configured");
  const next = mergeSlackChannel(await kvGet(SLACK_CHANNELS_KEY), slug, channelId);
  await kvSet(SLACK_CHANNELS_KEY, next);
}

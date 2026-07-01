"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { isValidSlackChannelId } from "@/lib/slack";

// Admin-only: set the Slack channel a client's "Message us on Slack" button
// opens. Persists via /api/tenant-slack (KV-backed). Mirrors BusinessHoursForm.
export function SlackChannelForm({
  slug,
  tenantName,
  initial,
}: {
  slug: string;
  tenantName: string;
  initial?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const valid = trimmed === "" || isValidSlackChannelId(trimmed);

  async function save() {
    if (!valid) {
      setError("Enter a valid channel id (e.g. C0ABC123XYZ), or leave blank to clear.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tenant-slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, channelId: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save. Try again.");
      } else {
        setSaved(true);
        router.refresh(); // re-renders the Slack CTA with the new deep link
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setSaving(false);
  }

  return (
    <section className="liquid-glass p-5 sm:p-6">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Slack channel <span className="text-foreground-subtle">· admin</span>
      </h2>
      <p className="mt-1 text-sm text-foreground-muted">
        The channel {tenantName}&apos;s “Message us on Slack” button opens. In
        Slack, open the channel → its name → <em>About</em>; the Channel ID is at
        the bottom. Leave blank to clear.
      </p>

      <div className="mt-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
            Channel ID
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setSaved(false);
              setValue(e.target.value);
            }}
            placeholder="C0ABC123XYZ"
            spellCheck={false}
            autoCapitalize="characters"
            autoComplete="off"
            className="focus-ring w-full max-w-xs rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-foreground"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !valid}
          aria-busy={saving}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="sr-only">Saving…</span>
            </>
          ) : (
            "Save channel"
          )}
        </button>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success-text">
            <Check className="h-4 w-4" aria-hidden="true" />
            Saved
          </span>
        ) : null}
      </div>
    </section>
  );
}

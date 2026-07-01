import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Moon,
  PhoneIncoming,
  PhoneOutgoing,
  Sparkles,
} from "lucide-react";
import { SentimentChip } from "@/components/dashboard/SentimentChip";
import { AudioPlaceholder } from "@/components/dashboard/AudioPlaceholder";
import { AudioPlayer } from "@/components/dashboard/AudioPlayer";
import { Transcript } from "@/components/dashboard/Transcript";
import { currentTenant, getCallDetail } from "@/lib/server-data";
import { formatClock, formatDuration } from "@/lib/metrics";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await currentTenant();
  if (!tenant) redirect("/");

  const { id } = await params;
  const call = await getCallDetail(tenant, id);
  if (!call) notFound();

  const Dir = call.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/calls"
        className="focus-ring inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All calls
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground break-words">
            {call.contactName}
          </h1>
          <p className="mt-1 flex flex-col text-sm text-foreground-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
            {call.contactPhoneMasked ? (
              <>
                <span>{call.contactPhoneMasked}</span>
                <span className="hidden sm:inline" aria-hidden="true">
                  ·
                </span>
              </>
            ) : null}
            <span>{formatClock(call.startedAt, tenant.timezone)}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SentimentChip sentiment={call.sentiment} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground-muted">
              <Dir className="h-3 w-3" aria-hidden="true" />
              {call.direction === "inbound" ? "Inbound" : "Outbound"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground-muted">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatDuration(call.durationSeconds)}
            </span>
            {call.afterHours ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Moon className="h-3 w-3" aria-hidden="true" />
                After hours
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <section className="liquid-glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
            Summary
          </span>
        </div>
        {call.summary === "No conversation recorded" ? (
          <p className="mt-3 text-[15px] italic leading-relaxed text-foreground-subtle">
            Call connected but no conversation was captured — likely a voicemail
            or an immediate hang-up.
          </p>
        ) : (
          <p className="mt-3 text-[15px] leading-relaxed text-foreground">
            {call.summary}
          </p>
        )}
        <p className="mt-4 text-sm text-foreground-subtle">
          Handled by {call.assistantName || tenant.assistantName}
        </p>
      </section>

      {call.recordingUrl ? (
        <AudioPlayer
          src={call.recordingUrl}
          seed={call.id}
          durationSeconds={call.durationSeconds}
          fileName={`recording-${call.startedAt.slice(0, 10)}.mp3`}
        />
      ) : (
        <AudioPlaceholder
          seed={call.id}
          durationSeconds={call.durationSeconds}
          isDemo={!tenant.subaccountId}
        />
      )}

      <section className="liquid-glass p-5 sm:p-6">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Transcript
        </span>
        <div className="mt-4">
          {call.transcript && call.transcript.length > 0 ? (
            <Transcript lines={call.transcript} />
          ) : (
            <p className="text-sm text-foreground-muted">
              No transcript available for this call.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

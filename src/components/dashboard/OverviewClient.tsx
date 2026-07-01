"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PhoneCall,
  Smile,
  ChevronRight,
} from "lucide-react";
import { HeroCard } from "./HeroCard";
import { StatCard } from "./StatCard";
import { SentimentBar } from "./SentimentBar";
import { CallRow } from "./CallRow";
import { DayRangeSwitcher } from "./DayRangeSwitcher";
import { kpisForRange, trendForRange } from "@/lib/metrics";
import { dashboardTitle } from "@/lib/constants";
import type { CallRecord, RangeKey, Snapshot } from "@/lib/types";

export function OverviewClient({
  snapshot,
  recent,
}: {
  snapshot: Snapshot;
  recent: CallRecord[];
}) {
  const [range, setRange] = useState<RangeKey>("30");
  const kpis = useMemo(() => kpisForRange(snapshot, range), [snapshot, range]);
  const trend = useMemo(() => trendForRange(snapshot, range), [snapshot, range]);
  const days = Number(range);
  const { client } = snapshot;
  const hasData = (snapshot.ranges["90"]?.stats.totalCalls ?? 0) > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {dashboardTitle(client.name)}
          </h1>
          <p className="mt-1 text-foreground-muted">
            Here&apos;s what {client.assistantName} handled over the last {days}{" "}
            days.
          </p>
        </div>
        {hasData ? (
          <DayRangeSwitcher value={range} onChange={setRange} />
        ) : null}
      </header>

      {!hasData ? (
        <section className="liquid-glass flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PhoneCall className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            No calls yet
          </h2>
          <p className="max-w-sm text-sm text-foreground-muted">
            Your AI line is live and ready. As soon as {client.assistantName}{" "}
            answers a call, you&apos;ll see it here — with summaries, recordings,
            and sentiment.
          </p>
        </section>
      ) : (
        <>
          {/* Keyed by range so the count-ups and chart replay on switch */}
          <div key={range} className="space-y-6">
        <HeroCard
          kpis={kpis}
          trend={trend}
          rangeDays={days}
          assistantName={client.assistantName}
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Completed"
            value={kpis.completed}
            sub={`${Math.round(kpis.completed / days).toLocaleString()}/day · of ${kpis.callsHandled.toLocaleString()} handled`}
            icon={CheckCircle2}
            accent="success"
          />
          <StatCard
            label="Avg call length"
            value={kpis.avgDurationSeconds}
            format="duration"
            sub="per conversation"
            icon={Clock}
          />
          <StatCard
            label="Happy callers"
            value={kpis.positive}
            sub="sounded satisfied"
            icon={Smile}
            accent="success"
          />
          <StatCard
            label="To review"
            value={kpis.toReview}
            sub={kpis.toReview > 0 ? "sounded unhappy — review" : "sounded unhappy"}
            icon={AlertTriangle}
            accent="destructive"
            href={kpis.toReview > 0 ? "/calls?sentiment=NEGATIVE" : undefined}
          />
        </div>

        <SentimentBar kpis={kpis} />
      </div>

      <section className="liquid-glass overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 sm:px-5">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Recent calls
          </h2>
          <Link
            href="/calls"
            aria-label="View all calls"
            className="focus-ring inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
          >
            View all
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {recent.length > 0 ? (
            recent.map((call) => (
              <CallRow key={call.id} call={call} timeZone={client.timezone} />
            ))
          ) : (
            <p className="px-4 py-8 text-center text-sm text-foreground-muted sm:px-5">
              No recent calls to show yet.
            </p>
          )}
        </div>
      </section>
        </>
      )}
    </div>
  );
}

import { Clock, PhoneCall } from "lucide-react";
import { CountUp } from "./CountUp";
import { TrendChart } from "./TrendChart";
import { formatHoursMinutes, type Kpis } from "@/lib/metrics";
import type { DailyPoint } from "@/lib/types";

export function HeroCard({
  kpis,
  trend,
  rangeDays,
  assistantName,
}: {
  kpis: Kpis;
  trend: DailyPoint[];
  rangeDays: number;
  assistantName: string;
}) {
  const classified = kpis.positive + kpis.neutral + kpis.negative || 1;
  const goodRate = Math.round(
    ((kpis.positive + kpis.neutral) / classified) * 100,
  );
  return (
    <section className="liquid-glass relative overflow-hidden p-6 sm:p-8">
      {/* brand glow accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.28), transparent 70%)",
        }}
      />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Calls handled · last {rangeDays} days
          </div>

          <div className="mt-3 flex items-end gap-3">
            <PhoneCall className="mb-2 hidden h-7 w-7 text-primary sm:block" />
            <CountUp
              value={kpis.callsHandled}
              className="text-6xl font-light leading-none tracking-tight tnum text-foreground sm:text-7xl"
            />
          </div>

          <p className="mt-4 max-w-md text-base text-foreground-muted">
            <span className="font-semibold text-foreground">
              {kpis.completed.toLocaleString()}
            </span>{" "}
            completed ·{" "}
            <span className="font-semibold text-foreground">
              {goodRate}%
            </span>{" "}
            positive or neutral
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-foreground-muted">
              {assistantName} saved your front desk
            </span>
            <span className="font-semibold text-foreground">
              {formatHoursMinutes(kpis.talkTimeMinutes)}
            </span>
          </div>
        </div>

        <div className="w-full lg:w-[46%]">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
            Call volume
          </p>
          <TrendChart data={trend} />
        </div>
      </div>
    </section>
  );
}

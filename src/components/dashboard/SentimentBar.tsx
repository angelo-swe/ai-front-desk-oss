import Link from "next/link";
import type { Kpis } from "@/lib/metrics";

export function SentimentBar({ kpis }: { kpis: Kpis }) {
  const total = kpis.positive + kpis.neutral + kpis.negative || 1;
  const goodRate = Math.round(((kpis.positive + kpis.neutral) / total) * 100);
  const seg = [
    { key: "Happy", n: kpis.positive, color: "var(--color-success)", sentiment: "POSITIVE" },
    { key: "Neutral", n: kpis.neutral, color: "var(--color-foreground-subtle)", sentiment: "NEUTRAL" },
    { key: "Unhappy", n: kpis.negative, color: "var(--color-destructive)", sentiment: "NEGATIVE" },
  ];

  return (
    <div className="liquid-glass p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Caller sentiment
        </span>
        <span className="text-sm font-medium text-success-text">
          {goodRate}% positive or neutral
        </span>
      </div>

      <div
        className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-bg-tertiary"
        role="img"
        aria-label={`Caller sentiment: ${kpis.positive} happy, ${kpis.neutral} neutral, ${kpis.negative} unhappy`}
      >
        {seg.map((s) => (
          <div
            key={s.key}
            style={{
              width: `${(s.n / total) * 100}%`,
              backgroundColor: s.color,
            }}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {seg.map((s) => (
          <Link
            key={s.key}
            href={`/calls?sentiment=${s.sentiment}`}
            className="focus-ring flex items-center gap-2 rounded-md transition-colors hover:text-foreground"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden="true"
            />
            <span className="text-sm text-foreground-muted">
              {s.key}{" "}
              <span className="font-medium text-foreground tnum">{s.n}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { Sentiment } from "@/lib/types";

const MAP: Record<Sentiment, { label: string; dot: string; text: string; ring: string }> = {
  POSITIVE: {
    label: "Happy",
    dot: "bg-success",
    text: "text-success-text",
    ring: "ring-success/20",
  },
  NEUTRAL: {
    label: "Neutral",
    dot: "bg-foreground-subtle",
    text: "text-foreground-muted",
    ring: "ring-border",
  },
  NEGATIVE: {
    label: "Unhappy",
    dot: "bg-destructive",
    text: "text-destructive",
    ring: "ring-destructive/20",
  },
  MIXED: {
    label: "Mixed",
    dot: "bg-warning",
    text: "text-warning",
    ring: "ring-warning/20",
  },
};

export function SentimentChip({
  sentiment,
  className,
}: {
  sentiment: Sentiment;
  className?: string;
}) {
  const s = MAP[sentiment] ?? MAP.NEUTRAL;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        s.text,
        s.ring,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  );
}

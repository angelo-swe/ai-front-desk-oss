import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp, type CountFormat } from "./CountUp";

interface StatCardProps {
  label: string;
  value: number;
  format?: CountFormat;
  sub?: string;
  icon?: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive";
  className?: string;
  /** When set, the card becomes a link (e.g. a stat that drills into filtered calls). */
  href?: string;
}

const ACCENT: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function StatCard({
  label,
  value,
  format,
  sub,
  icon: Icon,
  accent = "primary",
  className,
  href,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          {label}
        </span>
        {Icon ? (
          <Icon
            className={cn("h-4 w-4", ACCENT[accent])}
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="mt-3 text-4xl font-light tracking-tight tnum text-foreground">
        <CountUp value={value} format={format} />
      </div>
      {sub ? (
        <p className="mt-1.5 text-sm text-foreground-muted">{sub}</p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "liquid-glass focus-ring block p-5 transition-colors hover:bg-bg-card-hover sm:p-6",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("liquid-glass p-5 sm:p-6", className)}>{content}</div>
  );
}

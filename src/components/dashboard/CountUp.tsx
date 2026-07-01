"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { formatDuration } from "@/lib/metrics";

export type CountFormat = "number" | "duration";

interface CountUpProps {
  value: number;
  durationMs?: number;
  className?: string;
  format?: CountFormat;
}

function render(n: number, format: CountFormat): string {
  if (format === "duration") return formatDuration(n);
  return Math.round(n).toLocaleString();
}

export function CountUp({
  value,
  durationMs = 1100,
  className,
  format = "number",
}: CountUpProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReduced) return;
    const node = ref.current;
    if (!node) return;
    // Animate a scalar from ~0 to value and write the formatted result straight
    // to the DOM node. This is the same count-up as before, but it no longer
    // re-renders React ~60×/sec per instance (5 of these mount on the overview,
    // and remount on every range switch).
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: [0.33, 1, 0.68, 1], // easeOutCubic
      onUpdate: (n) => {
        node.textContent = render(n, format);
      },
    });
    return () => controls.stop();
  }, [value, durationMs, prefersReduced, format]);

  // SSR / no-JS / pre-hydration render the REAL value (not 0); the tween above
  // overwrites textContent from ~0 on mount, so JS users still get the count-up.
  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {render(value, format)}
    </span>
  );
}

"use client";

import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";
type State = "idle" | "thinking" | "responding";

type Props = {
  size?: Size;
  state?: State;
  className?: string;
};

const SIZE_PX: Record<Size, number> = {
  sm: 16,
  md: 32,
  lg: 96,
};

const RING_BLUR_PX: Record<Size, number> = {
  sm: 2,
  md: 6,
  lg: 14,
};

export function AIOrb({ size = "md", state = "idle", className }: Props) {
  const px = SIZE_PX[size];
  const blur = RING_BLUR_PX[size];
  const prefersReduced = useReducedMotion();

  const rotate = !prefersReduced && state === "thinking";
  const pulse = !prefersReduced && state === "idle";
  const flow = !prefersReduced && state === "responding";
  // Inner-ring color cycle: on for active states and the large hero orb; off for
  // the small idle header orb (avoids a permanent always-on animation there).
  const animateInner = rotate || flow || (!prefersReduced && size === "lg");

  return (
    <span
      aria-hidden
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: px, height: px }}
    >
      <m.span
        className="absolute inset-0 rounded-full"
        style={{
          background: "var(--ai-gradient-primary)",
          backgroundSize: "200% 100%",
          filter: `blur(${blur}px)`,
        }}
        animate={
          rotate
            ? { rotate: 360, backgroundPositionX: ["0%", "200%"] }
            : pulse
              ? { opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }
              : flow
                ? { backgroundPositionX: ["0%", "200%"] }
                : undefined
        }
        transition={
          rotate
            ? {
                rotate: { duration: 4, ease: "linear", repeat: Infinity },
                backgroundPositionX: {
                  duration: 3,
                  ease: "linear",
                  repeat: Infinity,
                },
              }
            : pulse
              ? { duration: 2.4, ease: "easeInOut", repeat: Infinity }
              : flow
                ? { duration: 2, ease: "linear", repeat: Infinity }
                : undefined
        }
      />

      <span
        className="absolute rounded-full bg-bg"
        style={{
          inset: Math.max(1, Math.round(px * 0.18)),
        }}
      />

      {/*
        Inner-ring gradient drift. Keep it on the large hero orb (login) and any
        active state — that subtle color cycle is part of the brand look. Skip it
        only for the small, always-mounted header orb, where idle would otherwise
        run a permanent rAF/compositor pass for no visible benefit.
      */}
      <m.span
        className="absolute rounded-full"
        style={{
          inset: Math.max(2, Math.round(px * 0.34)),
          background: "var(--ai-gradient-primary)",
          backgroundSize: "200% 100%",
        }}
        animate={
          animateInner ? { backgroundPositionX: ["0%", "200%"] } : undefined
        }
        transition={
          animateInner
            ? {
                duration: state === "thinking" ? 2 : 5,
                ease: "linear",
                repeat: Infinity,
              }
            : undefined
        }
      />
    </span>
  );
}

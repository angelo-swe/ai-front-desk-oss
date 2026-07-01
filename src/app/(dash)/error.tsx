"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function DashError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // surface for observability; replace with Sentry etc. later
    console.error("Dashboard render error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          We couldn&apos;t load this right now
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          There was a problem reaching your call data. This is usually temporary.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        <Link
          href="/overview"
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          The call or page you&apos;re looking for may have moved or no longer
          exists.
        </p>
      </div>
      <Link
        href="/calls"
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Back to calls
      </Link>
    </main>
  );
}

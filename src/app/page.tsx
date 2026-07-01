"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { AIOrb } from "@/components/shared/AIOrb";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AGENCY_NAME, PRODUCT_NAME } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/overview");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Sign in failed");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <AIOrb size="lg" state="idle" />
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-muted">
            {PRODUCT_NAME}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Sign in to see what your AI receptionist handled.
          </p>
        </div>

        <form onSubmit={onSubmit} className="liquid-glass space-y-4 p-6">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@yourpractice.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-foreground"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="focus-ring group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="sr-only">Signing in…</span>
              </>
            ) : (
              <>
                Sign in
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-foreground-subtle">
          Powered by{" "}
          <span className="font-medium text-foreground-muted">{AGENCY_NAME}</span>
        </div>
      </div>
    </main>
  );
}

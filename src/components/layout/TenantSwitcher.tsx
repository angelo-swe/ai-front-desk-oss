"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Loader2 } from "lucide-react";

export function TenantSwitcher({
  tenants,
  active,
}: {
  tenants: { slug: string; name: string }[];
  active: string;
}) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const activeName = tenants.find((t) => t.slug === active)?.name ?? active;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function pick(slug: string) {
    if (slug === active) {
      setOpen(false);
      return;
    }
    setSwitching(slug);
    await fetch("/api/switch-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setOpen(false);
    setSwitching(null);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Switch client — currently ${activeName}`}
        className="focus-ring flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 py-1.5 pl-3 pr-2 text-[13px] font-medium text-foreground transition-colors hover:border-primary/50"
      >
        <Building2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span className="hidden max-w-[120px] truncate sm:block">
          {activeName}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-foreground-subtle" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-bg-card shadow-xl"
        >
          <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle">
            Viewing client
          </p>
          <div className="max-h-72 overflow-y-auto py-1">
            {tenants.map((t) => (
              <button
                key={t.slug}
                role="menuitem"
                type="button"
                aria-current={t.slug === active ? "true" : undefined}
                onClick={() => pick(t.slug)}
                className="focus-ring flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-foreground/5"
              >
                <span className="truncate">{t.name}</span>
                {switching === t.slug ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground-subtle" aria-hidden="true" />
                ) : t.slug === active ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

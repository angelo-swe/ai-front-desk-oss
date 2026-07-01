"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu({
  clientName,
  isAdmin = false,
}: {
  clientName: string;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const initials = clientName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu — ${clientName}`}
        className="focus-ring flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5 transition-colors hover:border-foreground-subtle"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white"
        >
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-foreground sm:block">
          {clientName}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 text-foreground-subtle transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-bg-card shadow-xl"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-[11px] text-foreground-subtle">
              {isAdmin ? "Admin · viewing" : "Signed in as"}
            </p>
            <p className="truncate text-sm font-medium text-foreground">
              {clientName}
            </p>
          </div>
          <button
            role="menuitem"
            type="button"
            onClick={signOut}
            className="focus-ring flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground/5"
          >
            <LogOut className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

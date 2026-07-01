"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AIOrb } from "@/components/shared/AIOrb";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { TenantSwitcher } from "@/components/layout/TenantSwitcher";
import { NAV_ITEMS, PRODUCT_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AppHeader({
  clientName,
  isAdmin = false,
  tenants = [],
  activeSlug = "",
}: {
  clientName: string;
  isAdmin?: boolean;
  tenants?: { slug: string; name: string }[];
  activeSlug?: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="liquid-glass-strong mx-auto flex max-w-6xl items-center gap-3 rounded-2xl px-3 py-2.5 sm:rounded-full sm:px-5">
        <Link href="/overview" className="focus-ring flex items-center gap-2.5">
          <AIOrb size="md" />
          <span className="font-heading text-sm font-semibold tracking-tight text-foreground">
            {PRODUCT_NAME}
          </span>
        </Link>

        <nav aria-label="Main" className="ml-2 hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {isAdmin ? (
            <TenantSwitcher tenants={tenants} active={activeSlug} />
          ) : null}
          <ThemeToggle />
          <UserMenu clientName={clientName} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}

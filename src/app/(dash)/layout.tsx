import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { BrandFooter } from "@/components/layout/BrandFooter";
import { getHeaderContext } from "@/lib/server-data";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getHeaderContext();
  if (!ctx) redirect("/");

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="focus-ring sr-only z-50 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <AppHeader
        clientName={ctx.activeName}
        isAdmin={ctx.isAdmin}
        tenants={ctx.tenants}
        activeSlug={ctx.activeSlug}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-8"
      >
        {children}
        <BrandFooter />
      </main>
      <MobileNav />
    </div>
  );
}

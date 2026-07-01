import { redirect } from "next/navigation";
import { CallsBrowser } from "@/components/dashboard/CallsBrowser";
import { currentTenant, getCalls } from "@/lib/server-data";

export const metadata = { title: "Calls" };

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sentiment?: string; q?: string }>;
}) {
  const tenant = await currentTenant();
  if (!tenant) redirect("/");

  const sp = await searchParams;
  const sentiment = sp.sentiment ?? "";
  const q = sp.q ?? "";
  const page = Number(sp.page) || 1;

  const result = await getCalls(tenant, { page, sentiment, search: q });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Calls
        </h1>
        <p className="mt-1 text-foreground-muted">
          Every conversation {tenant.assistantName} handled, with a plain-English
          summary.
        </p>
      </header>
      <CallsBrowser
        calls={result.calls}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        sentiment={sentiment}
        q={q}
        timeZone={tenant.timezone}
      />
    </div>
  );
}

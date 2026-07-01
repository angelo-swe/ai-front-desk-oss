import { redirect } from "next/navigation";
import { OverviewClient } from "@/components/dashboard/OverviewClient";
import { currentTenant, getOverviewData, getRecentCalls } from "@/lib/server-data";

export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  const tenant = await currentTenant();
  if (!tenant) redirect("/");

  const [snapshot, recent] = await Promise.all([
    getOverviewData(tenant),
    getRecentCalls(tenant, 6),
  ]);

  return <OverviewClient snapshot={snapshot} recent={recent} />;
}

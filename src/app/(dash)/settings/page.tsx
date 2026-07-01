import { redirect } from "next/navigation";
import { Bell, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { businessHoursFor, currentSession, currentTenant } from "@/lib/server-data";
import { getSlackChannelId, isSlackStoreWritable } from "@/lib/tenant-settings";
import { BusinessHoursForm } from "@/components/dashboard/BusinessHoursForm";
import { SlackChannelForm } from "@/components/dashboard/SlackChannelForm";
import { AGENCY_CONTACT_EMAIL, AGENCY_NAME } from "@/lib/constants";

export const metadata = { title: "Settings" };

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const tenant = await currentTenant();
  if (!tenant) redirect("/");
  const hours = await businessHoursFor(tenant.slug);
  const session = await currentSession();
  const isAdmin = session?.role === "admin";
  const slackChannelId = await getSlackChannelId(tenant.slug);
  const slackEditable = isAdmin && isSlackStoreWritable();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-foreground-muted">
          Your AI front desk setup. To change anything, just ask {AGENCY_NAME}.
        </p>
      </header>

      <section className="liquid-glass overflow-hidden">
        <div className="divide-y divide-border">
          <Row icon={Phone} label="Business" value={tenant.name} />
          <Row
            icon={MessageCircle}
            label="AI receptionist"
            value={`${tenant.assistantName} · ${tenant.channels ?? "voice + chat"}`}
          />
          <Row
            icon={Bell}
            label="Timezone"
            value={tenant.timezone.replace("_", " ")}
          />
          <Row icon={ShieldCheck} label="Managed by" value={AGENCY_NAME} />
        </div>
      </section>

      <BusinessHoursForm initial={hours} timezone={tenant.timezone} />

      <section className="liquid-glass p-6 text-center">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Want to change how {tenant.assistantName} works?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground-muted">
          New hours, services, booking rules, or call scripts — message your team
          at {AGENCY_NAME} and we handle it for you. No settings to break.
        </p>
        {slackChannelId ? (
          <a
            href={`https://slack.com/app_redirect?channel=${slackChannelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Message us on Slack
          </a>
        ) : AGENCY_CONTACT_EMAIL ? (
          <a
            href={`mailto:${AGENCY_CONTACT_EMAIL}?subject=${encodeURIComponent(
              `AI Front Desk change request — ${tenant.name}`,
            )}&body=${encodeURIComponent(
              `Business: ${tenant.name} (${tenant.slug})\n\nWhat I'd like to change:\n`,
            )}`}
            className="focus-ring mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Request a change
          </a>
        ) : null}
      </section>

      {slackEditable ? (
        <SlackChannelForm
          slug={tenant.slug}
          tenantName={tenant.name}
          initial={slackChannelId}
        />
      ) : isAdmin ? (
        <p className="px-1 text-xs text-foreground-subtle">
          Slack channel IDs are managed via the <code>AFD_TENANTS</code> env var.
          Configure Vercel KV / Upstash to edit them here.
        </p>
      ) : null}
    </div>
  );
}

// Brand + contact are env-configurable so this app can be rebranded (or self-hosted)
// without code changes. Set NEXT_PUBLIC_AGENCY_NAME in the environment; the fallback
// below is a generic placeholder for a fresh checkout.
export const AGENCY_NAME =
  process.env.NEXT_PUBLIC_AGENCY_NAME || "Your Agency";
export const PRODUCT_NAME = "AI Front Desk";

/** Optional "Powered by" logo. Set NEXT_PUBLIC_LOGO_URL to a path under /public
 * (e.g. "/images/logo.png") or an absolute URL. Unset → text-only brand. */
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || "";

/** Where the Settings "Request a change" CTA points when a tenant has no Slack
 * channel. Configurable via env; empty (the default) hides the button entirely. */
export const AGENCY_CONTACT_EMAIL = process.env.AGENCY_CONTACT_EMAIL ?? "";

/** e.g. "Acme Clinic's AI Front Desk" */
export function dashboardTitle(clientName: string): string {
  return `${clientName}'s ${PRODUCT_NAME}`;
}

export const NAV_ITEMS = [
  { href: "/overview", label: "Overview" },
  { href: "/calls", label: "Calls" },
  { href: "/settings", label: "Settings" },
] as const;

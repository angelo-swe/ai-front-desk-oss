import "server-only";
import { verifyPassword } from "./password";

// Tenant roster + admin accounts. The built-in "demo" tenant serves the static
// anonymized snapshot (keeps the public demo + open-source build working). Real
// tenants and admins come from server-only env (AFD_TENANTS / AFD_ADMINS).
//
// Passwords are scrypt hashes ("saltHex:hashHex"), never plaintext.
// Nothing client-specific is hardcoded here, so this file is safe to open-source.

export interface Tenant {
  slug: string;
  email: string;
  /** scrypt hash "saltHex:hashHex" — never a plaintext password. */
  passwordHash: string;
  name: string;
  assistantName: string;
  timezone: string;
  /** Assistable subaccount id — present for live tenants, omitted for the demo. */
  subaccountId?: string;
  /** Slack channel id for this client's private channel (the "request a change" target). */
  slackChannelId?: string;
  /** Plan/channels label shown in Settings, e.g. "voice" or "voice + chat". */
  channels?: string;
}

export interface Admin {
  id: string; // identity (email, lowercased)
  email: string;
  passwordHash: string;
  name: string;
}

/** Who's logged in, before we decide which tenant they're viewing. */
export type AuthResult =
  | { role: "client"; slug: string }
  | { role: "admin"; id: string; name: string };

// Precomputed scrypt hashes (saltHex:hashHex) so we don't run scrypt at module
// load — that cost would block the first request on a cold start. The salt lives
// in the string, so verifyPassword still works. "demo"/"demo" is a public sample
// credential; DUMMY_HASH only equalizes login timing on an email miss.
const DEMO_HASH =
  "1607006149a410a3df033c5b03c89223:ce43112e139f3dc493420fb08684cc20746818f0a4a7b0693f98d4546c66da69e773bb73f1aee139220b86ee174c58dcc40ef4d41bdd78917d265ba9ca7bbc88";
const DUMMY_HASH =
  "afee6a4d63e035bb3380a23245d169ef:a28efe7b1fe6e9888c9a2ccb2126c58e9a8a2e22da00f93548255e8509abf014a2a96dd403d17a9851f10d49863067a5abaadfd4b7d981ca6bf36352b7e3fa57";

const DEMO_TENANT: Tenant = {
  slug: "demo",
  email: "demo@frontdesk.app",
  passwordHash: DEMO_HASH, // demo/demo — public sample credential
  name: "Acme Clinic",
  assistantName: "Ava",
  timezone: "America/New_York",
};

// Parse the tenant/admin env JSON once. These were previously re-parsed on every
// allTenants()/verifyLogin() call (~3× per page); memoize at module scope since
// process.env doesn't change at runtime.
let envTenantsCache: Tenant[] | undefined;
let envAdminsCache: Admin[] | undefined;

function envTenants(): Tenant[] {
  if (envTenantsCache) return envTenantsCache;
  const raw = process.env.AFD_TENANTS;
  if (!raw) return (envTenantsCache = []);
  try {
    const parsed = JSON.parse(raw) as Tenant[];
    return (envTenantsCache = Array.isArray(parsed) ? parsed : []);
  } catch {
    console.error("AFD_TENANTS is not valid JSON — ignoring.");
    return (envTenantsCache = []);
  }
}

function envAdmins(): Admin[] {
  if (envAdminsCache) return envAdminsCache;
  const raw = process.env.AFD_ADMINS;
  if (!raw) return (envAdminsCache = []);
  try {
    const parsed = JSON.parse(raw) as Array<Partial<Admin>>;
    if (!Array.isArray(parsed)) return (envAdminsCache = []);
    return (envAdminsCache = parsed
      .filter((a) => a.email && a.passwordHash)
      .map((a) => ({
        id: a.email!.toLowerCase(),
        email: a.email!,
        passwordHash: a.passwordHash!,
        name: a.name ?? "Admin",
      })));
  } catch {
    console.error("AFD_ADMINS is not valid JSON — ignoring.");
    return (envAdminsCache = []);
  }
}

export function allTenants(): Tenant[] {
  return [DEMO_TENANT, ...envTenants()];
}

export function tenantBySlug(slug: string): Tenant | undefined {
  return allTenants().find((t) => t.slug === slug);
}

export function isLive(tenant: Tenant): boolean {
  return Boolean(tenant.subaccountId);
}

/** Minimal, non-sensitive tenant list for the admin switcher UI (excludes the demo). */
export function tenantOptions(): { slug: string; name: string }[] {
  return allTenants()
    .filter((t) => t.slug !== "demo")
    .map((t) => ({ slug: t.slug, name: t.name }));
}

/** Default tenant an admin lands on: first live client, else the demo. */
export function defaultActiveSlug(): string {
  const live = allTenants().find((t) => t.subaccountId);
  return (live ?? allTenants()[0]).slug;
}

/** Verify email+password against clinics then admins. Constant-time hash compare. */
export function verifyLogin(email: string, password: string): AuthResult | null {
  const e = email.trim().toLowerCase();

  const tenant = allTenants().find((t) => t.email.toLowerCase() === e);
  if (tenant) {
    return verifyPassword(password, tenant.passwordHash)
      ? { role: "client", slug: tenant.slug }
      : null;
  }

  // a.id is already lowercased at parse time; compare against it so an admin email
  // configured with any uppercase letter can still authenticate (the tenant branch
  // above already lowercases — keep the two paths consistent).
  const admin = envAdmins().find((a) => a.id === e);
  if (admin) {
    return verifyPassword(password, admin.passwordHash)
      ? { role: "admin", id: admin.id, name: admin.name }
      : null;
  }

  verifyPassword(password, DUMMY_HASH); // equalize timing on miss
  return null;
}

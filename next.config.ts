import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Same-origin app: no external scripts/styles/media. next/font self-hosts fonts,
// next/image serves from /self, and recordings stream through our /api proxy.
// 'unsafe-inline' is required for Next's inline bootstrap + Tailwind styles;
// 'unsafe-eval' only in dev for HMR. Tighten with nonces later if needed.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  // If Sentry (or any browser telemetry) is wired up later, add its ingest origin
  // here, e.g. "connect-src 'self' https://*.ingest.sentry.io".
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Guarantee per-export tree-shaking for these icon/animation libs so the
  // client bundle only ships the icons/APIs actually imported.
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

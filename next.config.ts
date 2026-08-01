import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * nginx already sets HSTS, X-Frame-Options, X-Content-Type-Options and
 * Referrer-Policy on the public vhost. They are repeated here deliberately:
 * the standalone container listens on :3000, and anything reaching it without
 * traversing nginx — a misrouted proxy_pass, a second ingress, a container port
 * published by accident — would otherwise be served with no headers at all.
 * Duplicate headers are harmless because the values agree.
 *
 * Content-Security-Policy ships in REPORT-ONLY mode first. Next.js injects
 * inline bootstrap scripts and Tailwind emits inline styles, so an enforcing
 * policy without nonces would blank the page. Report-only lets violations be
 * observed against real traffic before switching. To enforce: rename the header
 * to `Content-Security-Policy` once the report stream is quiet, and only then
 * consider tightening 'unsafe-inline'.
 */
const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline'/'unsafe-eval' are required by the Next.js runtime bootstrap.
  // Removing them needs the nonce-based CSP integration, not a one-line change.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // The browser talks directly to Supabase for verses, lexicon and topics.
  `connect-src 'self' ${SUPABASE_ORIGIN}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Deny device APIs this app has no use for.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Content-Security-Policy-Report-Only', value: CSP },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Suppresses the `X-Powered-By: Next.js` banner — free reconnaissance for
  // anyone matching a framework version against a CVE list.
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      {
        // API responses must never be cached by a shared proxy.
        source: '/api/:path*',
        headers: [
          ...SECURITY_HEADERS,
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;

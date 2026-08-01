// ISA820 — Supabase Auth helpers (admin gate)
//
// Separate from src/lib/supabase.ts on purpose. That client is a plain browser
// client used for public reads and holds no session; this one manages the auth
// cookies that middleware needs to read on the server.
//
// Scope: gating /admin. AdminVaultManager is a read-only dashboard — every one of
// its Supabase calls is a .select() — so there is no privileged write path to
// build here. What it does expose is database statistics and the full knowledge
// base, which should not be public.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Who may reach /admin.
 *
 * Supabase Auth permits self-signup by default, so authentication alone is NOT
 * authorisation — without this list, anyone who registers an account reaches the
 * admin dashboard. Set ADMIN_ALLOWED_EMAILS to a comma-separated list.
 *
 * Fails CLOSED: an unset or empty list denies everyone rather than admitting
 * everyone. A misconfiguration should lock you out, not open the door.
 */
export function isAllowedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(email.toLowerCase());
}

/**
 * Build a request-scoped Supabase client that reads and refreshes auth cookies,
 * and return it alongside the response carrying any updated cookies.
 *
 * The returned response MUST be the one middleware returns when it allows the
 * request through, otherwise a refreshed session token is silently dropped and
 * the user is logged out at the next expiry.
 */
export function createMiddlewareClient(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return { supabase, res };
}

// ISA820 — route gate
//
// /admin was publicly routable with no authentication of any kind (SEC-002).
// It renders database statistics and the full knowledge base.
//
// Two checks, both required:
//   1. a valid Supabase session      — authentication
//   2. the email is on the allowlist — authorisation
//
// The second is not optional. Supabase Auth permits self-signup by default, so
// without an allowlist anyone who registers an account reaches the dashboard.

import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient, isAllowedAdmin } from '@/lib/supabase-auth';

export async function middleware(req: NextRequest) {
  const { supabase, res } = createMiddlewareClient(req);

  // getUser() revalidates the token against Supabase. getSession() only decodes
  // the cookie, which is client-supplied and therefore forgeable — never gate on
  // it in middleware.
  const { data: { user } } = await supabase.auth.getUser();

  const isLoginRoute = req.nextUrl.pathname.startsWith('/admin/login');

  if (isLoginRoute) {
    // Already signed in and authorised? Skip the login form.
    if (user && isAllowedAdmin(user.email)) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return res;
  }

  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  if (!isAllowedAdmin(user.email)) {
    // Authenticated but not authorised. Distinct destination so the reason is
    // legible, rather than bouncing to a login form they have already passed.
    return NextResponse.redirect(new URL('/admin/login?denied=1', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};

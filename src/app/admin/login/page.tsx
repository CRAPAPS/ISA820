'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Lock, LoaderCircle } from 'lucide-react';

// Sign-in only — no sign-up link, deliberately.
// Admin accounts are created in the Supabase dashboard and the email must also
// appear in ADMIN_ALLOWED_EMAILS. Offering registration here would let anyone
// mint an account, leaving only the allowlist between them and the dashboard;
// two gates are better than one.

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const denied = params.get('denied') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Never distinguish "no such account" from "wrong password" — that turns
      // the form into an account-enumeration oracle.
      setError('Sign-in failed. Check your credentials.');
      setBusy(false);
      return;
    }

    // refresh() so middleware re-runs against the freshly set session cookie.
    router.refresh();
    router.replace('/admin');
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-amber-400" />
          <h1
            className="text-lg font-bold text-gradient-gold"
            style={{ fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.08em' }}
          >
            ISA820 Admin
          </h1>
        </div>

        {denied && (
          <p className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            That account is not authorised for the admin vault.
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-slate-400 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs text-slate-400 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500/15 border border-amber-500/30 px-4 py-2.5 text-sm text-amber-300 hover:bg-amber-500/25 disabled:opacity-50 transition"
          >
            {busy
              ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Signing in…</>
              : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
          Accounts are provisioned in the Supabase dashboard. Access additionally
          requires the address to be listed in{' '}
          <span className="font-mono">ADMIN_ALLOWED_EMAILS</span>.
        </p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  // useSearchParams needs a Suspense boundary to prerender.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

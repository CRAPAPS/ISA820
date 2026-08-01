# ISA820 — Security Posture

Audit date: **2026-08-01**. Findings verified against the live project, not inferred
from source. Severity uses CVSS-style qualitative bands.

---

## CRITICAL — action required by the operator

### SEC-001 · Database publicly writable and deletable — RESOLVED 2026-08-02

Migrations 001/002 created `FOR ALL USING (true) WITH CHECK (true)` policies on
every table. `FOR ALL` covers INSERT, UPDATE and DELETE; `USING (true)` matches
every row. The anon key is a **public credential** — it is compiled into the
browser bundle served from isa820.com.

Verified live with the anon key alone:

| Probe | Result |
|---|---|
| `POST /rest/v1/knowledge_base` | `23505` unique-violation — RLS passed, row accepted |
| `DELETE` on `verses`, `tahot_words`, `tagnt_words`, `proper_names`, `strongs_lexicon`, `media_assets`, `standard_documents`, `knowledge_base` | **HTTP 204 on every one** |

`DELETE /rest/v1/verses?id=neq.<any-uuid>` erases 184,609 verses. The same shape
empties 439,372 manuscript word rows and every doctrinal document.

**Fix:** `supabase/migrations/005_security_lockdown.sql`. Drops all write policies,
keeps public SELECT, and revokes the underlying INSERT/UPDATE/DELETE grants from
`anon` and `authenticated` as defence in depth. Ingest scripts are unaffected —
they use `SUPABASE_SERVICE_ROLE_KEY`, and the service role bypasses RLS.

**Applied 2026-08-02** via the Supabase dashboard SQL Editor. DDL cannot be issued
from the application environment (no Postgres connection string; Supabase MCP
unauthenticated), so this migration is operator-run.

Note for anyone re-running it: `ALTER DEFAULT PRIVILEGES` requires the object type
(`ON TABLES`) before `FROM`, unlike the plain `REVOKE ... ON ALL TABLES IN SCHEMA`
above it. Omitting it raises `42601` and — because the script is wrapped in
`BEGIN…COMMIT` — rolls the whole migration back, which is the safe outcome.

**Post-fix verification**, re-running the same probes that found the hole, with the
public anon key only:

| Probe | Before | After |
|---|---|---|
| `DELETE` on all 12 tables | `204` (authorized) | **`401` — `42501 permission denied`** |
| `POST /knowledge_base` | `23505` (row accepted) | **`401` — `42501 permission denied`** |
| `PATCH /knowledge_base` | authorized | **`401`** |
| `SELECT` on `verses`, `tahot_words`, `knowledge_base`, `bible_books` | `200` | `200` — reader intact |
| `SELECT count(*) FROM verses` | — | `185288` |

`42501 permission denied for table` (rather than an empty RLS result) confirms both
layers are active: the GRANT-level revoke denies the statement outright, with RLS
behind it.

### SEC-002 · `/admin` has no authentication (UNRESOLVED — needs a decision)

`src/app/admin/page.tsx` renders `AdminVaultManager` with no auth check of any
kind. It is a publicly routable page that creates and deletes `knowledge_base`
and `media_assets` rows. Anyone can open `/admin` and destroy doctrinal content.

SEC-001's fix breaks its write actions (they use the anon key), which removes the
destructive capability but leaves the page readable. That is a mitigation, not a fix.

**Required:** move admin writes to a server route holding the service-role key
behind an authentication check, and gate the route in middleware. Do **not**
restore function by re-granting anon writes.

### SEC-003 · Credential rotation recommended

SEC-001 was exploitable for the lifetime of the deployment, and there is no audit
trail proving it was never exercised. Treat the database as having had an open
write path: rotate the Supabase anon and service-role keys and any API key
reachable from a compromised deploy. Re-verify row counts against the figures in
the project memory before assuming integrity.

---

## RESOLVED in this pass

| ID | Finding | Fix |
|---|---|---|
| SEC-004 | No security headers from the app itself; nginx-only, so any path reaching `:3000` directly was unprotected | `next.config.ts` sets X-Frame-Options `DENY`, nosniff, Referrer-Policy, HSTS, Permissions-Policy, CSP (Report-Only), `X-DNS-Prefetch-Control`; `no-store` on `/api/*` |
| SEC-005 | `X-Powered-By: Next.js` version disclosure | `poweredByHeader: false` |
| SEC-006 | `/api/analyst` unauthenticated with no input validation — unbounded strings interpolated into a paid LLM prompt | zod schema with per-field length caps; malformed input rejected 400 before any token is spent |
| SEC-007 | `/api/analyst` cost/availability DoS — an unauthenticated loop could exhaust the LLM quota and bill | per-IP limiter, 12 requests/60s, `Retry-After` on 429 |
| SEC-008 | `bible-external` interpolated `chapter` into an upstream URL path unvalidated | strict `^\d{1,3}$` + range check; `book` allowlist enforced before any upstream call |
| SEC-009 | `bible-external` relayed upstream error bodies to the browser | logged server-side, generic 502 returned |
| SEC-010 | `ws` — uninitialized memory disclosure + fragment DoS (high) | resolved via `npm audit fix` |
| SEC-011 | `postcss` — XSS and path traversal (high) | resolved by `next` 16.2.4 → 16.2.12 |

Verified after the changes: `tsc --noEmit` clean, `next build` clean, headers
confirmed present on a running production server, validation returns 400, limiter
returns 429.

---

## ACCEPTED / MONITORED

- **`sharp` < 0.35.0 (libvips CVE-2026-33327/33328/35590/35591, high).** Transitive
  under `next`; npm's only offered remediation is a downgrade to `next@9.3.3`,
  which is not viable. Exposure is materially reduced because
  `images: { unoptimized: true }` means sharp does not process request-supplied
  images at runtime. Re-check on each Next release.
- **CSP is Report-Only.** Next.js inline bootstrap and Tailwind inline styles
  require `'unsafe-inline'`; enforcing without nonces would blank the page.
  Observe reports, then switch the header name to enforce.
- **Rate limiting is in-memory.** Resets on deploy, does not span replicas.
  Acceptable for the current single-container deployment; move to Redis or the
  edge before scaling out.
- **`.env.local` is gitignored** (`.env*` at `.gitignore:34`) — verified not committed.

---

## Reporting

Send security issues to the repository owner privately. Do not open a public issue.

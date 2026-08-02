# ISA820 — Live Progress

**Updated: 2026-08-02.** Quick-resume state. Read this first.

---

## IN FLIGHT — verify before starting anything

| Item | State | How to check |
|---|---|---|
| `parse-tahot.mjs` re-run | **RUNNING** — TAHOT verses 21,088 → 21,333 and climbing | `node scripts/audit-bible-render.mjs`; TAHOT missing chapters must reach 0 |

If the process died with its session, re-run `node scripts/parse-tahot.mjs`.
It is idempotent (upserts on `book,chapter,verse,translation`).

---

## Render audit — the source of truth

Run: `node scripts/audit-bible-render.mjs`

Baseline at 2026-08-02 (185,288 rows): **103 missing chapters**.

| Translation | Missing | Status |
|---|---|---|
| TAHOT | 99 chapters | re-run in flight — words existed, `verses` rows never generated |
| BSB | Psalms, all 150 | **BLOCKED** — see below |
| ASV | Nahum 1–3 | **FIXED** 2026-08-02, 47 verses |
| WEB | Nahum 1–3 | **FIXED** 2026-08-02, 47 verses |
| YLT | Nahum 1–3 | **BLOCKED** — no source, see below |
| KJV | none | clean |
| TBESG | none | 1 markup-residue row (2 Peter 2:11), likely a detector false positive |

Also 20 chapters with verse-number gaps — some legitimate, since critical texts
omit verses the KJV numbers. Not yet triaged.

### BLOCKED: BSB Psalms
`scripts/import-bsb.js` does `require('xlsx')` and **`xlsx` is not in package.json**,
so the script cannot run at all. Install it, then determine whether Psalms is
absent from `ISA_MASTER_VAULT/01_Bible_Raw/English_Versions/Berean Bible.xlsx`
or was lost during a partial import, before re-importing.

### BLOCKED: YLT Nahum
Two dead ends, both verified 2026-08-02:
- **getbible.net** (the original importer's source) now 301-redirects *every*
  request via Cloudflare — dead for all books, not just Nahum.
- **bible-api.com** has no YLT minor prophets: Micah, Nahum and Habakkuk all
  return "not found", though YLT John returns 51 verses fine.

YLT already *has* Micah and Habakkuk in the DB, so those came from getbible before
it died. YLT/Nahum needs a third source.

**Root cause of the Nahum gaps:** `import-asv-ylt.js` logged
`SKIP <book> after 3 attempts` on failure and carried on. The warning scrolled
past; the gap survived until the audit went looking. Any new importer must fail
loudly — `backfill-english-chapters.mjs` exits non-zero on failure for this reason.

---

## Next, in order

1. Confirm the TAHOT re-run landed (audit → TAHOT 0 missing)
2. `npm i xlsx`, inspect the Berean workbook, re-import BSB Psalms
3. Find a YLT source for Nahum
4. Re-run audit — target 0 missing chapters
5. **Mobile layout pass** (not started)
6. TFLSJ ingest — written, dry-run clean, NOT yet run against production:
   `node scripts/ingest-tflsj.mjs` (5,024 entries, median definition 466 chars vs 7 now)
7. Speaker population — analyse what TAHOT/TAGNT settles on its own *before*
   writing guidance documents, so documents cover only real ambiguities

---

## Recently completed (2026-08-01/02)

- Analyst grounded in TAHOT/TAGNT; evidence hierarchy; six pillars (added Deut 18:18, John 17:3)
- 33,804 manuscript word rows recovered (Mark, Joel, Nahum, all versification-divergent verses)
- Security: RLS lockdown, `/admin` behind Supabase Auth, headers, rate limiting,
  credentials removed from source, keys rotated to `sb_publishable_`/`sb_secret_`
- WEB/ASV inline `|strong="G0000"` markup now parsed instead of printed raw (~62k rows)
- Fixed `isSupabaseConfigured()` rejecting the new 46-char publishable key — that
  had taken the whole reader down
- Container healthcheck fixed (`127.0.0.1`, not `localhost`) — had been red 8 weeks

Full security detail: `SECURITY.md`. Deploy method and gotchas: memory `deployment_log.md`.

---

## Deploy

```
git pull origin main
docker compose --env-file .env.local build     # --env-file REQUIRED for build args
docker compose up -d
```
Separate plink calls. Use `GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=echo git push` or
pushes hang on a credential prompt. Server nginx is `/etc/nginx/nginx.conf`.

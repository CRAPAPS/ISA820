# ISA820 — Live Progress

**Updated: 2026-08-02.** Quick-resume state. Read this first.

---

## IN FLIGHT

Nothing running. All work through commit `51ad37d` is **pushed and deployed**.

Verified live 2026-08-02: `/read/Psalms/1`, `/read/Song of Solomon/1`,
`/read/Nahum/1`, `/read/Mark/1`, `/read/Revelation/1` all 200; `/admin` 307
(gated); container healthy; analyst returned `TAHOT 4 word rows` for
Song of Solomon 1:1 — a book that was ungroundable before the rename.

**Deploy gotcha:** `git push` hangs indefinitely because `credential.helper=manager`
(Git Credential Manager) opens a GUI dialog that cannot be answered from a
non-interactive shell. `GIT_TERMINAL_PROMPT=0` does NOT suppress it — that covers
terminal prompts only. Use `GCM_INTERACTIVE=never` to fail fast and see the real
error, then re-authenticate GCM interactively.

---

## Render audit — the source of truth

Run: `node scripts/audit-bible-render.mjs`

**103 missing chapters → 1.** Only YLT Nahum remains, and it is source-blocked.

| Translation | Status |
|---|---|
| KJV, ASV, WEB, BSB, TBESG | **0 missing** |
| TAHOT | **0 missing** (was 99) |
| YLT | Nahum 1–3 — **BLOCKED**, no source |

Remaining minor: 1 markup-residue row (TBESG 2 Peter 2:11, likely a detector
false positive) and 19 chapters with verse-number gaps — some legitimate, since
critical texts omit verses the KJV numbers. Neither triaged.

### What was actually wrong — four instances of ONE bug class

Book names are a **join key**: the reader's `BOOK_CHAPTERS` map, `verses.book`
and `tahot_words.book_name` must all agree on the exact string. Every gap traced
back to a name that didn't match.

| Symptom | Cause | Fix |
|---|---|---|
| Mark, Joel, Nahum absent from manuscripts | parser maps said `Mar`/`Joe`/`Nah`; sources say `Mrk`/`Jol`/`Nam` | map corrected + backfill |
| BSB Psalms, all 150 chapters | Berean workbook says **"Psalm"**, app says **"Psalms"** — 2,461 rows were present all along, just unreachable | renamed in `verses` |
| TAHOT Song of Solomon, all 8 | parser said **"Song of Songs"**, app says **"Song of Solomon"** — also made the book **ungroundable for the analyst**, since `tahot_words.book_name` never matched | renamed in BOTH tables + parser map fixed |
| TAHOT 99 chapters | `backfill-manuscripts.mjs` wrote word rows but never regenerated `verses` | re-ran `parse-tahot.mjs` |

**Check book-name agreement first** whenever a book won't render. It is not
usually missing data.

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

1. **Mobile layout pass** (not started) — NEXT
2. Find a YLT source for Nahum (only remaining missing chapter)
3. Triage the 19 verse-number gaps and the 1 markup-residue row
4. Decide on 887 ASV rows still under book "Psalm" — ASV already has a complete
   2,461-verse "Psalms", so these look like duplicates from a partial second
   import. Deleting production rows needs your call; nothing done yet.
5. TFLSJ ingest — written, dry-run clean, NOT yet run against production:
   `node scripts/ingest-tflsj.mjs` (5,024 entries, median definition 466 chars vs 7 now)
6. Speaker population — analyse what TAHOT/TAGNT settles on its own *before*
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

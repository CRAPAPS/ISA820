# ISA820 — Live Progress

**Updated: 2026-08-02.** Quick-resume state. Read this first.

---

## ⚠ UNPUSHED WORK — do this first

Commit **`e140a9b`** ("Pin header, footer and reader nav; scroll only the chapter
content") is committed **locally only**. Remote and server are at `c2e75c5`.

`git push` is hanging because Git Credential Manager needs interactive
re-authentication and opens a GUI dialog no headless shell can answer. Run
`git push` from a normal terminal, complete the GCM prompt, then deploy.

Diagnostic: `GCM_INTERACTIVE=never git push` fails in ~2s with the real error
instead of hanging forever.

---

## Mobile / layout pass — state

**Deployed (`c2e75c5`):**
- Analyst panel is now `fixed right-0 top-[72px] bottom-0` instead of `sticky`.
  It was `sticky top-[72px]` inside a wrapper with `overflow-hidden`; an ancestor
  with overflow != visible becomes the sticky scroll container, and since that
  never scrolls, sticky never engaged — the panel sat near the top of the
  document and was invisible when you opened it from a verse deep in a chapter.
- Sidebar resets its internal scroll to top on each new verse (the analysis
  renders at the top of that scroll body, but the position persisted from
  browsing topic cards).
- Removed the nested `overflow-y-auto` on the reader column that produced two
  scrollbars on narrow screens.

**Committed, NOT yet deployed (`e140a9b`):**
- Shell is `h-screen overflow-hidden`, so the page itself never scrolls;
  header and footer stay pinned.
- `main` gets `min-h-0` — a flex child defaults to `min-height:auto` and refuses
  to shrink below its content, which defeats the overflow without it.
- Reading pane is the single scroll container.
- Reader NavBar is `sticky top-0 z-20` within that pane.

**Known, not yet addressed:** `PillarHeader` uses `flex-wrap sm:flex-nowrap`, so
below 640px it wraps to two rows and exceeds the hardcoded `72px` that
`top-[72px]` / `h-[calc(100vh-72px)]` assume in both page layouts. Awaiting the
user's mobile screenshot before changing header geometry.

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

### RESOLVED: ASV "Psalm" duplicates (2026-08-02)

`node scripts/audit-psalm-duplicates.mjs [--delete]`

887 ASV rows sat under `"Psalm"` alongside a complete 2,461-verse `"Psalms"`.
They were NOT simple duplicates — a raw comparison found **0** exact matches,
because the `"Psalms"` copy carries inline `|strong="H0000"` markup and the
`"Psalm"` copy is clean prose. Comparing words rather than encoding split them:

- **676 identical** once markup is normalised → **deleted**
- **211 genuinely different** → **PRESERVED**, deliberately

The 211 are not noise. They differ in ways that matter:
- the `"Psalm"` copy keeps the ASV's **square-bracket convention marking
  translator-supplied words** (`thou wilt not require [it]?`); the `"Psalms"`
  copy dropped the brackets
- punctuation differs between editions (`heart,` vs `heart:`)
- ASV 5:12 shows a **parsing defect** in the `"Psalm"` import — Psalm 6's
  superscription bled onto the end of the previous verse

So neither copy is strictly better: one has the Strong's mapping, the other the
bracket convention. Both are invisible to the reader (nothing queries `"Psalm"`),
so there is no urgency. Reconciling them is an editorial decision, not a
mechanical one — decide which convention should win before touching them.

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
4. **DONE 2026-08-02** — ASV "Psalm" rows resolved. See below.
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

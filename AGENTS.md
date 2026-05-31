# AGENTS.md — working on *A Life*

A guide for AI agents (and humans) modifying this repo. **Read this first.** The
player-facing overview is in [README.md](./README.md); design specs live in
[`docs/`](./docs).

---

## What this is

A meditative, generational life-sim. It is a **static site — no build step, no
framework, no client dependencies, vanilla HTML/CSS/JS.** It is hosted on Vercel
and has *optional* cloud saves via one serverless function + Supabase. Crucially,
it must also run by **opening `a-life.html` straight off disk (`file://`)**.

## Golden rules (do not break these)

1. **No build, no framework, no client deps, no ES modules.** The browser code is
   plain classic `<script>` files that share globals and load in a fixed order.
   ES modules break `file://` (CORS), so never add `import`/`export` to browser code.
2. **It must run from `file://`** (double-clicking `a-life.html`) *and* when served.
   Anything cloud/network must degrade gracefully to local-only.
3. **Keep the aesthetic.** Minimal, text-first, contemplative. The writing, the
   living canvas, and the constellation are the point. New UI should whisper, not shout.
4. **Never commit secrets.** The Supabase service-role key lives only in Vercel env vars.

## File map & load order

`a-life.html` links `styles.css`, then loads these scripts **in dependency order**
(they share globals — order matters):

| # | File | Responsibility |
|---|------|----------------|
| 1 | `core.js` | The `window.storage` adapter (localStorage shim), helpers (`rnd/clamp/pronouns/…`), global state (`S`, `P`, `RATE`), person factory, traits, relationships, logging, memory, `stageOf`, `fx`. |
| 2 | `content.js` | The `CARDS` array — every event / callback / moment. |
| 3 | `engine.js` | The sim: `tick`, yearly drift, ageing, `deathRoll`, `eligible`/`drawCard`/`presentCard`, `haveChild`. |
| 4 | `dynasty.js` | Death & succession (`die`, `epitaphFor`), the house (`SEATS`, reputation, heirlooms, secrets, `updateHouse`, `recordAncestor`), eulogy/heir screens, founders & new lines. |
| 5 | `ui.js` | Rendering: header, the "being" line, the **ephemeral log**, the Chronicle panes, pause/play. |
| 6 | `persistence.js` | Save slots, `save`/`loadSlot`, export/import codes, `inspectStorage`, `migrateLegacy`, the boot routine (offers "Continue"). |
| 7 | `cloud.js` | Optional cross-device sync (`window.AL_cloud`); hooks into save/load. |
| 8 | `scene.js` | The living-scene canvas (sky, sun/moon, growing tree, particles, stage-transition art). Exposes `window.AL_P`, `AL_mood`, `AL_reseed`. |
| 9 | `constellation.js` | The bloodline star-map canvas (`window.AL_buildStars`, `AL_stopStars`). |

Supporting files:

- `index.html` — tiny redirect → `a-life.html` (so the site root opens the game).
- `styles.css` — all styling (was inline; extracted).
- `assets/*.webp` — the 8 painterly images. See [docs/images.md](./docs/images.md).
- `api/chronicle.js` — the Vercel serverless route for cloud saves; the **only** code that touches Supabase.
- `vercel.json` — cache headers (revalidate html/css/js).
- `gallery.html` — dev-only preview of the image set; **not** part of the game.
- `docs/` — design specs ([cloud-saves](./docs/cloud-saves.md), [images](./docs/images.md)).

> Cross-file calls resolve at runtime (after every script has loaded), so load
> order only matters for *top-level* `const`/`let` referenced by later *top-level*
> code. Keep new top-level executable code self-contained.

## Key systems

- **Hidden-stat engine.** Five stats — vitality, mind, heart, spirit, means —
  drive everything but are never shown as numbers; the player sees prose + a few
  choices. `fx()` applies stat deltas and updates a per-life *aura* (warmth/light)
  that subtly tints the scene.
- **Life arc & succession.** Cards gate to the years and circumstances they
  belong to (`age:[lo,hi]` + `cond`; see "Add an event card"). **Every heir is
  born at age 0** and lives a full childhood→elder arc — succession (`succeed`)
  seeds a fresh childhood family (the bloodline parent named for the departed
  ancestor) and applies the inheritance — estate share, the house's standing,
  blended traits, heirlooms/secret, a parent's `nurture` — as *starting state*,
  not a head start in years. `deathRoll` adds a small vitality-modulated baseline
  mortality from age 6–54 (rare early death; infancy protected), and a reckless
  choice can set `P.flags.peril` to raise the odds briefly. Design + verified
  results: [docs/story-overhaul.md](./docs/story-overhaul.md).
- **Persistence (`core.js` + `persistence.js`).** All reads/writes go through an
  async `window.storage` (`get/set/delete/list`). A sandbox host may supply one;
  otherwise `core.js` shims it with `localStorage`. Keys: `alife:index` (slot
  summaries) and `alife:slot:N` (full save `S`, slots 1–6). Self-contained base64
  backup codes (`ALIFE1:…`) via export/import.
- **Cloud saves (`cloud.js` + `api/chronicle.js`).** Optional and login-free. Each
  dynasty gets a 20-char **chronicle code** stored in its save; `cloud.js`
  debounce-pushes the save to `/api/chronicle` (PUT) and adopts a newer copy on
  load (GET). The route uses the **service-role key (server-side only)** to upsert
  into Supabase `public.alife_saves` (RLS enabled, no policies = service-role
  only). Falls back to local-only when offline / on `file://`. Full design + env
  vars: [docs/cloud-saves.md](./docs/cloud-saves.md).
- **Living scene & constellation.** Canvas 2D, ambient. The scene reads age + aura
  (and shows the per-stage image at transitions); the constellation plots every
  life's decisions as a star-map.
- **Images.** Painterly backdrops at narrative beats. See [docs/images.md](./docs/images.md).

## Conventions

- **Code style:** match the surrounding terse, dense vanilla JS; 2-space indent;
  globals shared across files (no modules).
- **Commits:** the maintainer commits as `jonathanwxh-cell <jonathanwxh@gmail.com>`
  with inline flags (there is no global/per-repo git config — set them every time):
  ```sh
  git -c user.name="jonathanwxh-cell" -c user.email="jonathanwxh@gmail.com" commit -m "…"
  ```
  Agents acting for the maintainer should match this identity. (This email deploys
  cleanly on Vercel — see Gotchas.) Never run `git config --global`.
- **Verify before claiming done.** Actually run it. For browser-observable changes,
  load the page and check via DOM / `getComputedStyle` — headless screenshots time
  out on the always-animating canvas, so don't rely on them.

## Deployment

- Host: **Vercel**, project `a-life` (team `jons-projects-0e19e128`).
  **Pushing to `main` auto-deploys.** Manual: `vercel deploy --prod --yes --scope jons-projects-0e19e128`.
- `vercel.json` sets `Cache-Control: public, max-age=0, must-revalidate` on
  html/css/js so edits show on a normal refresh.
- Cloud env vars (in the Vercel project, **not** the repo): `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`.
- Live: **https://a-life-chi.vercel.app** · also works on GitHub Pages (static).

## Common tasks

- **Add an event card** → append to `CARDS` in `content.js`. Copy an existing
  entry's shape: `id`, `stage` (`child|youth|adult|midlife|elder|*`), weight `w`,
  `text` (string or `p => …`), and `choices[]` each with `t`, optional `h` (hint),
  and `do: p => { … }`. In `do`, use `fx(p, {…})`, `logLine(...)`, and
  `remember`/`held`/`recall` for callbacks that fire in later cards. Optional
  gating fields (prefer these — moments should fit the years/situation):
  `age:[lo,hi]` (eligible only while `lo ≤ P.age ≤ hi`; **replaces** the `stage`
  check when present), `cond: () => bool` (situation gate — reads the global `P`),
  `once: true` (fires at most once a life), `cool: N` (min years before a non-`once`
  card may redraw; default 10). A choice may set `p.flags.peril = p.age + N` to
  raise death odds for N years (earned risk — see `deathRoll`). The full field
  reference is in the header comment of `content.js`.
- **Add / regenerate an image** → see [docs/images.md](./docs/images.md). Generate
  via Codex's built-in `image_gen` tool (key-free), optimize to WebP, place in `assets/`.
- **Tune scene / transitions** → `scene.js` (e.g. the `STAGE_ART` map and the
  stage-title / stage-art timers).

## Gotchas (learned the hard way)

- **`window.storage` is not a browser API.** `core.js` shims it with `localStorage`.
  Don't assume a host provides it; on plain web / `file://` the shim is what makes saves work.
- **No ES modules** — they're blocked over `file://`. Plain ordered `<script>` +
  shared globals only.
- **Vercel commit email is counter-intuitive:** `jonathanwxh@gmail.com` deploys
  fine; the `…@users.noreply.github.com` form is the one Vercel *rejects*
  ("commit author could not be matched to a GitHub account").
- **Local-preview caching:** `python -m http.server` sends no revalidate header, so
  a local preview caches `*.js`/`*.css` hard — restart the server or hard-refresh
  when testing locally. The live site is fine (`vercel.json` revalidates).
- **Image cost-safety:** regenerate images via Codex's built-in `image_gen` tool —
  **not** the OpenAI Images API, which spends the maintainer's `OPENAI_API_KEY`.
- **Shared Supabase:** the `zo-playground` project holds other apps' tables too —
  namespace anything new as `alife_*`.

## Known issues / TODO

- The Load-menu ✕ deletes **locally only** — a synced dynasty's cloud row persists
  under its chronicle code (re-importing that code would bring it back). A full
  delete would need a `DELETE /api/chronicle` plus a call to it from `deleteSlot`.

*Fixed previously: deleting the **active** save now stops the tick and clears
`S`/`P`/`SLOT` (it used to keep ticking and re-save itself).*

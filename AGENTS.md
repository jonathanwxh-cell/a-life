# AGENTS.md — working on *A Life*

A guide for AI agents (and humans) modifying this repo. **Read this first.** The
player-facing overview is in [README.md](./README.md); design specs live in
[`docs/`](./docs).

---

## What this is

A meditative, generational life-sim. It is a **static site — no build step, no
framework, no client dependencies, vanilla HTML/CSS/JS.** It is hosted on Vercel
and has *optional* cloud saves via the external chronicle endpoint configured in
`cloud.js`. Crucially, it must also run by **opening `a-life.html` straight off
disk (`file://`)**.

## Golden rules (do not break these)

1. **No build, no framework, no client deps, no ES modules.** The browser code is
   plain classic `<script>` files that share globals and load in a fixed order.
   ES modules break `file://` (CORS), so never add `import`/`export` to browser code.
2. **It must run from `file://`** (double-clicking `a-life.html`) *and* when served.
   Anything cloud/network must degrade gracefully to local-only.
3. **Keep the aesthetic.** Minimal, text-first, contemplative. The writing, the
   living canvas, and the constellation are the point. New UI should whisper, not shout.
4. **Never commit secrets.** The chronicle endpoint holds any database credentials server-side; none belong in this repo.

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
- `cloud.js` — optional cloud-save client for the external chronicle endpoint; it no-ops on `file://`.
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
- **The dynasty layer & diegetic agency (`dynasty.js`).** The house (`S.house`)
  accrues across lives: a `seat` 0–7 (`SEATS`), a choice-driven `repute{}` (folded
  in by `updateHouse`, **only from lived acts** — the `lived()` guard stops an
  *inherited* heirloom-memory from silently re-scoring a tag, which once collapsed
  every dynasty to "kind"), heirlooms, an inheritable `secret`, a `motto` that
  crystallizes once a reputation passes ~1.5, and `repPeak` (the reputation
  high-water mark that gates seat-7). Player levers, all **prose, never numbers**:
  the **bequest** (`e_bequest` → read in `succeed()` as the heir's starting
  conditions), the **reckoning** (`x_reckoning` → a failed/declined one drops a
  seat), seat-/repute-/trait-gated cards, and **competing-goods** cards (no clean
  answer). Seat changes are narrated in the life that caused them. `houseCharacter(h)`
  returns the number-free reputation reading + pinnacle trajectory used by the
  **"how things stand" readout** (`openStock`/`lifeReadout` in `ui.js`, opt-in) and
  the heir screen. A cross-run **"houses you have raised"** collection persists in
  `localStorage` (`recordHouseLegacy`/`renderHousesRaised` in `persistence.js`).
  Full design + jury journey: [docs/ten-juror-gameplay-journey.md](./docs/ten-juror-gameplay-journey.md).
- **Life-shape variety & the anti-staleness layer.** Lives diverge by **vocation**
  (`y_calling` sets `P.flags.vocation` ∈ soldier/scholar/maker/wanderer; each gates an
  adult→elder cluster) and by **era** (`S.era`, set in `dynasty.js` `setEra`/`rollEra`,
  drifts at succession; era cards gate on `S.era==='war'` etc.). The repeat-control
  machinery — **use it when adding content**:
  - **`onceDyn: true`** — fires at most once per *dynasty* (tracked in `S.seenDyn`,
    checked in `eligible()`, reset per house). Use for special beats, and for
    midlife/elder "milestone" cards so they **rotate across generations** instead of
    firing every life (a dynasty's gen-5 must differ from gen-1).
  - **`freshPick(pool, who)` (core.js)** — the canonical way to emit any multi-variant
    line. Backed by a session-global `RECENT_LINES` ring buffer; it avoids lines used
    recently *across the whole session*, not just one life. Route every log-line pool,
    `observe()` pool, epitaph, and motto through it (`rotI`-only pools repeat across a
    long read).
  - **The signature-card preference (`SIG` regex in `engine.js` `drawCard`)** — vocation
    arcs, era moments (`w_*`/`vx_*`), and trait moments (`t_*`) are *preferred* when
    eligible so the choices that should shape a life reliably land. New arc/era/trait
    cards should match that pattern.
  - **Solitary/childless content** (`m_solitary`, `a_chosen_family`, `e_solitary`,
    `e_childless`) makes the un-coupled life a real shape, not a dead end; the love nudge
    in `drawCard` is deliberately partial so ~a quarter of lives stay solitary.
  - **The chase**: a cross-run **discovery counter** (`markMomentSeen`/`seenCount` in
    `persistence.js`, shown on the title screen) and diegetic **house aspirations**
    (`houseAspirations` in `dynasty.js`, shown on the heir screen + "how things stand").
  - **Fate events** (`f_*`) simply happen (one acknowledgment choice), for surprise.
  Full design + the honest ceiling analysis: [docs/anti-staleness-journey.md](./docs/anti-staleness-journey.md).
- **Persistence (`core.js` + `persistence.js`).** All reads/writes go through an
  async `window.storage` (`get/set/delete/list`). A sandbox host may supply one;
  otherwise `core.js` shims it with `localStorage`. Keys: `alife:index` (slot
  summaries) and `alife:slot:N` (full save `S`, slots 1–6). Self-contained base64
  backup codes (`ALIFE1:…`) via export/import.
- **Cloud saves (`cloud.js`).** Optional and login-free. Each dynasty gets a
  20-char **chronicle code** stored in its save; `cloud.js` debounce-pushes the
  save to `https://a-life-db.alyoechosys.dev/chronicle` and adopts a newer copy on
  load. The endpoint holds database credentials server-side. Falls back to
  local-only when offline / on `file://`. Full design:
  [docs/cloud-saves.md](./docs/cloud-saves.md).
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
- **Verify before claiming done.** Actually run it. For engine/content/dynasty changes,
  run the headless harness in [`eval/`](./eval): `node eval/sim-harness.cjs 8000` must report
  **0 violations** (and healthy distributions), and `node eval/transcript-gen.cjs` lets you read
  resolved playthroughs. For browser-observable changes, load the page and check via DOM /
  `getComputedStyle` — headless screenshots time out on the always-animating canvas, so don't rely
  on them. See [`eval/README.md`](./eval/README.md) for the full workflow and the jury audit trail.

## Deployment

- Host: **Vercel**, project `a-life` (team `jons-projects-0e19e128`).
  **Pushing to `main` auto-deploys.** Manual: `vercel deploy --prod --yes --scope jons-projects-0e19e128`.
- `vercel.json` sets `Cache-Control: public, max-age=0, must-revalidate` on
  html/css/js so edits show on a normal refresh.
- Cloud saves use the external endpoint in `cloud.js`; no cloud-save env vars are
  required in this Vercel project.
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
  `once: true` (fires at most once a life), `onceDyn: true` (at most once per
  *dynasty* — use for special/milestone beats so they rotate across generations),
  `cool: N` (min years before a non-`once` card may redraw; default 10). A choice may
  set `p.flags.peril = p.age + N` to raise death odds for N years (earned risk — see
  `deathRoll`). **Emit multi-variant lines through `freshPick(pool, p)`, not
  `pool[rotI(...)]`** — freshPick dedups across the whole session, which matters when a
  long playthrough is read end-to-end. The full field reference is in the header comment
  of `content.js`; the variety/anti-staleness systems are under **Key systems** above.
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
- **Cloud endpoint:** `cloud.js` targets `https://a-life-db.alyoechosys.dev/chronicle`;
  keep all network failure paths local-only and non-blocking.

## Known issues / TODO

- The Load-menu ✕ deletes **locally only** — a synced dynasty's cloud row persists
  under its chronicle code (re-importing that code would bring it back). A full
  delete would need endpoint support plus a call to it from `deleteSlot`.

*Fixed previously: deleting the **active** save now stops the tick and clears
`S`/`P`/`SLOT` (it used to keep ticking and re-save itself).*

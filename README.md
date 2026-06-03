# A Life

*A meditative, generational life-sim in a handful of small, plain files — no build step, no dependencies.*

You live one person, from birth to death. The years pass on their own; now and then a moment asks something of you. You choose, and the choice is permanent. When that life ends, you become its heir — and everything the last life accumulated, in wealth and reputation and quiet damage, settles onto the next. Played long enough, a family takes shape: a **dynasty** with a standing, a name, heirlooms, and secrets, drawn across generations.

There are no visible numbers. The game is reading and pacing, not stats. What you see is writing, a handful of choices, a sky that slowly turns, and a tree that grows with the years.

**▶ Play it live:** **[a-life-chi.vercel.app](https://a-life-chi.vercel.app)** — or open [`a-life.html`](./a-life.html) in any modern browser; nothing to install. Every push to `main` redeploys automatically.

---

## What makes it different

- **Hidden stats, authored lives.** Vitality, mind, heart, means, and spirit all exist under the hood, but you never see a number. You feel them through how the writing describes you ("settled, with something to lose"; "old, and tired, and tender").
- **One life is one day.** Each person is born at dawn and is gone by night; the sky arcs from sunrise through noon, dusk, and dark across their lifespan.
- **Choices echo across decades.** A book kept in childhood can resurface at midlife. A kindness to an outcast can return, grown up, as a door held open. These *callback cards* only appear if an earlier choice left its mark.
- **A real generational engine.** Every heir is *born into the world* and lives a full life from childhood — inheriting blended traits (with regression to the mean, so no runaway dynasties), a share of the estate, and the family's standing, all as the conditions of a new childhood rather than a head start. Moments fit your age and circumstances, and lives can end early or simply run out — so a line can also, quietly, end.
- **The house, and steering it.** Across lives the family rises or falls through eight seats — from *nothing but a name* to *a house written into the histories* — and the climb is something you can actually *steer*, never with a stat bar. A late-life **bequest** lets you set aside one thing for your heir (their mind, a softer footing, the stories, or their own freedom) that becomes the next life's real starting conditions. A house with something to lose can face a **reckoning** and lose a seat. Reputation is driven by what a life actually *does*, so distinct dynasties crystallize distinct **mottos** ("We do not ask twice"; "We leave something beautiful behind"). Heirlooms and an inheritable **secret** pass down; the pinnacle is rare and must be re-earned.
- **Read it in prose, not numbers.** Tap **⊙ how things stand** for an opt-in, number-free reckoning of where the life sits — body, mind, heart, means, spirit — plus the house's standing and how close its name is to being written into the histories. Hidden by default, so the quiet stays quiet.
- **The Constellation.** Your whole bloodline rendered as a star-map: each life a strand of decision-stars, the choices you made glowing, the roads not taken faded beside them, generations linked down lineage threads. Drag to roam, pinch or scroll to zoom, tap a star to read the moment.
- **A living scene.** A procedural tree grows from sapling to canopy to bare with age; birds, motes, and the colour of the sky quietly read the warmth and light of the life you're living. Painterly backdrops mark the turning points — each life-stage, an ending, an heir.

## How to play

1. Open the game and tap **Begin a new line.**
2. Let the years pass. Pause any time with the ▮▮ button.
3. When a moment arrives, read it and choose. There's no undo.
4. When you die, read the eulogy and **become your heir** to continue the line — or, if there's no heir, begin anew.
5. Tap **✦ the constellation** (top-right) to see your whole bloodline; the **Chronicle** holds *This Life*, *The Line* (the house and its ancestors), and the *Constellation*.

Optional, any time: tap **⊙ how things stand** (under the "being" line) for a prose reading of where this life and house sit; tap the **"the years are passing"** text to race past the quiet years; tap **♪** in the footer for quiet, opt-in background music (off by default, remembers your choice).

## Saving &amp; backups — please read

Progress autosaves to the browser's local storage, with up to six save slots. When the game is served from the web (not opened as a bare file), it also syncs each line to the **cloud** under a private **chronicle code**, so a dynasty can follow you across devices and survive a cleared browser.

- **Menu → Load a chronicle → Sync & copy code** makes sure the current line is in the cloud and copies its short chronicle code.
- On another device, paste that code into the box and tap **Continue from code** to pick the line up where you left off.
- The code *is* the key — anyone who has it can load that dynasty, so keep it to yourself.
- Offline, or opened as a local file, the game quietly falls back to local-only saves. The same box can still produce and restore a self-contained **offline backup code** when the cloud isn't reachable.

If you care about a long-running dynasty, copy its chronicle code now and then. The cloud copy — or a saved code — is what survives a cleared browser.

## Running locally

It's a static site. Either open `a-life.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/a-life.html
```

## Deploying

Hosted on **Vercel** — every push to `main` auto-deploys. It's also a plain static site, so GitHub Pages (or any static host) works. Optional cloud saves need `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set on the host — see [`docs/cloud-saves.md`](./docs/cloud-saves.md).

## Project layout

| File | What it is |
| --- | --- |
| `a-life.html` | The page you open to play — markup only; pulls in the stylesheet and the scripts below. |
| `styles.css` | All styling, lifted out of the HTML. |
| `core.js` | Shared foundation: the storage adapter, helpers, game state, the person factory, traits, relationships, logging, and memory. |
| `content.js` | The event cards — every moment the game can present. |
| `engine.js` | The life simulation: time, drift, ageing, death, and drawing/presenting cards. |
| `dynasty.js` | Death & succession, and the house that accrues across generations (seats, reputation, heirlooms, secrets). |
| `ui.js` | Rendering — the header, the living "being" line, the log, and the chronicle panes. |
| `persistence.js` | Save slots, export/import codes, storage recovery, and boot. |
| `cloud.js` | Optional cross-device sync — shadows the active save to the cloud under a chronicle code; no-ops offline. |
| `scene.js` | The living scene — sky, sun and moon, the growing tree, and particles, on the background canvas. |
| `constellation.js` | The bloodline star-map. |
| `audio.js` | Optional, opt-in ambient music — loops the piece that fits the moment (title, the living years, the eulogy, the heir), off by default. |
| `api/chronicle.js` | Serverless route (Vercel) that reads/writes a save to Supabase with the service-role key — the only thing that touches the database. |
| `assets/*.webp` | The painterly backdrop images (title, eulogy, heir, and the five life stages). |
| `assets/music/*.mp3` | Four instrumental pieces for the game's moments (with a `preview.html` to audition them). |
| `index.html` | A small entry page that opens `a-life.html` (so GitHub Pages / Vercel serves the game at the root). |
| `vercel.json` | Vercel cache headers, so updates show on a normal refresh. |
| `gallery.html` | Dev-only preview of the image set; not part of the game. |
| **`AGENTS.md`** | **Guide for contributors & AI agents** — architecture, conventions, deployment, gotchas. Start here to work on the code. |
| `docs/cloud-saves.md` | Design spec for the cloud-save feature. |
| `docs/images.md` | How the backdrop images are generated, optimized, and wired in. |
| `docs/five-critics-goal-journey.md` | How the game was hardened across 15 critic-driven rounds — to unanimous sign-off from five independent reviewers (UX, writing, design, visual, accessibility). The methodology, the round-by-round findings, and the fixes. |
| `docs/ten-juror-gameplay-journey.md` | The **gameplay** overhaul: eight build passes driven by ten blind, distinct-profile jurors (systems, literary, cozy, strategy, mobile, a11y, roguelike, first-timer, critic, QA), until all ten independently rated it ≥ 8/10 (from a 6.05 average, toughest lens 3.5). The diegetic agency layer, the round-by-round scores, the 90 verdict receipts. |

## Tech

The frontend is plain HTML, CSS, and vanilla JavaScript — split into small scripts loaded in dependency order, with no ES modules, so it still runs straight off the filesystem. No build step, no framework, no client dependencies. All rendering is Canvas 2D; fonts come from Google Fonts.

Optional **cloud saves** add one serverless function (`api/chronicle.js` on Vercel) talking to **Supabase** with a service-role key — the browser never sees the key, and the table is service-role-only. If the function or network is unavailable (e.g. opened as a local file), the game falls back to local-only saves and plays exactly the same. See [`docs/cloud-saves.md`](./docs/cloud-saves.md).

**Working on the code (human or agent)?** Start with [`AGENTS.md`](./AGENTS.md) — architecture, the file/load-order map, conventions, deployment, and the non-obvious gotchas.

## License

MIT — see [`LICENSE`](./LICENSE).

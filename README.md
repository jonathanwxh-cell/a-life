# A Life

*A meditative, generational life-sim that fits in a single HTML file.*

You live one person, from birth to death. The years pass on their own; now and then a moment asks something of you. You choose, and the choice is permanent. When that life ends, you become its heir — and everything the last life accumulated, in wealth and reputation and quiet damage, settles onto the next. Played long enough, a family takes shape: a **dynasty** with a standing, a name, heirlooms, and secrets, drawn across generations.

There are no visible numbers. The game is reading and pacing, not stats. What you see is writing, a handful of choices, a sky that slowly turns, and a tree that grows with the years.

**▶ Play it:** open [`a-life.html`](./a-life.html) in any modern browser — desktop or mobile. Nothing to install. *(If you enable GitHub Pages on this repo, the root URL plays it directly.)*

---

## What makes it different

- **Hidden stats, authored lives.** Vitality, mind, heart, means, and spirit all exist under the hood, but you never see a number. You feel them through how the writing describes you ("settled, with something to lose"; "old, and tired, and tender").
- **One life is one day.** Each person is born at dawn and is gone by night; the sky arcs from sunrise through noon, dusk, and dark across their lifespan.
- **Choices echo across decades.** A book kept in childhood can resurface at midlife. A kindness to an outcast can return, grown up, as a door held open. These *callback cards* only appear if an earlier choice left its mark.
- **A real generational engine.** Heirs inherit blended traits (with regression to the mean, so no runaway dynasties), a share of the estate, and the family's standing. Lines can also simply end.
- **The house.** Across lives the family rises or falls through seven seats — from *nothing but a name* to *an old and famous house* — accrues a drifting reputation, passes down heirlooms, and can bury an inheritable **secret** that descendants may keep or expose. A **motto** crystallizes once the family has a character.
- **The Constellation.** Your whole bloodline rendered as a star-map: each life a strand of decision-stars, the choices you made glowing, the roads not taken faded beside them, generations linked down lineage threads. Drag to roam, pinch or scroll to zoom, tap a star to read the moment.
- **A living scene.** A procedural tree grows from sapling to canopy to bare with age; birds, motes, and the colour of the sky quietly read the warmth and light of the life you're living.

## How to play

1. Open the game and tap **Begin a new line.**
2. Let the years pass. Pause any time with the â–®â–® button.
3. When a moment arrives, read it and choose. There's no undo.
4. When you die, read the eulogy and **become your heir** to continue the line — or, if there's no heir, begin anew.
5. Tap **âœ¦ the constellation** (top-right) to see your whole bloodline; the **Chronicle** holds *This Life*, *The Line* (the house and its ancestors), and the *Constellation*.

## Saving &amp; backups — please read

Progress autosaves to the browser's local storage, with up to six save slots.

**Browser storage can be cleared** — by the browser, by privacy settings, or by the environment the game is embedded in. So the game also gives you a save you hold yourself:

- **Menu â†’ Load a chronicle â†’ Export current line** copies your entire dynasty to the clipboard as a portable code (it also appears in the text box). Paste it somewhere safe.
- **Import from code** restores a dynasty from such a code, into a fresh slot.
- The eulogy screen has a one-tap **back up this bloodline** link at each natural stopping point.

If you care about a long-running dynasty, export a code now and then. A pasted code is the only backup that survives a cleared browser.

## Running locally

It's a static site. Either open `a-life.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/a-life.html
```

## Project layout

| File | What it is |
| --- | --- |
| `a-life.html` | The game's structure and styles; loads `game.js`. The page you open to play. |
| `game.js` | All game logic — the life engine, event cards, the dynasty/house system, persistence, backup/restore, the living scene, and the constellation. |
| `index.html` | A small entry page that opens `a-life.html` (so GitHub Pages serves the game at the root). |

## Tech

Plain HTML, CSS, and vanilla JavaScript. No build step, no framework, no dependencies. All rendering is Canvas 2D. Fonts are loaded from Google Fonts; everything else is self-contained.

## License

MIT — see [`LICENSE`](./LICENSE).

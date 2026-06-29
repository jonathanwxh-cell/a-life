# `eval/` — verification harness & the jury audit trail

This directory is the **reproducible evidence and tooling** behind the gameplay overhaul documented in
[`../docs/ten-juror-gameplay-journey.md`](../docs/ten-juror-gameplay-journey.md). If you are an agent or
contributor with no prior context: start with that journey doc for the *why*, then use the tools here to
*verify* any change you make before claiming it works.

There are two things in here:

1. **A headless verification harness** (`sim-harness.cjs`, `transcript-gen.cjs`) — run the *real* game
   engine with no browser, to catch logic regressions and to read what a player would actually see.
2. **The jury audit trail** (`jury/`) — the 90 raw verdicts (10 reviewers × 9 rounds) that drove the
   overhaul to "all ten independent reviewers rate it ≥ 8/10," kept so the result is checkable, not
   hand-waved.

---

## 1. The verification harness

Plain Node.js (no dependencies). Both scripts load the actual browser source files (`core.js`,
`content.js`, `engine.js`, `dynasty.js`) into a Node `vm` with a **stubbed DOM**, so the **real**
`tick()`, `drawCard()`, ageing, death, succession, and `updateHouse()` run exactly as in the browser —
only the rendering is faked. They locate the game files via `path.resolve(__dirname, '..')`, so they run
from anywhere as long as `eval/` sits inside the repo.

### `sim-harness.cjs` — invariants & distributions

```sh
node eval/sim-harness.cjs            # default 5000 dynasty-lines (~40k lives)
node eval/sim-harness.cjs 8000       # more lines = tighter numbers
```

Plays full dynasties (intentionally taking love/marry/child so lines continue) and reports:

- **`VIOLATIONS age:0 stage:0 cooldown:0 once:0`** — this MUST stay all-zero. Non-zero means a card
  fired outside its `age`/`stage` band, inside its cooldown, or a `once:true` card fired twice. This is
  the single most important gate: **a change that introduces a violation is broken.**
- Early-death rate (target ~8–12%), death-age min/median/max, love/child rates, dynasty depth, and the
  final house-seat distribution. Use these to sanity-check that a tuning change didn't wreck pacing or
  continuation (e.g. softening the love→marry→child pipeline must keep the child rate healthy).

### `transcript-gen.cjs` — readable playthroughs

```sh
node eval/transcript-gen.cjs         # writes eval/transcripts.txt (5 dynasties, ~15-20 lives)
```

Emits fully-resolved transcripts — every moment faced, every choice and road-not-taken, every eulogy,
the house's seat/motto/heirlooms — i.e. *what a reader actually reads*. Use it to check prose quality,
spot repeated lines, confirm new cards fire, and verify mottos are diverse. `eval/transcripts.txt` is a
git-ignored runtime artifact; **`eval/sample-transcripts.txt`** is a committed reference snapshot.

> The output varies run-to-run (random play). To gauge a distribution (e.g. motto variety), run it a few
> times and aggregate, e.g.:
> `for i in 1 2 3 4 5; do node eval/transcript-gen.cjs >/dev/null; grep -o "motto: .*" eval/transcripts.txt; done | sort | uniq -c | sort -rn`

### For browser-observable changes

The harness can't see the DOM/CSS. For anything UI-facing, also load the page (e.g. `python -m http.server`
then a headless browser) and check via DOM / `getComputedStyle`. Headless **screenshots time out** on the
always-animating canvas — assert against the DOM instead (see `AGENTS.md`). Cloud saves use the external
chronicle endpoint from `cloud.js` when served and no-op from `file://`; endpoint/network failures should stay
non-blocking.

---

## 2. The jury (`jury/`)

The overhaul's pass condition was: **ten different blind reviewers, each a distinct profile, each
independently rating the game ≥ 8/10.** The method is the "no cheating" guarantee, so it's all here.

- **`jury/BRIEF.md`** — the shared rubric every reviewer was held to: what the game is, the materials to
  read (the source, a generated transcript, the screenshots, the live URL), the 0–10 scale (8 = "genuinely
  very good, I'd recommend it"), and the strict output schema. *(Note: the `.png` screenshots referenced in
  the brief live in the sibling `a-life-eval/` scratch dir and went stale near the end of the journey; the
  brief tells reviewers to trust the live code over the images.)*
- **`jury/round0/` … `jury/round8/`** — 10 verdicts per round, one JSON per reviewer profile, written by
  the reviewer itself. Round 0 is the baseline (before any change); rounds 1–8 follow each build pass.

Each verdict file is:

```json
{ "profile": "...", "score": 8.0, "strengths": [...], "blockers": [...],
  "improvements": [{ "what": "...", "why": "...", "impact": "high|med|low" }], "verdict": "..." }
```

The **ten profiles**: `systems_designer`, `literary_reader`, `cozy_fan`, `strategy_simulationist`,
`mobile_casual`, `accessibility_advocate`, `roguelike_replayer`, `first_timer`, `critic_journalist`,
`qa_skeptic`. They were chosen to pull in deliberately *opposite* directions — an 8 from a hardcore
strategy gamer and an 8 from a cozy/literary reader are nearly contradictory asks — so clearing all ten
at once is a real bar, not a rubber stamp.

### The result

The average score climbed every round, from **6.05** (Round 0, toughest lens 3.5) to **8.42** (Round 8),
with passing lenses growing 0 → 0 → 1 → 1 → 5 → 5 → 6 → 9 → **10**. Round 8 is the first round in which
**all ten** reviewers independently land ≥ 8. The full round-by-round matrix and the per-pass changes are
in [`../docs/ten-juror-gameplay-journey.md`](../docs/ten-juror-gameplay-journey.md).

Quick tally of any round:

```sh
for f in eval/jury/round8/*.json; do node -e "const j=require('./'+process.argv[1]);console.log(j.score, j.profile)" "$f"; done | sort -n
```

### Reproducing / continuing a jury round (for a future gameplay pass)

If you do another gameplay pass and want to re-validate, the method was: spawn 10 independent subagents
(one per profile, blind to each other), each told to read `jury/BRIEF.md`, read the source + a freshly
generated `transcripts.txt`, score against the rubric, and **write its JSON to
`eval/jury/round<N>/<profile>.json`** as a receipt. Keep fresh agents each round (don't let a reviewer
"remember" a prior score), make real fixes between rounds, and record every score — that's what keeps the
result honest.

---

## TL;DR for a future agent touching gameplay

1. Read `../docs/ten-juror-gameplay-journey.md` (the why) and `../AGENTS.md` (the how/conventions).
2. Make your change in the game's plain `.js` files.
3. `node eval/sim-harness.cjs 8000` → confirm **0 violations** and healthy distributions.
4. `node eval/transcript-gen.cjs` → read `eval/transcripts.txt` and confirm the prose/new content reads right.
5. Browser-smoke anything UI-facing (DOM assertions, not screenshots).
6. Only then commit. Keep the diegetic, number-free, contemplative soul intact — that's the whole point.

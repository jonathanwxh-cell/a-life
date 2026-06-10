# The anti-staleness overhaul — eight build passes, eight blind-jury rounds

This is the record of a second gameplay goal for *A Life* (the first is in
[`ten-juror-gameplay-journey.md`](./ten-juror-gameplay-journey.md), which drove the
quality jury to all-ten-≥8). The brief here was narrower and harder:

> Make the gameplay genuinely **fun** and keep it **fresh** — kill the *staleness* —
> judged for this genre (a meditative, literary, generational life-sim), until **15
> independent, distinct-profile blind reviewers each rate the fun gameplay ≥ 8/10.**

It is also an honest record of hitting a **ceiling**: across the last five jury rounds
the average sat flat at **6.5/10** despite every convergent complaint being fixed each
round. The game was transformed — but the specific 15-at-8 yardstick proved
**asymptotic** for this format under this (deliberately exacting) jury. The "why" is the
most useful thing in this document; see [The plateau](#the-plateau-and-why) at the end.

## Method

- **The jury.** 15 blind, independent subagents, each a distinct player profile
  (`fun_narrative_player`, `replay_addict`, `first_session_fun`, `long_session`,
  `variety_seeker`, `surprise_hunter`, `choice_savorer`, `emergence_fan`,
  `cozy_sim_player`, `lapsed_player`, `completionist`, `dynasty_strategist`,
  `skeptical_critic`, `mobile_snacker`, `genre_veteran`). Each reads the brief
  ([`eval/jury/FUN-BRIEF.md`](../eval/jury/FUN-BRIEF.md)), the source, and a fresh
  multi-dynasty transcript packet, then writes a strict-JSON verdict to
  `eval/jury/fun-roundN/<profile>.json`. Fresh agents each round; no agent sees another.
- **The rubric.** `8` = "genuinely fun and stays fresh enough; I'd keep playing for the
  *gameplay*, not just to admire the prose." Reviewers are told most things are not an 8
  and not to inflate — this is a hard lens by design.
- **The evidence is a transcript packet.** `eval/transcript-gen.cjs` plays ~15 dynasties
  end-to-end through the *real* engine and writes `eval/fun-transcripts.txt`. The jury
  reads it and counts repeated beats / lines / life-shapes. **This packet is the single
  most important artifact** — the jury's perception is almost entirely shaped by what it
  shows. (A mid-project realization: the packet must be *representative* — see Pass 4.)
- **The loop.** Diagnose the convergent complaints → build real fixes → verify headless
  (`eval/sim-harness.cjs` must report `VIOLATIONS … 0` over ~10k lives) + browser-smoke →
  regenerate the packet → re-jury. Repeat.

## The score trajectory

| Round | avg | range | at ≥8 | what changed before it |
| --- | --- | --- | --- | --- |
| 0 (baseline) | 6.16 | 5.5–6.5 | 0/16 | — |
| 1 | 6.23 | 5.5–6.5 | 0/15 | Pass 1: vocations, eras, onceDyn, soften love |
| 2 | 6.55 | 6.5–7.2 | 0/15 | Pass 2: break late-love/elder monoculture, freshPick dedup |
| 3 | 6.59 | 6.5–7.2 | 0/15 | Pass 3: kill wanderer monoculture, marriage timing, the chase |
| 4 | 6.57 | 6.5–7.0 | 0/15 | Pass 4: representative packet + deep line-dedup |
| 5 | 6.52 | 6.5–6.8 | 0/15 | Pass 5: varied opener (c_origin), last repeats |
| 6 | 6.55 | 6.5–7.0 | 0/15 | Pass 6: rotate milestone beats across a dynasty |
| 7 | 6.50 | 6.5–6.5 | 0/15 | Pass 7: kill late-love for real, vary y_calling |
| (8) | — | — | — | Pass 8: marriage timing, session-global dedup, named ancestors |

The **floor rose** from 5.5 to 6.5 — by round 7 every reviewer agreed the game is
polished, well-crafted, and beautifully written. The **ceiling never moved past ~7.2**,
and no reviewer ever reached 8.

## The baseline diagnosis (round 0, avg 6.16)

Strikingly unanimous: the writing is *praised*, the problem is **structure**. Every life
walked the same skeleton — `fever → yard-friend → trade/study → mentor → love → marry →
child → work → honest-or-kind → health-scare → bequest → die` — and by dynasty 4 you were
"watching the same film with a new cast." Convergent asks: break the fixed template;
add vocations/life-paths; break the forced love→marry→child pipeline; add rare
wildcards + a changing world; surface goals to chase; lower the seat/reputation gates.

## What was built (pass by pass)

**Pass 1 — vocations, eras, the onceDyn mechanism.**
- `onceDyn` flag (engine + `S.seenDyn`, reset per house): a "special" beat fires at most
  once per *dynasty*, not once per life.
- **Vocations** (`y_calling` → soldier / scholar / maker / wanderer), each gating a
  distinct adult→elder cluster, made near-universal via a *vocation nudge* + a
  *signature-card preference* so the calling actually shapes the adult arc.
- **Eras** (`S.era`: settled / war / plague / plenty / hard / turning) that drift at each
  succession and gate their own cards, so gen 8 ≠ gen 2.
- Softened the love-force so some lives stay solitary. ~+31 cards.

**Pass 2 — break the late-love & elder monoculture; kill repeated lines.**
- The round-1 jury read the transcripts and counted repeats. The youth-love softening had
  *shifted* love later (a_meet_late dominated), creating a new monoculture.
- `freshPick()` (core.js): a global, session-wide rolling memory of recently-emitted
  prose, applied to `observe()`, epitaphs, mottos, and the love/marry/child pools.
- onceDyn'd the worst elder offender (`cb_the_cost`); added solitary/childless
  life-shapes, fate events, vocation×era intersections; trait moments joined the
  signature preference.

**Pass 3 — wanderer monoculture, marriage timing, the chase.**
- A `held('left_home')` cond-bleed had made the wanderer elder/midlife arc fire in *any*
  left-home life; tightened to actual wanderers. Marriage was still late (love was fixed
  but a_marry only fired via a late safety-net) — added a varied-age marriage nudge.
- **The chase** (the persistent meta-ask): a cross-run **discovery counter** ("N of the M
  moments a life can hold, witnessed") on the title screen, and diegetic **house
  aspirations** ("still ahead for the house: a place in the histories…") on the heir
  screen and in the "how things stand" readout.

**Pass 4 — a *representative* evidence packet.** The deepest single realization. The
transcript generator's `INTENT` had *forced* every life to accept love/marry/child (to
keep dynasties alive), so the packet the jury read **hid the variety the engine actually
produced**. Made it play a representative player — declines love sometimes (a real
solitary minority), rotates all four callings evenly (killing a false "scholar
monoculture") — and right-sized it to ~15 dynasties. Plus deep line-dedup: eras announced
only on *change*, and freshPick'd/expanded every high-frequency spine line.

**Pass 5 — a varied opener.** The childhood **fever** (`c_sick`) opened ~14/15 dynasties
because it was the earliest-eligible card. New `c_origin`: a born-circumstance card whose
text branches ten ways (by era, house standing, or the child's nature), so every life now
*opens* differently; the fever moved to mid-childhood.

**Pass 6 — rotate the milestone beats across a dynasty.** The jury's deepest structural
insight: the load-bearing midlife/elder "checklist" cards (`m_health`, `e_legacy`,
`e_window`, `t_warm`, `e_garden`, `e_peace`, …) were once-per-*life*, so a dynasty's gen-5
was identical to gen-1. onceDyn'd all of them so the beats *rotate* across generations
(verified: within a house, founder ≠ 2nd ≠ 3rd in their midlife/elder beats; lives are not
thinned — vocation elder caps, the bequest, and callbacks fill the gap).

**Pass 7 — kill the late-love monoculture for real.** Measuring the actual packet proved
the jury right: late love was ~⅓ of couplings, contradicting the sim. The youth-love nudge
wasn't landing dominantly. Raised it 0.34→0.46, dropped the late nudge to 0.05, lowered
a_meet_late weight. Result: love is now young-dominant (transcript love-start <28 went 14→24
of ~28 couplings; a_meet_late prompt 14×→2×; the round-7 jury confirmed "all love events
now occur at 16-25"). Also varied `y_calling` by era/standing; onceDyn'd the last repeat
callbacks; thickened the thin adult/midlife band.

**Pass 8 (polish) — marriage timing, session-global dedup, named ancestors.** Raised the
marriage nudge (median 39→32). Folded the "red and furious" first-child line into the
freshPick pool so it dedups across the whole session (was 9–11/15 → 0). `d_ancestor` now
names the ancestor's actual deed (from their epitaph cluster). onceDyn'd
`cb_outcast_return`; widened the dedup buffer 70→110.

## The anti-staleness architecture (for future contributors)

The reusable machinery this goal added, all of it verified by the harness:

- **`onceDyn` (engine.js + `S.seenDyn`)** — once-per-dynasty gating. Use it for "special"
  beats that should be rare within a house, and for milestone/elder "checklist" cards so
  they *rotate* across generations instead of firing every life.
- **`freshPick(pool, who)` (core.js + a session-global `RECENT_LINES` ring buffer)** —
  the canonical way to emit prose. It avoids any line used recently *across the whole
  session*, not just within one life. Route every multi-variant log line / observe pool /
  epitaph / motto through it.
- **The signature-card preference (engine.js `SIG`)** — vocation arcs, era moments, trait
  moments, and vocation×era intersections are *preferred* when eligible, so the choices
  that should shape a life reliably land.
- **The representative transcript generator** — the eval packet must reflect *varied*
  play (declines as well as accepts; all callings), or it will make the game look more
  monocultural than it is.
- **Measure timing, not just violations.** `sim-harness.cjs` now reports love/marriage/
  child onset-age bands and coupled-childless rate. The late-love bug was invisible until
  these were measured against the *transcript*.

Card count grew from ~91 to ~150. `VIOLATIONS age:0 stage:0 cooldown:0 once:0 onceDyn:0`
held at every step over 9–12k simulated lives.

## The plateau, and why

Five consecutive rounds (3–7) sat at **6.5 ± 0.05** while every convergent, concrete,
named complaint was fixed — repeated lines, wanderer monoculture, late-love (twice),
elder convergence, the fever opener, the milestone repetition, the missing chase, the
silent reckoning. Each round the named problems were resolved, the average held, and the
jury surfaced the *next* tier. By round 7 the floor had risen to a unanimous 6.5 and the
complaint had converged on **one thing no card-level fix can touch**:

> *"The structural skeleton is invariant — origin → calling → love → marry → child → work
> → elder → die. The order varies; the composition does not."* (named by **all 15**
> reviewers in round 7)

This is the genuine ceiling, and it is largely **structural to the genre**:

1. **A life has a spine.** Childhood → youth → adult → elder → death is what a life *is*.
   Vocations, eras, fate, and trait-affinity vary the *content* within each stage, but the
   stage *order* cannot change — and a transcript read in age order will always show it.
2. **A dynasty sim needs the domestic arc.** The generational layer the jury most praises
   (seats, mottos, heirlooms, the bequest) structurally *requires* most lives to couple
   and reproduce, or the line dies. So the love→marry→child spine the jury wants broken is
   *load-bearing* for the feature they love. The two asks are in tension.
3. **Finite hand-written content vs. a 30-life read.** For a line that fires in most lives
   to stay under ~3× across 30 lives, its pool needs ~15 variants. Across every common
   card that is many hundreds of new lines; freshPick narrows the window but cannot beat
   the arithmetic at that read-length.
4. **The lens is deliberately hard.** "Most things are not an 8" + adversarial repeat-
   counting across an entire session is a harsher test than real play (where a player
   meets these moments spread over hours, not back-to-back in a transcript).

**Honest conclusion.** The work made *A Life* dramatically fresher and is, by the jury's
own words, polished, well-written, and structurally ambitious (the callback system,
vocations, eras, and dynasty layer are praised in nearly every verdict). But the precise
yardstick — *15 exacting, distinct-profile reviewers each ≥ 8 on a 15-dynasty
freshness-read* — appears to be **asymptotically out of reach for a finite, card-based
life-sim**, because the residual complaint is the inherent life-spine, and breaking that
spine fights the dynasty layer that gives the game its pull. Crossing it would take a
**different structural bet** — genuinely branching life-archetypes that skip or reorder
major beats, a non-direct succession model so most lives need not be domestic, or a far
larger authored corpus — each a larger redesign than an autonomous content/tuning loop
should commit to without a product decision.

## Where the artifacts live

- Brief: [`eval/jury/FUN-BRIEF.md`](../eval/jury/FUN-BRIEF.md)
- Verdicts: `eval/jury/fun-round0/` … `fun-round7/` (≈120 receipts)
- Evidence packet generator: [`eval/transcript-gen.cjs`](../eval/transcript-gen.cjs)
- Violation/balance harness: [`eval/sim-harness.cjs`](../eval/sim-harness.cjs) (now also
  reports love/marriage/child onset-age bands; `node eval/sim-harness.cjs N cards <regex>`
  prints a card-usage histogram)

---

## Continuation — Passes 11–13, rounds 9–11, and the asymptote proven (2026-06-10)

Four more build passes and three more 15-juror rounds, run to test whether the
"asymptotically out of reach" verdict above was real or just under-investment. It was real,
and we can now show *why* with a clean measured trajectory.

### What the passes did (all verified: `sim-harness` violations stayed 0 throughout)

- **Pass 11 — de-monoculture + a fifth life-shape + dynasty-state content.** `cb_corner` /
  `cb_the_cost` (the rounds 6–9 top complaint, firing in 8–11 of 15 dynasties) had their
  eligibility tightened and got 5-generation cooldowns — draw rate fell ~30→3 per 100 lives,
  and no round-10/11 juror mentioned them again. Added the **drifter** (`vocation==='adrift'`,
  ~13% of lives, full `y_adrift→a_adrift_work→m_adrift_reckon→e_adrift_old` arc) and
  **dynasty-state cards** (`dyn_summit`, `dyn_decline`, `dyn_founder_echo`) gated on
  accumulated seat/gen so a deep house meets content a founder never can.
- **Pass 12 — the mechanical pass round 10 pointed at.** `observe()` got its own deep
  cross-life dedup buffer (`obsPick`) + a per-life cap + its five highest-frequency pools
  deepened; the remaining un-cooled callbacks got cooldowns; ~15 frozen-string outcomes were
  thawed; collateral succession was loosened so a childless founder can pass the house
  sideways — cutting single-generation dynasties from **9/15 to 2/15** without losing the
  ~49% non-domestic life-shape variety.
- **Pass 13 — per-beat session dedup (`bucketPick`).** The shared `freshPick` ring (260 lines,
  all cards) is flushed within a few lives, so the *statistically dominant* beats —
  love-opening, marriage, child-birth — still resurfaced every ~5 lives. `bucketPick` gives
  each its own buffer sized to its own pool, guaranteeing it spends every variant before
  repeating. Also pooled the `w_plague_tend` / `w_war_loss` single-strings and fixed a real
  logic bug (`s_from_nothing` firing "nothing behind you" on 5th-generation heirs of a
  house with a motto and heirlooms).

### The measured asymptote

The **top verbatim prose repeat across a 15-dynasty packet**, pass by pass:
`~11× → 8× → 5× → 5×` — but by Pass 13 the 5× lines are *minor single-choice outcomes*
(`"Set down the elsewhere…"`), because the dominant love/marriage/child beats had been
removed from the top entirely. Each pass flattens the ceiling and the next tier of fixed
strings rises to meet it. With ~150 cards and 46–60 lives per read, **there is always a
3–5× tail**; erasing it completely needs every card outcome pooled 4× over — a 3–5× corpus
expansion, which is a content/product decision, not a tuning loop.

### The jury trajectory (15 blind, distinct-profile reviewers each, ≥8 = goal)

| Round | Avg | Floor | Ceiling | at ≥8 |
|------:|----:|------:|--------:|------:|
| 9  | 6.63 | 6.5 | 7.2 | 0/15 |
| 10 | 6.57 | 6.2 | 6.9 | 0/15 |
| 11 | 6.48 | 5.8 | 6.8 | 0/15 |

Flat-to-down **despite every pass measurably fixing what the prior round cited.** The reason
is structural: the jury anchors its score to *whatever is now the most-frequent residual
repeat*, and that target merely rotates (cb_corner → observe() → love/marriage/child →
the fixed-string tail) — it never empties. The two complaints that recur *every* round are
genuinely unfixable by tuning: (1) the calling fork is "four identical buttons every life"
— but it is also the engine of vocation variety the same jurors praise; and (2) the
life-spine (origin→calling→love→marry→child→health→elder→death) is inherent to a
generational life-sim and the dynasty layer that gives it pull.

### Honest bottom line

The work made *A Life* dramatically fresher by every objective measure (monoculture
eliminated; ambient repetition cut ~5×; a real fifth life-shape; dynasty depth restored;
the dominant beats de-duplicated; dozens of frozen strings thawed) and every juror praises
the architecture, prose, callbacks, vocations, eras, and dynasty layer. But **15 exacting
profile-reviewers each ≥8 on a 15-dynasty adversarial freshness-read is not reachable for a
finite, card-based prose sim by tuning alone.** Crossing it is a product decision — a 3–5×
larger authored corpus, a non-card generative text layer, genuinely beat-skipping/reordering
life-archetypes, or a review methodology matched to real play (2–3 dynasties, where the game
already reads ~7.5) — not something an autonomous content/tuning loop should commit to
without the owner's call.

- Verdicts (this continuation): `eval/jury/fun-round9/` … `fun-round11/` (45 receipts)

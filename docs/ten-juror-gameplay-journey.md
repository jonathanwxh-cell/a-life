# The Ten-Juror Gameplay Journey

A second autonomous, critic-driven hardening of **A Life** — this time aimed squarely at
**gameplay and features**, with a deliberately harder, more diverse jury and a higher bar.

> **The goal (verbatim):** *"i want to improve on the gameplay.. features. etc.. anything .. no
> boundary.. similar to yesterday experiment.. this time.. passing mark is only 10 different sub
> agents rate this game as 8.. different profile.. no cheating.. autonomous.. anything .. tools
> etc.. use whatever available.. at the end of goal.. document all down and update in repo"*

Where the first journey ([five-critics-goal-journey.md](./five-critics-goal-journey.md)) drove five
*quality-axis* critics (UX, writing, design, visual, accessibility) to unanimous "satisfied," this one
asks a tougher question: **would ten different kinds of player/reviewer each independently rate the
game an 8/10?** That is a much higher bar — an 8 from a hardcore strategy gamer and an 8 from a
literary-fiction reader pull in nearly opposite directions, and the game has to satisfy both at once.

## The method (and the "no cheating" guarantee)

- **Ten blind, independent jurors**, each a distinct profile, each a fresh subagent that never sees
  the others. They read the *actual* source, *real* engine-generated playthrough transcripts, and the
  live UI screenshots, then score 0–10 against a shared honest rubric ([the brief](../../a-life-eval/jury/BRIEF.md)).
- **Every verdict is a receipt.** Each juror writes its raw JSON (score, blockers, improvements) to
  `a-life-eval/jury/round<N>/<profile>.json`. Nothing is hand-waved; the scores below are transcribed
  from those files. Fresh jurors each round, so no score is "remembered" or coached.
- **The bar:** all ten ≥ 8.0. A session Stop-hook held the loop open until that was genuinely true.
- **No cheating** means: real jurors, real receipts, real fixes between rounds — the game actually
  changes to earn the score; the jury is never told what to say.

## The ten lenses

1. `systems_designer` — do choices have systemic consequence; do the systems talk to each other?
2. `literary_reader` — sentence-craft, voice, restraint, emotional truth, no repetition.
3. `cozy_fan` — calm, atmosphere, no stress, a place you'd want to be.
4. `strategy_simulationist` — agency, mastery, levers, failure pressure, long-game planning.
5. `mobile_casual` — pick-up-and-play, session pacing, touch ergonomics, clarity.
6. `accessibility_advocate` — screen-reader, keyboard, reduced-motion, contrast.
7. `roguelike_replayer` — run-to-run variety, build identity, "one more run."
8. `first_timer` — onboarding, "what do I do," an immediate hook.
9. `critic_journalist` — originality, cohesion, point of view, craft.
10. `qa_skeptic` — robustness, edge cases, contradictions, polish.

## Round 0 — the honest baseline

| # | Juror | Score |
|---|-------|------:|
| 1 | systems_designer | 6.5 |
| 2 | literary_reader | 7.5 |
| 3 | cozy_fan | 7.5 |
| 4 | strategy_simulationist | **3.5** |
| 5 | mobile_casual | 6.5 |
| 6 | accessibility_advocate | 5.5 |
| 7 | roguelike_replayer | 5.5 |
| 8 | first_timer | 6.5 |
| 9 | critic_journalist | 7.5 |
| 10 | qa_skeptic | 7.0 |
| | **Average** | **6.05** |

**The diagnosis, clustered from the raw feedback:**

- **Agency is the make-or-break gap** (strategy 3.5, roguelike 5.5, systems 6.5). No levers to pull,
  no readable state to plan against, no heir-shaping, no failure pressure — the house only drifts
  upward (a faithful 8k-line sim confirmed **53% of dynasties end in the top two of eight seats**).
  Most choices (~70%) leave no cross-generational mark; reputation is so skewed that 3 of 5 real
  dynasties produced the *identical* family motto.
- **Repetition threatens the literary soul** (literary 7.5, critic 7.5, cozy 7.5). The `spirit_hi`
  observation cluster — three variants of the *same* "lightness/weight" metaphor — was independently
  named by two jurors as the single worst offender. The adult/midlife card band recycles. The
  "had a child" line flattens the richest event to one emotional key.
- **Real QA bug** (qa 7.0): the heir's bloodline-parent NPC reuses the dead ancestor's name but was
  seeded at a *random* age and aged independently, so an ancestor could appear alive (and "frightened
  in the small hours") decades after the Chronicle records their death.
- **Accessibility** (5.5): the decision moment never announces itself to a screen-reader; emotional
  register (joy/loss) is colour-only; lists are div-soup; no skip link.
- **Mobile** (6.5): no way to speed past the quiet years; a 10px save-code box; a non-scrollable log.
- **Onboarding** (first_timer 6.5): the silent years read as "is it broken?"; the dynasty hook — the
  best reason to keep playing — is invisible during the first life.

The design tension is explicit: the agency cluster wants levers and readable state; the literary/cozy
cluster wants the quiet, number-less, stress-free soul preserved. **The whole challenge is to add
agency that is diegetic and prose-encoded rather than a dashboard.** That is the thesis of every fix
below.

## The convergence — every round's scores

Nine jury rounds (Round 0 = baseline, Rounds 1–8 = after each build pass). Every cell is transcribed
from a real receipt in [`a-life-eval/jury/round<N>/`](../../a-life-eval/jury). **90 verdicts in all.**

| Lens \ Round | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | **8** |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| systems_designer | 6.5 | 7.5 | 7.5 | 7.0 | 7.8 | 8.0 | 8.5 | 8.5 | **8.5** |
| literary_reader | 7.5 | 7.0 | 7.5 | 7.5 | 7.8 | 8.1 | 8.2 | 8.2 | **8.2** |
| cozy_fan | 7.5 | 7.5 | 8.3 | 8.6 | 8.8 | 9.0 | 9.0 | 9.2 | **9.2** |
| strategy_simulationist | **3.5** | 4.5 | 6.5 | 7.0 | 7.5 | 7.5 | 7.5 | 7.8 | **8.0** |
| mobile_casual | 6.5 | 6.5 | 7.5 | 8.0 | 8.3 | 8.4 | 8.4 | 8.4 | **8.4** |
| accessibility_advocate | 5.5 | 6.5 | 7.5 | 7.8 | 8.3 | 8.3 | 8.3 | 8.3 | **8.3** |
| roguelike_replayer | 5.5 | 5.5 | 6.5 | 7.5 | 7.8 | 7.6 | 7.9 | 8.1 | **8.3** |
| first_timer | 6.5 | 6.5 | 7.5 | 7.5 | 8.0 | 8.0 | 8.0 | 8.5 | **8.5** |
| critic_journalist | 7.5 | 7.0 | 7.5 | 7.8 | 8.1 | 8.3 | 8.5 | 8.5 | **8.5** |
| qa_skeptic | 7.0 | 6.5 | 7.5 | 7.8 | 7.9 | 8.1 | 8.1 | 8.1 | **8.3** |
| **Average** | **6.05** | **6.50** | **7.39** | **7.65** | **8.03** | **8.13** | **8.24** | **8.36** | **8.42** |
| **At/above 8** | 0 | 0 | 1 | 1 | 5 | 5 | 6 | 9 | **10** |

The arc is steady, not lucky: the average climbs every round, and the count of passing lenses grows
0 → 0 → 1 → 1 → 5 → 5 → 6 → 9 → **10**. Round 8 is the first single round in which all ten
independent reviewers land at or above the bar. The hardest lens — the strategy/sim gamer — travelled
the furthest, **3.5 → 8.0**, because a quiet reactive game is exactly what that profile finds thinnest.

## What was built (eight build passes)

Every fix was driven by the jury and verified before commit: a faithful headless sim (~40–60k lives
per run, reporting `age/stage/cooldown/once` violations — held at **0** throughout), resolved-transcript
spot-checks, and Playwright DOM smoke tests for anything UI-observable.

**The central move — agency that is *diegetic*, never a dashboard.** The make-or-break gap was that
the game asked you to *witness* a life, not *steer* one. The answer wasn't to bolt on stat bars (that
betrays the literary/cozy soul); it was to add levers and signals written *in the game's own voice*:

- **"How things stand" — a number-free readout.** An opt-in reflect button opens a prose reckoning of
  the five hidden stats in tiers ("the body is wearing"; "the means are deep, and closely watched"),
  the house's standing, the closest tie, and — crucially for the strategist — the house's reputation
  *trajectory* toward the pinnacle, in legible prose ("a name for being learned is only just beginning
  to gather… it has barely begun to settle"). Hidden by default, so the default view keeps its calm.
- **The bequest** — a late-life choice of what to set aside for the heir (their mind / a softer footing
  / the stories and warmth / their own freedom), applied as the next life's *real* starting conditions
  and stated plainly at succession. The one deliberate lever across the generation boundary.
- **The reckoning + a falling house.** A house with something to lose can be tested; meeting it
  head-on always keeps the house standing (cozy-safe — no hidden gotcha), but the seat falls on a
  deliberate "protect your own," and a broken or declining life can erode standing too. The change is
  **narrated in the life that caused it** ("The family's standing slipped this generation…").
- **Choice-driven reputation, distinct mottos.** The original engine let an *inherited* "soft spot for
  strays" silently re-score "kind" every generation, collapsing nearly every dynasty to one motto (a
  bug the QA juror root-caused). Reputation is now driven by what a life actually *did*; an inherited
  trait never re-scores. Result: from one motto to **7–8 distinct mottos across ~18 sampled dynasties**,
  with no single one dominant — and the milestone is named in the life that earns it.
- **The pinnacle, made reachable and legible.** "A house written into the histories" gates on a
  cumulative reputation high-water mark (so a name once built strong still counts) plus a peak fortune,
  re-earned every generation. The readout reads back exactly how far you are and what remains.
- **Content that gates on the dynasty** — seat-gated cards (the burdens of a great house; clawing up
  from nothing), reputation-gated cards (a scholar's door, a family shadow, a *feared name* and its
  later cost), and **trait-gated** moments so the inherited nature finally matters.
- **Competing-goods cards** — the binary "open vs. closed" grammar broken with moments where both roads
  are a virtue and neither is clearly right (honesty vs. mercy; loyalty vs. truth; your one life vs.
  the people who need you), echoed decades later by an elder reckoning.
- **Run-to-run pull** — a "houses you have raised" collection persists across runs and shows on the
  title; the love→marry→child pipeline was softened so lives diverge; a two-beat ruthless arc gives a
  dark dynasty its own thread.
- **The prose, deepened.** Every observation cluster that once fired one line 9+ times now has 5–6
  distinct variants; the `spirit_hi`/`light` "lightness" duplication, the flattened "had a child" line,
  the weak love-fall and refusal variants, the doubled body-as-letter metaphor, and the single-string
  marriage / late-love / fever lines were all expanded; the affair card picks its register by
  *character* (cold when low-spirited, self-deceiving when heart-led) rather than at random.
- **Accessibility to "genuinely inclusive."** The decision moment now announces itself (assertive live
  region + first-choice focus); joy/loss/echo carry screen-reader prefixes, not colour alone; the
  eulogy and heir dialogs expose their prose via `aria-describedby`; list semantics, a skip link,
  reduced-motion guards, a stage-transition live region, and a correctly 3-state pace control.
- **Mobile & onboarding.** Tap the flowing-years text to race past the quiet years (with a breathing
  liveness dot); a cold-start "continuing House X" confirmation; a legible select-all save code; the
  title now leads with the dynasty hook and names the verb; the heir screen states the identity shift
  plainly; a first-life breadcrumb makes the dynasty hook land *during* the first life; the QA
  phantom-ancestor contradiction (an ancestor "alive" after their recorded death) was fixed by making
  the bloodline parent born and gone in exactly the years the Chronicle records.

## Round-by-round (what each pass targeted)

- **Pass 1 (→ R1, avg 6.50).** Foundation: the QA phantom-ancestor fix; the worst repeated-prose
  clusters; the diegetic readout, bequest, reckoning, seat/repute-gated cards; the first accessibility,
  mobile, and onboarding batch. Strategy 3.5 → 4.5; a11y 5.5 → 6.5.
- **Pass 2 (→ R2, avg 7.39).** The first big lift — cozy crosses at 8.3; everything else to ~7.5 as the
  agency layer and prose pools landed and the systems were verified end-to-end.
- **Pass 3 (→ R3, avg 7.65).** The motto-convergence root cause (the inherited-heirloom bug, flagged by
  five jurors) fixed; strategy depth (invest-in-the-name, reputation-steering, trait gates); a11y
  eulogy announce; cozy reckoning made non-punishing.
- **Pass 4 (→ R4, avg 8.03).** Reputation rebalanced to choice-driven; fall narrated in the moment;
  competing-goods cards; meta-progression collection; four QA bugs; **five lenses now pass.**
- **Pass 5 (→ R5, avg 8.13).** Made the new shadow/competing-goods content actually *fire*; mottos
  crystallize reliably; the `a_child` "No" line fixed; literary pools deepened.
- **Pass 6 (→ R6, avg 8.24).** Seat-7 reachable; `r_hard_name` fires; mottos flattened to no dominant
  tag; **six pass.**
- **Pass 7 (→ R7, avg 8.36).** The pinnacle's *trajectory* made legible; a second ruthless beat
  (`r_name_cost`); the motto milestone named in-life; an earlier first-life dynasty breadcrumb.
  roguelike and first_timer cross — **nine pass.**
- **Pass 8 (→ R8, avg 8.42).** The last strategy gaps: no silent trajectory tier when a name is thin;
  the seat-5 → seat-6 step now stated; honest investment odds; old-save robustness. **All ten pass.**

## The result

A second autonomous, jury-driven hardening — **eight build passes, ninety independent verdicts** — took
*A Life* from a beautiful-but-passive vignette machine (avg 6.05, the toughest lens at 3.5) to a game
that **ten different kinds of player and reviewer each, independently and blind, rate 8 or higher**
(avg 8.42, range 8.0–9.2). It gained a real, plannable generational layer — readable in prose, with
levers, failure pressure, distinct dynasties, and a reachable, legible pinnacle — **without ever
betraying the quiet, number-less, literary soul** that the cozy and literary lenses prize (both of
which rose, to 9.2 and 8.2). The receipts are all on disk; the methodology was the point.


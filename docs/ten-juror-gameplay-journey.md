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

<!-- rounds appended below as the work proceeds -->

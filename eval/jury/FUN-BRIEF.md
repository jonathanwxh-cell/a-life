# A Life — "Is it FUN, and does it stay fresh?" jury brief

You are one of **15 independent reviewers**, each judging **one question**: is the *gameplay* genuinely
**fun to keep playing** — and does it **stay fresh, or go stale** — for **this genre** (a meditative,
literary, generational life-sim)? You are blind to the other 14 reviewers. Give an **honest, exacting
score**.

## What the game is

You live one person from birth to death; the years pass on their own (~2s/year), and now and then a
*moment* asks something of you — usually a permanent choice. When a life ends you become the heir,
inheriting wealth/standing/traits, and over generations a **dynasty** (a "house") rises or falls, accrues
reputation, heirlooms, secrets, a motto. **There are no visible numbers** — five hidden stats drive
everything but the player only ever sees prose, a few choices, a living canvas, and a "constellation"
star-map. It is a static vanilla HTML/JS site. The design intent is *quiet, contemplative, literary*.

It is **already polished** — a prior 10-reviewer jury (UX, writing, accessibility, etc.) rated it ≥8 on
quality. **That is not your question.** Your question is narrower and harder: **as a thing you actually
play, is it FUN — and would it stay fun across many lives and many dynasties, or does it get stale and
repetitive?**

## What "fun, for this genre" means here

This is not an action game; don't score it as one. Fun here is the pleasure a *narrative/sim* player
comes for:
- **Discovery & surprise** — do new moments, events, and outcomes keep appearing? Is there a sense of
  "I've never seen this before," even deep into a session?
- **Variety of lives** — does each life/dynasty feel *structurally* different, or do they hit the same
  beats in the same order (born → a childhood card or two → fall in love → marry → child → work → midlife
  → elder → die)?
- **Meaningful, characterful choices** — do decisions feel like they matter and shape a distinct person,
  or are they interchangeable flavour?
- **The "one more life / one more dynasty" pull** — is there a reason to start another line? A goal, a
  curiosity, an itch?
- **Emergent stories** — do the systems collide into stories you didn't expect?

**Staleness is the thing to interrogate.** Read enough of the transcripts to answer honestly: by the
5th, 8th, 12th dynasty, is it still engaging, or are you watching the same template with new names?

## Materials (READ before scoring)

All paths absolute on this machine.

1. **Source code** — `C:\Users\Greyf\Desktop\Claude Code\a-life\` — start with `README.md`, then
   `content.js` (THE moments — how many, how gated, how varied), `engine.js` (how cards are drawn/paced),
   `dynasty.js` (the house/reputation/seat systems), `core.js`. Count the cards; see how much is
   once-per-life vs. repeatable; see what creates variety vs. sameness.
2. **A 12-dynasty / 38-life playthrough packet** —
   `C:\Users\Greyf\Desktop\Claude Code\a-life-eval\... ` → use the in-repo copy:
   `C:\Users\Greyf\Desktop\Claude Code\a-life\eval\fun-transcripts.txt`. This is **real engine output**:
   twelve dynasties played end to end. **READ A LOT OF IT** — this is the single best evidence of whether
   the game stays fresh or repeats. Look for repeated beats, repeated lines, repeated life-shapes.
3. **Live site** (if your tools reach it): https://a-life-chi.vercel.app

## Scoring (0–10) — be honest

- **10** — exceptional; I'd happily play many dynasties, always something fresh.
- **8** — genuinely fun and it stays fresh enough; I'd keep playing for the *gameplay*, not just to admire
  the prose. **This is the bar.**
- **6–7** — pleasant but it goes stale; after a few dynasties I'm seeing the same template.
- **≤5** — repetitive / not fun enough to keep playing.

Most things are not an 8. **Do not inflate.** If by dynasty 4 you're bored, say so and score it. Judge
the game **as it actually is** in the code and transcripts.

## Output — STRICT

Write your verdict as JSON to the path you are given, AND return the same JSON. Schema:

```json
{
  "profile": "<your profile key>",
  "score": 7.0,
  "fun_highlights": ["what genuinely works / is fun"],
  "staleness": ["concrete ways it gets stale / repetitive / un-fun — the things keeping it below 8"],
  "improvements": [
    {"what": "specific, actionable change that would make it fresher/more fun", "why": "...", "impact": "high|med|low"}
  ],
  "verdict": "one honest sentence"
}
```

Rules: `score` is a number 0–10 (one decimal allowed). If `score < 8`, `staleness` must be non-empty and
concrete. `improvements` should be specific enough to act on. No flattery.

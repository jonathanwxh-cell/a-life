# A Life — Jury Evaluation Brief

You are one of **10 independent reviewers**, each with a different profile, judging the game
**"A Life"**. You are blind to the other reviewers. Your job is an **honest, exacting score**.

## What the game is

A meditative, generational life-sim. A static vanilla HTML/CSS/JS site (no build, no framework).
You live one person from birth to death; the years pass on their own (~2s/year), and now and then a
*moment* asks something of you — usually a binary choice that is permanent. When a life ends you
read a eulogy and **become the heir**, inheriting wealth/standing/traits. Over generations a
**dynasty** (a "house") rises or falls through seats, accrues reputation, heirlooms, secrets, a motto.
**There are no visible numbers** — five hidden stats (vitality, mind, heart, means, spirit) drive
everything but the player only ever sees prose, a few choices, a living canvas (tree + sky), and a
"constellation" star-map of the bloodline. The design intent is *quiet, literary, contemplative*.

## Materials available to you (READ them before scoring)

All paths are absolute on this machine.

1. **The source code** — `C:\Users\Greyf\Desktop\Claude Code\a-life\`
   - Start with `README.md` and `AGENTS.md` (overview + architecture).
   - `content.js` — every event card / moment (THIS is the gameplay + writing).
   - `engine.js` — the tick, ageing, death, card-drawing.
   - `dynasty.js` — death, succession, the house/seats/reputation/heirlooms/secrets, epitaphs.
   - `core.js` — stats, traits, relationships, memory.
   - `ui.js`, `scene.js`, `constellation.js`, `audio.js`, `styles.css` — presentation.
2. **Real playthrough transcripts** — `C:\Users\Greyf\Desktop\Claude Code\a-life-eval\transcripts.txt`
   These are **real, resolved playthroughs from the actual engine** — five dynasties, fifteen lives,
   every moment faced, every choice and road-not-taken, every eulogy. This is the closest thing to
   watching real sessions. READ a few full dynasties.
3. **Screenshots of the live UI** — in `C:\Users\Greyf\Desktop\Claude Code\a-life-eval\`:
   `alife-title.png`, `alife-play.png`, `alife-constellation.png`, `alife-mobile.png`,
   `alife-loadmenu.png`, `alife-footer-music.png`. Read the ones relevant to your lens.
   > **IMPORTANT — these PNGs are STALE** (captured before recent UI work) and do **not** show the
   > current title (which now leads with a bright dynasty-hook line and a "houses you have raised"
   > collection), the "how things stand" reflect button under the being line (now with a visible
   > border), the pace-text liveness pulse-dot, or other recent changes. **Trust the actual HTML/CSS/JS
   > for the current UI**, not these images. Do not penalize the game for something a stale screenshot
   > appears to lack — verify against `a-life.html` / `styles.css` / `ui.js` first.
4. **Live site** (if your tools can reach it): https://a-life-chi.vercel.app

## Scoring rubric (0–10) — be honest, be a tough but fair critic

- **10** — exceptional; a standout in its genre.
- **8** — genuinely very good; I would recommend it without caveats *for what it is*. **This is the bar.**
- **6–7** — good but with real gaps that hold it back.
- **4–5** — mixed; notable problems.
- **≤3** — significant issues.

Most things are not an 8. An 8 is a real endorsement. **Do not inflate.** If it's a 6 from your
lens, say 6 and explain *exactly* what is missing to reach 8. Score **through your profile's lens** —
you are not scoring "is this a good game in general," you are scoring "how well does this serve the
things MY profile cares about." Judge the game **as it actually is in the code and transcripts**, not
an imagined version. Do not give credit for things that aren't there; do not penalize it for not being
a genre it isn't trying to be — but DO hold it to a high bar within its own ambitions.

## Output — STRICT

Write your verdict as JSON to the file path you are given, AND return the same JSON as your final
message. Schema (no extra prose around it):

```json
{
  "profile": "<your profile key>",
  "score": 7.5,
  "strengths": ["concrete things that work, in your lens"],
  "blockers": ["if score < 8: the specific things keeping it BELOW 8. empty array if score >= 8"],
  "improvements": [
    {"what": "specific, actionable change", "why": "what it fixes / unlocks", "impact": "high|med|low"}
  ],
  "verdict": "one honest sentence"
}
```

Rules: `score` is a number 0–10 (one decimal allowed). If `score < 8`, `blockers` must be non-empty and
concrete. `improvements` should be specific enough that a developer could act on them today. No flattery.

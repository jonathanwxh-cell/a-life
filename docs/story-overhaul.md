# Story & decisions overhaul — design spec

*Status: **implemented** 2026-05-31 (commits: engine/succession, then content). Design dated 2026-05-31.*

> **Implemented & verified.** All four pillars shipped. A headless sim harness
> (the real `core`/`content`/`engine`/`dynasty` run in a Node `vm` with a DOM
> stub) over 5–6k lines confirms: **0** age-band / stage / cooldown / `once`
> violations; **early death ≈ 9% before 55** (target 8–12), with infancy (age
> <6) protected; **every heir starts at age 0** and lives childhood→elder; the
> card set grew **39 → 57**; and with the new late-love path a player who wants a
> line continues it **~47% per generation** (was ~10%). A real-browser smoke test
> confirms the heir screen, card render, and death/eulogy all draw correctly with
> a clean console. Tuning knobs that landed: `EARLY_MORTALITY=0.0024`,
> `PERIL_MULT=2.2` (engine.js); `a_child` w7/age[26,46]/cool5; `a_meet_late` w3;
> `u_windfall`/`u_loss` cool14.

Makes the game's decisions feel relevant to a person's **age** and **situation**,
lets **every generation live a full life** (not just the founder), adds **more and
richer** moments, and gives outcomes **real consequence** — while keeping the quiet,
meditative tone.

## Why (audit findings being fixed)

1. **Heirs skip childhood & youth.** An heir starts at its current age when the
   parent dies (~40–55), so only the gen-1 founder ever lives the early stages.
2. **Cards gate by broad *stage* only** (child 0–12, youth 13–25, …), so a "first
   book" can fire at age 2 and "first love" at 13.
3. **Cards ignore the person's situation:** `m_money` ("your savings have weight")
   fires when destitute; `y_risk` fires with nothing saved; `c_steal` (hunger) fires
   for a rich child.
4. **One youth card is the only path to love/marriage/children** — decline it and the
   dynasty is foreclosed.
5. **Almost no early mortality**; lives are uniformly long.
6. **Few decisions per life**, and some cards repeat oddly (no `once`/cooldown).

## Pillar 1 — Age & situation fit *(engine + content)*

**Engine (`engine.js`, `eligible()`):** add two optional card fields.
- `age:[lo,hi]` — eligible only when `lo ≤ P.age ≤ hi`. When present it **replaces**
  the stage check (so cards can span stages naturally). When absent, the existing
  `stage` check applies (back-compatible).
- Cards may add richer `cond` for situation. (No engine change; just more conds.)

```js
// in eligible(), per card c:
if (c.age) { if (P.age < c.age[0] || P.age > c.age[1]) return false; }
else if (c.stage !== '*' && c.stage !== stage) return false;
```

**Content retrofit (`content.js`):** give existing cards real age bands and situation
conds. Representative decisions (full pass during build):

| card | `age` | added `cond` | notes |
|------|-------|--------------|-------|
| c_book | [7,12] | — | school age |
| c_sick | [3,10] | — | already `once` |
| c_friend | [6,12] | `!rel('friend')` | |
| c_steal | [6,12] | `means<35` | hunger only |
| c_animal | [6,11] | — | `once` |
| y_path | [15,20] | — | coming-of-age fork; `once` |
| y_love1 | [16,25] | `!rel('love')` | |
| y_risk | [18,28] | `means>20` | has something to lose |
| y_leave | [17,24] | — | `once` |
| y_drink | [18,26] | — | |
| y_mentor | [14,22] | — | `once` |
| a_marry | [24,45] | `rel('love')&&!married` | |
| a_child | [26,44] | `(love||spouse)&&kids<3` | |
| a_work | [28,60] | — | spans into midlife |
| m_money | [42,70] | `means>50` | real savings only |
| m_health | [45,68] | — | `once` |
| u_windfall/u_loss | — (`*`) | keep | universal |

(The remaining cards get bands during the build; principle: gate to the years a real
person would face the moment, and to the means/relationships it assumes.)

## Pillar 2 — Heirs live from birth *(the load-bearing change)*

Change succession (`dynasty.js`, `succeed()` + `showHeir()`):

- The heir is **born into the house** — `startAge: 0` instead of `childRel.age`. They
  live the full arc (child → elder).
- **Inheritance applies as starting conditions at birth** (unchanged set): a share of
  the estate (`inheritMeans`/seat floor), the house's standing, blended traits,
  inherited heirlooms & the family secret as memories, and `nurture` (parent's
  mind/bond sharpening the child).
- **Childhood family is seeded fresh** like a founder's — a mother and father — with the
  **lineage parent named for the just-deceased ancestor** (continuity). No relations carry
  over: the heir is a newborn with its own family, so the dead parent's surviving spouse,
  friends, etc. are not carried. This avoids re-simulating the dead parent — each generation
  is a self-contained full life with inherited *state* (estate, standing, traits, heirlooms,
  secret, nurture) plus a parent named for the line.
- `bornYear` is unchanged in formula (the heir's true birth year); the life simply runs
  from age 0.
- The **heir screen** already says "born into House X / Nth of the line" — keep, and make
  the opening lines reflect being a child of the house (not an adult inheriting).

Result: every generation experiences childhood and youth, so *all* the early-life content
is in play every line, and the title becomes literal — *"one person, born into the world.
Then the next."*

## Pillar 3 — More & richer decisions *(content)*

- **Adult/midlife path to love & family** — e.g. `a_meet_late` (age ~[28,55],
  `cond:!rel('love')&&!rel('spouse')`): meet someone in adulthood, so a missed youth
  romance no longer forecloses the dynasty. Feeds the existing marriage/child cards.
- **Fill the now-always-played early stages and broaden the rest.** Target: ~39 → **~55–60
  cards**, every new one age/situation-gated. Concept seeds (final writing during build):
  - *Child:* a sibling rivalry; a family move; a first loss (a pet, a grandparent); a
    talent noticed.
  - *Youth:* a first wage job; a friend's betrayal; a stand on principle; a leaving.
  - *Adult:* the late-love path above; a home of one's own; a public role; a parent's
    decline echoed early.
  - *Midlife:* a reinvention; mentoring a young one; an old flame resurfaces.
  - *Elder:* passing down a craft; a last journey; making peace with the end.

## Pillar 4 — Real consequence *(tonally careful)*

- **Rare early mortality (`engine.js`, `deathRoll()`).** Add a small, vitality-modulated
  baseline chance before 55 so some lives end early (a fever, a recklessness, a mishap),
  targeting **~8–12%** of lives ending before 55. Keep it quiet (the existing eulogy
  handles it). Sketch:
  ```js
  if (a < 55) p += 0.004 * (1.5 - v/100);   // tiny; tune to the target rate
  ```
  Plus **choice-tied risk:** a few reckless branches (e.g. `y_drink` "burn through it",
  `y_risk`, ignoring `m_health`) set a short-lived elevated-risk flag, so early death feels
  *earned* rather than arbitrary. (Rare — most reckless choices still survive.)
- **No-repeat cooldown.** Record a card's last-drawn age; a non-`once` card can't redraw
  within ~10 years. Mark genuinely one-time moments `once`. Stops odd repeats (reading the
  too-hard book twice).
  ```js
  // presentCard(): P.drewAt = P.drewAt||{}; P.drewAt[c.id]=P.age;
  // eligible(): if (P.drewAt && P.drewAt[c.id] && P.age - P.drewAt[c.id] < 10) return false;
  ```

## Files touched

| File | Change |
|------|--------|
| `engine.js` | `eligible()` age-gating + cooldown; `deathRoll()` early mortality; record `drewAt` in `presentCard`. |
| `content.js` | Retrofit existing cards (age bands, situation conds, `once`); add ~15–20 new cards. |
| `dynasty.js` | `succeed()` → heir born at 0, childhood family seeded, inheritance at birth; `showHeir()` wording. |
| `ui.js` | Minor: heir-screen / opening-line wording (if needed). |

## Build sequence (each verifiable on its own)

1. **Engine** — age-gating, cooldown, early mortality, heir-from-birth. Verify: a fresh
   founder *and* an heir both start at age 0 and draw stage-appropriate cards; early death
   is possible but uncommon.
2. **Content retrofit** — age bands + conds + `once` on the existing cards. Verify: no card
   fires at an absurd age/situation in a simulated run.
3. **New content** — the late-love path + ~15–20 new cards. Verify: counts, age coverage,
   no foreclosed dynasties.

## Verification

Hidden-stat sim harness (run in the page console): simulate N lives, log every card drawn
with the person's age + key stats; assert no card fires outside its `age`/`cond`, no
non-`once` card repeats inside the cooldown, heirs cover childhood→elder, and early-death
rate ≈ target. Spot-read several full life logs for tone.

## Out of scope / risks

- Not changing the constellation, house/seat math, or persistence (saves stay
  compatible; new fields default safely).
- The heir-from-birth change is the riskiest — it reframes succession. If it proves
  disruptive, pillars 1, 3, 4 stand alone and #2 can ship separately.
- Keep the tone meditative: early death stays rare and quiet; new cards stay sparse and
  writerly, not gamey.

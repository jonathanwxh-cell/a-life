# Images — the painterly backdrops

The game uses eight soft, painterly images as **dimmed atmospheric backdrops** at
its narrative beats. They sit behind the text (heavily darkened so the writing
stays readable) and echo the living canvas's own dawn→dusk, tree-growing arc.

## The set (`assets/*.webp`)

| File | Used at | Mood |
|------|---------|------|
| `title.webp` | Title screen (`#vTitle`) | lone tree, golden hour |
| `eulogy.webp` | Eulogy / "an ending" (`#vDeath`) | bare tree, sun setting into violet |
| `heir.webp` | "The line continues" (`#vHeir`) | a sapling against a sunrise |
| `stage-child.webp` | Stage transition → childhood | a seedling, early light |
| `stage-youth.webp` | → youth | a young tree, sun climbing |
| `stage-adult.webp` | → adulthood | a full tree at midday |
| `stage-midlife.webp` | → midlife | mature tree, golden afternoon, leaves drifting |
| `stage-elder.webp` | → old age | an old bare tree at dusk |

## Where they're wired in

- **Veils (title/eulogy/heir):** each veil in `a-life.html` has a
  `<div class="veil-art" style="background-image:url('assets/X.webp')">`. The
  `.veil-art` rule in `styles.css` covers the veil at z-index 0 with a dark
  gradient scrim (`::after`); the `.sheet` text sits above it at z-index 1.
- **Stage transitions:** `scene.js` has a `STAGE_ART` map (stage word → filename)
  and a `#stageArt` full-screen layer. When a new life stage is announced, the
  matching image washes in dimly (`opacity .42`, gentle fade) alongside the stage
  title, then fades out.
- **Preview:** `gallery.html` renders all eight for review (dev-only; not loaded by the game).

## How they were generated — **key-free, via Codex's built-in tool**

> **Cost-safety:** generate images with **Codex's built-in `image_gen` tool**, which
> does **not** consume the maintainer's `OPENAI_API_KEY`. Do **not** call the OpenAI
> Images API directly — that bills the key. (The built-in tool has no model selector;
> it uses its own model.) On Windows, run the Codex session with full local access so
> the tool can actually write the file, and verify the byte size changed afterward.

Shared aesthetic prompt (keep them a consistent family): *soft painterly minimalism,
warm amber/gold palette on deep brown-black earth and a low horizon, a single tree as
the subject, the sun's height encoding the time of day, atmospheric and contemplative,
no text, no people.* Vary per beat (sapling vs. bare tree; dawn vs. dusk sun).

## Optimization (required before shipping)

Raw renders are ~1.25–2.5 MB PNGs. They are resized + converted to WebP with Pillow
(**~16 MB → ~400 KB total**). To redo:

```sh
python -m pip install Pillow   # if needed
python - <<'PY'
from PIL import Image
for n in ['title','eulogy','heir','stage-child','stage-youth','stage-adult','stage-midlife','stage-elder']:
    Image.open(f'assets/{n}.png').convert('RGB').resize((1000,1000), Image.LANCZOS).save(
        f'assets/{n}.webp', 'WEBP', quality=76, method=6)
PY
```

Only the `.webp` files are committed/served; the source PNGs are not kept in the tree
(they remain in git history if ever needed).

## To add or change an image

1. Generate the new render via Codex's built-in `image_gen` tool (see above), in the
   shared style.
2. Optimize it to `assets/<name>.webp` with the Pillow snippet.
3. Wire it: a veil → add/point a `.veil-art` background in `a-life.html`; a stage →
   add to the `STAGE_ART` map in `scene.js`.
4. Verify it loads and the text stays readable; tune the scrim (`.veil-art::after`)
   or wash opacity (`#stageArt.show`) in `styles.css` if needed.

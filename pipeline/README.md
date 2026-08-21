# BondBound Render Pipeline

Headless, parameterized Blender pipeline for the "Dark Menagerie" art style
(see `docs/BondBound_ArtStyle_v1.0.md` — the style bible is the source of truth),
plus a **pre-rendered 2.5D → pixel sprite** stage that turns the 3D renders
into GBA-style sprite sheets (the game's shipping art format).

## Structure

| File | Role |
|---|---|
| `style_core.py` | Reusable style module: toon/glow material factories, inverted-hull outlines, the standard 3-light rig, orthographic camera (hero/back/overworld angles), Eevee render settings with bloom, idle-loop animation helper. **Creature scripts import this; never restate style rules in a creature script.** |
| `kindlpup.py` | Kindlpup (Primal/Ember) — procedural build + render entry point. Template for future creature scripts. |
| `pixelate.py` | 3D renders → pixel sprites: shared-anchor cropping, fixed-palette color snapping (crisp cel bands), hard alpha, outline reinforcement, sprite sheet packing. Plain Python + Pillow. |
| `make_sprites.py` | One command per creature: runs all renders, then pixelates into `assets/sprites/{creature}/`. Holds the per-creature sprite palettes. |

Intermediate renders land in `renders/{creature}/` as
`{creature}_{stage}_{anim}_{frame:02d}.png` (512×512 transparent RGBA PNG).
Shipping sprites land in `assets/sprites/{creature}/`:

| Sheet | Format |
|---|---|
| `{creature}_s0_battle_front.png` | 64×64 battle sprite, 3/4 front |
| `{creature}_s0_battle_back.png` | 64×64 battle sprite, 3/4 back |
| `{creature}_s0_idle_sheet.png` | 8 × 64×64 idle loop, one row |
| `{creature}_s0_overworld_sheet.png` | 3 × 32×32 walk frames × 4 rows (down, left, right, up) |

## Sprite generation (the usual entry point)

```
python3 pipeline/make_sprites.py                 # render everything + pixelate
python3 pipeline/make_sprites.py --skip-render   # re-pixelate existing renders
```

## Running renders directly

With a Blender install (4.2+):

```
blender -b -P pipeline/kindlpup.py -- --output renders/kindlpup/ --mode still
blender -b -P pipeline/kindlpup.py -- --output renders/kindlpup/ --mode idle
```

Or with the pip `bpy` module (no Blender install needed — `pip install bpy==4.2.*`,
requires Python 3.11):

```
python3 pipeline/kindlpup.py --output renders/kindlpup/ --mode still
python3 pipeline/kindlpup.py --output renders/kindlpup/ --mode idle
```

Both invocations are equivalent; the scripts detect whether args come after
Blender's `--` separator or directly from Python.

## Parameters (`kindlpup.py`)

| Flag | Default | Meaning |
|---|---|---|
| `--output` | `renders/kindlpup/` | Output directory (created if missing) |
| `--mode` | `still` | `still` = front hero render; `idle` = 8-frame loop; `back` = battle back view; `overworld` = 4 directions × 3 walk frames; `all` = everything |
| `--resolution` | `512` | Square render size in px |
| `--seed` | `7` | Drives small random variation in head tilt (±3°) and ear tilt (±5°) for iteration |

## What style_core enforces

- **Toon material**: white Diffuse → Shader-to-RGB → constant ColorRamp
  (2 hard cel bands, lit/shadow split at 0.36), plus Fresnel (IOR 1.8) → ×2.0
  → emission rim in the archetype glow color, added over the cel result.
- **Glow material**: pure emission (eyes strength 6, embers strength 8) —
  bright enough to trip bloom.
- **Outlines**: Solidify modifier, flipped normals, backface-culled emission
  shell. Thickness = 2% of bounding-box height. No Freestyle.
- **Light rig**: warm-white key (`#FFF4E0`) upper-left 45°, strong rim in the
  glow color behind-above, world ambient Shadow Violet `#1A1430` @ 0.08 so
  shadows violet-shift. Film transparent.
- **Camera**: orthographic, 3/4 front, 8° low angle (hero), auto-framed with
  10% padding from the subject's combined bounding box.
- **Render**: Eevee Next, 16 TAA samples, `Standard` view transform (exact
  palette colors — no AgX/Filmic remap), PNG RGBA.
- **Idle loop** (frames 0–7, seamless): vertical bob 2.5% of height, breathe
  scale ±1.5%, glow emission ±20%, all one sine cycle across 8 frames.

## Bloom implementation note (Blender 4.2+)

Eevee Next removed the legacy `use_bloom` toggle (the property still exists but
is ignored). `setup_render()` therefore builds bloom in the compositor: a Fog
Glow glare node (threshold 0.9, mix −0.88 ≈ the spec's 0.06 intensity) plus an
alpha-lift chain so glow halos survive onto transparent-background pixels.
On pre-4.2 legacy Eevee it falls back to the native bloom settings automatically.

## Pixelation notes

- Each frame **set** (battle views + idle together; the 12 overworld frames
  together) shares one union bounding box, so animation bob survives and all
  frames keep the same anchor and scale.
- Colors snap to a fixed per-creature palette (in `make_sprites.py`) instead
  of adaptive quantization — that is what keeps the cel bands hard at 64px.
- Silhouette edge pixels are forced to the outline color after snapping, so
  every sprite keeps the continuous colored contour (`#241012` for Kindlpup).
- Overworld walk is the classic 3-frame cycle (neutral / hop-left / hop-right);
  play it 0-1-0-2 for a 4-step gait.

## Adding a new creature

1. Copy `kindlpup.py`, replace the palette constants with the archetype's
   family from the style bible §2.2 and rebuild the geometry in
   `build_kindlpup()`'s style (metaballs for the organic mass, primitives for
   pointed features, accent overlays as separate slightly-proud meshes).
2. Add a palette entry for it in `make_sprites.py` (`CREATURES` dict).
3. Do **not** touch `style_core.py` — if a creature needs a style change, the
   style bible changes first.

## Tested with

- Blender **4.2.22 LTS** via the PyPI `bpy` wheel, Python 3.11, CPU/software GL
  (llvmpipe) — still render ≈ 7 s, full idle loop ≈ 55 s.
- Sanity-checked programmatically: 512×512 RGBA, fully transparent corners,
  outline color `#241012` present, 8 distinct animation frames.

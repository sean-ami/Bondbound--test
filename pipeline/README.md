# BondBound Render Pipeline

Headless, parameterized Blender pipeline for the "Dark Menagerie" art style
(see `docs/BondBound_ArtStyle_v1.0.md` — the style bible is the source of truth).

## Structure

| File | Role |
|---|---|
| `style_core.py` | Reusable style module: toon/glow material factories, inverted-hull outlines, the standard 3-light rig, orthographic hero camera, Eevee render settings with bloom, idle-loop animation helper. **Creature scripts import this; never restate style rules in a creature script.** |
| `kindlpup.py` | Kindlpup (Primal/Ember) — procedural build + render entry point. Template for future creature scripts. |

Outputs land in `renders/{creature}/` as `{creature}_{stage}_{anim}_{frame:02d}.png`
(e.g. `kindlpup_s0_idle_03.png`), 512×512 transparent RGBA PNG.

## Running

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
| `--mode` | `still` | `still` = single hero render; `idle` = 8-frame loop |
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

## Adding a new creature

1. Copy `kindlpup.py`, replace the palette constants with the archetype's
   family from the style bible §2.2 and rebuild the geometry in
   `build_kindlpup()`'s style (metaballs for the organic mass, primitives for
   pointed features, accent overlays as separate slightly-proud meshes).
2. Do **not** touch `style_core.py` — if a creature needs a style change, the
   style bible changes first.

## Tested with

- Blender **4.2.22 LTS** via the PyPI `bpy` wheel, Python 3.11, CPU/software GL
  (llvmpipe) — still render ≈ 7 s, full idle loop ≈ 55 s.
- Sanity-checked programmatically: 512×512 RGBA, fully transparent corners,
  outline color `#241012` present, 8 distinct animation frames.

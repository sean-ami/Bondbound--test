# Claude Code Prompt — Kindlpup Style Test (Blender Pipeline)

## Context

This is a style proof-of-concept for **BondBound**, a creature deckbuilder. We are adapting the parameterized headless Blender pipeline architecture (from the Solstice Watch project) to a new visual style: **Hades-inspired toon-shaded 3D** — dark and slightly spooky, with vibrant jewel-tone accents.

The goal of this task is ONE creature, ONE render setup, proven end-to-end: **Kindlpup**, a small fire wolf pup. If this looks right, the pipeline gets extended to 8 more creatures and 9+ enemies. Build it clean and modular from the start.

The full style specification is in `BondBound_ArtStyle_v1.0.md` (in this folder — read it first). Key rules are restated below, but the style doc is the source of truth.

## Deliverables

1. `pipeline/style_core.py` — reusable module: materials, lighting rig, camera, render settings. Every future creature script will import this.
2. `pipeline/kindlpup.py` — creature-specific script: builds the Kindlpup model procedurally, applies style_core, renders.
3. `renders/kindlpup/kindlpup_s0_still.png` — single 512×512 hero render (transparent background).
4. `renders/kindlpup/kindlpup_s0_idle_00.png` … `_07.png` — 8-frame idle loop.
5. `pipeline/README.md` — how to run it, what the parameters are.

Run via: `blender -b -P pipeline/kindlpup.py -- --output renders/kindlpup/ --mode still` (and `--mode idle` for the animation frames).

---

## style_core.py Requirements

### Toon material factory
`make_toon_material(name, body_color, shadow_color, outline_color, glow_color)` returning a material with:
- Shader-to-RGB → ColorRamp (Constant interpolation) producing 2 hard cel bands: lit band = `body_color`, shadow band = `shadow_color`
- Fresnel-driven rim emission: Fresnel (IOR 1.8) → multiply → Emission node in `glow_color`, strength ~2.0, mixed over the cel result
- Works in **Eevee Next** (Blender 4.2+). If Shader-to-RGB is unavailable in the installed version's Eevee Next, fall back to a ColorRamp on a Diffuse-to-RGB conversion or use the Eevee legacy engine — detect and handle this, don't crash.

### Emission material factory
`make_glow_material(name, color, strength=5.0)` — pure emission for eyes/embers, bright enough to trip Bloom.

### Outline system
`add_outline(obj, color, thickness_pct=0.02)` — Solidify modifier (flip normals, offset outward), backface-culled emission material in `color`. Thickness = `thickness_pct` × object bounding-box height.

### Lighting rig
`setup_lighting(glow_color)`:
- Key: Area light, upper-left 45°, color `#FFF4E0`, moderate power
- Rim: Area light behind-above subject, color = `glow_color`, strong
- World: background color `#1A1430` at very low strength (0.05–0.1) so shadows violet-shift
- Film transparent ON

### Camera & render
`setup_camera(target, mode="hero")`:
- Orthographic camera, 3/4 front angle, slight low angle for "hero" mode
- Frame the subject with ~10% padding

`setup_render(output_path, resolution=512)`:
- Eevee (Next), Bloom enabled (threshold 0.9, intensity 0.06)
- PNG, RGBA, transparent film
- Resolution 512×512

### Idle animation helper
`animate_idle(obj, glow_materials, frames=8)`:
- Vertical bob: sine, amplitude 2.5% of object height, one full cycle over the 8 frames
- Breathe: uniform scale sine, amplitude 1.5%
- Glow pulse: emission strength ±20% sine on all materials in `glow_materials`
- All three loop seamlessly (frame 8 flows into frame 0)

---

## kindlpup.py — The Creature

### Design brief
Kindlpup is a **small fire wolf puppy**: round, appealing, slightly spooky in its lighting but adorable in its shapes. Companion energy — a kid should want to pet it.

### Proportions & construction (procedural, primitives + modifiers are fine — no sculpting needed)
- Overall height ~1.0 unit. **Big head** (~40% of body mass), round body, stubby legs, **oversized paws** (cute-factor anchor)
- Large pointed ears, slightly too big for the head, with a **single floating ember** (small emissive sphere) hovering just above the tip of each ear
- Short muzzle, big round eyes
- Bushy tail curling upward
- Subtle chest fluff (a slightly protruding rounded mass)
- Use metaballs or merged/remeshed primitives with a Subdivision + Cast/Smooth pass for organic rounding. Shade smooth with auto-normals. Keep it simple — silhouette matters far more than surface detail.

### Palette (from the style doc — Primal/Ember family)
| Element | Color |
|---|---|
| Body (lit band) | `#5A2A2E` |
| Body (shadow band) | `#3A1A26` (violet-shifted — mix of body and `#1A1430`) |
| Inner ears / paw pads / chest fluff (lit) | `#C22E0E` |
| Outline | `#241012` |
| Rim light + rim emission | `#FF6B1A` |
| Eyes (emission) | `#FFC24B`, strength 6 |
| Ear ember (emission) | core `#FFC24B` strength 8, small — about 4% of body height |

### Composition
- 3/4 front hero angle, slight low camera
- Head tilted ~10° (curious puppy energy)
- Weight slightly forward on the front paws (Primal shape language: about to lunge, but puppy-scale)

### CLI parameters (argparse after `--`)
- `--output` (dir), `--mode` (`still` | `idle`), `--resolution` (default 512), `--seed` (default 7, drives small random variation in ear tilt / head tilt for iteration)

---

## Acceptance Checklist (verify against the render before finishing)

- [ ] Shadows read violet, not grey/black
- [ ] Exactly 2 hard cel bands on the body — no smooth gradients
- [ ] Outline is visible, colored `#241012`, consistent weight
- [ ] Orange rim light clearly visible along the upper/back edge
- [ ] Eyes and tail ember visibly glow (Bloom halo present)
- [ ] Silhouette instantly reads as "wolf puppy" when squinting
- [ ] Transparent background, 512×512, PNG RGBA
- [ ] 8 idle frames loop seamlessly (frame 07 → 00 has no pop)
- [ ] Vibe check: cute creature, spooky lighting

## Do / Don't

- DO structure style_core.py so a second creature script would need zero changes to it
- DO print clear progress and the final output paths to stdout
- DO handle Blender version differences gracefully (target 4.2+, note in README what was tested)
- DON'T use Freestyle for outlines
- DON'T use Cycles (render time; Eevee is the pipeline)
- DON'T add textures/image maps — flat toon color bands only
- DON'T over-model. If the still render takes more than ~10s to render, simplify.

# BondBound — Art Style Bible v1.0
### "Dark Menagerie" — Hades-Inspired Stylized 3D

This document defines the visual language for all BondBound assets. Every creature, enemy, card illustration, and background should be checkable against this document. When in doubt, return here.

---

## 1. Core Style Statement

**One sentence:** Painterly toon-shaded 3D — dark, a little spooky, with vibrant jewel-tone accents that glow out of the shadow.

**Reference anchors (in priority order):**
1. **Hades / Hades II (Supergiant)** — primary reference. Strong silhouettes, saturated rim light, confident dark shadow shapes, colored line art, dramatic accent glow.
2. **Darkest Dungeon** — secondary, for mood only. The oppressive darkness and heavy shadow shapes. Do NOT copy its desaturation or grime; BondBound stays vibrant.
3. **Cult of the Lamb** — tertiary, for the cute-but-sinister creature energy. Our creatures are companions, not horrors — adorable silhouettes wearing a spooky world.

**The tension that defines the style:** Every asset should hold two feelings at once — *warmth* (these creatures are your friends, your bond with them is the heart of the game) and *unease* (the world is corrupted, the Hollow Pulse is watching). Achieve this through cute/appealing shape language rendered with dramatic horror-adjacent lighting.

---

## 2. Color System

### 2.1 World Palette (Backgrounds & Environment)

| Role | Hex | Usage |
|---|---|---|
| Void Black | `#0B0A14` | Deepest background tone. Never pure black. |
| Shadow Violet | `#1A1430` | Primary shadow color across ALL assets. Shadows are violet, never grey or black. |
| Midnight Blue | `#141B33` | Secondary environment tone, cool areas. |
| Corruption Violet | `#6A30B0` | The Hollow Pulse. Reserved — appears ONLY on corrupted/boss/final-act content. Its rarity is what makes it threatening. |

### 2.2 Archetype Accent Palettes

Each archetype owns a jewel-tone family. Accents should occupy roughly 15–25% of a creature's surface area — the rest is mid-and-dark body tones. The accent is what glows.

**🔥 Primal (Fire) — Ember family**
| Role | Hex |
|---|---|
| Core glow | `#FF6B1A` |
| Hot highlight | `#FFC24B` |
| Deep ember | `#C22E0E` |
| Body mid-tone | `#5A2A2E` (warm dark maroon-brown) |

**🌿 Guardian (Earth) — Moss family**
| Role | Hex |
|---|---|
| Core glow | `#3FD97F` |
| Bright highlight | `#A8F0B8` |
| Deep moss | `#1E7A4A` |
| Body mid-tone | `#2E3A32` (dark forest grey-green) |

**⚡ Spirit (Electric) — Arc family**
| Role | Hex |
|---|---|
| Core glow | `#B45BFF` |
| Bright highlight | `#E8CFFF` |
| Deep arc | `#6B2BD9` |
| Body mid-tone | `#2A2440` (dark dusty violet) |

**Catchable creature palettes** (defined when each is produced): Ice `#4FD8FF`, Poison `#9BE022`, Water `#2B7FFF`, Wind `#D8E4EC`, Stone `#E09A3E` — each following the same 4-role structure (glow / highlight / deep / dark body).

### 2.3 Color Rules

1. **Shadows are always violet-shifted**, never neutral grey or black. Mix `#1A1430` into every shadow.
2. **Saturation lives in the light.** Lit areas are saturated; shadowed areas desaturate AND violet-shift. This is the single biggest contributor to the Hades feel.
3. **Glow accents are near-white at their core.** An ember isn't orange all the way through — it's `#FFC24B` at the heart falling off to `#FF6B1A` then `#C22E0E`.
4. **Corruption Violet is quarantined.** No standard creature, card, or Act 1–2 asset uses `#6A30B0`. It belongs to the Hollow Pulse narrative arc exclusively.

---

## 3. Shading & Lighting Model (Blender Implementation)

### 3.1 Toon Shading

- **2–3 band cel shading** via Shader-to-RGB → ColorRamp (Constant interpolation) in Eevee. Bands: lit / core shadow / (optional) deep shadow.
- **Band boundaries are hard** with 1–2% softness maximum. No smooth gradients on body surfaces.
- The shadow band uses the violet-shifted version of the body color (see 2.3.1), not a darkened version.

### 3.2 Outlines

- **Inverted-hull outlines** (Solidify modifier, flipped normals, emission material) — NOT Freestyle (too slow for animation batches, inconsistent line weight).
- Outline color: **very dark version of the body color** (e.g. Kindlpup's outline is `#241012`, not black). Colored line art is a Hades signature.
- Outline thickness: **1.5–2.5% of the creature's bounding-box height.** Thicker on small/cute creatures, thinner on large/menacing ones.

### 3.3 Rim Light — THE signature element

- **Every creature has a strong rim light** from behind/above, colored in the archetype's core glow color at 60–80% intensity.
- Implemented as a Fresnel-driven emission layer in the material (Fresnel IOR ~1.6–2.0, multiplied into an emission node with the glow color).
- The rim should read as if the creature is standing in front of something bright in a dark room. This single element does most of the "dark but vibrant" work.

### 3.4 Emission Accents

- Eyes, elemental features (embers, moss veins, arc lines) are **pure emission materials** with Bloom enabled in Eevee (threshold ~0.9, intensity ~0.05–0.08).
- Eyes always glow. This is a world rule — every living creature in BondBound has softly glowing eyes. It reads spooky on enemies and endearing on companions, from the same technique.

### 3.5 Scene Lighting Rig (standard for all creature renders)

| Light | Type | Color | Purpose |
|---|---|---|---|
| Key | Area, upper-left 45° | Warm white `#FFF4E0`, low intensity | Defines the lit cel band |
| Rim | Area, behind-above | Archetype glow color | The signature edge glow |
| Fill | World ambient | Shadow Violet `#1A1430`, very low | Keeps shadow band violet |

- **Camera:** Orthographic (or 85mm+ long lens), 3/4 front angle, slight low angle (hero shot) for creatures; slight high angle (looming) for enemies/bosses.
- **Background:** Fully transparent (film transparent ON). Composite happens in-engine.

---

## 4. Shape Language

| Archetype | Silhouette Rule |
|---|---|
| Primal | Diagonal, forward-leaning, pointed shapes. Always looks about to lunge. |
| Guardian | Wide base, triangular/mountainous mass. Planted. Immovable. |
| Spirit | Vertical, tapering, partially transparent edges. Barely touching the ground. |
| Enemies | Same archetype rules but *broken symmetry* — something is slightly wrong (a too-long limb, an off-center eye, cracked geometry). The corruption shows in the shapes. |
| Bosses | Enemy rules pushed further, plus scale. Phase 2 forms visibly break/erupt the Phase 1 silhouette. |

**Evolution lineage rule:** Each evolution stage keeps the previous stage's silhouette readable inside it. Direstorm's outline should contain Kindlpup's outline — grown, armored, ignited, but recognizably the same soul. This is the visual expression of the bond system.

---

## 5. Rendering & Delivery Spec

| Property | Value |
|---|---|
| Engine | Blender Eevee (Next), Bloom on |
| Creature render size | 512×512 px, transparent PNG (displayed at ~256 in-game, 2x for crispness) |
| Enemy render size | 384×384 px |
| Boss render size | 768×768 px |
| Idle animation | 8-frame loop @ 8fps: vertical bob (2–3% of height), breathe scale (1–2%), glow-pulse (emission strength ±20% sine) |
| File naming | `{creature}_{stage}_{anim}_{frame:02d}.png`, e.g. `kindlpup_s0_idle_03.png` |
| Output folder | `renders/{creature}/` mirroring the Godot `assets/creatures/{creature}/` structure |

**Pipeline note:** All of this is parameterized headless Python (`blender -b -P script.py -- --args`), same architecture as the Solstice Watch pipeline — a shared `style_core.py` module (materials, lighting rig, camera, render settings) that every creature script imports, so the style is enforced in code, not by hand.

---

## 6. Card Illustration Consistency (CardForge / ComfyUI)

The plan for keeping SD-generated card art on-style:

1. Produce 15–25 approved Blender renders in this style (creatures in poses, elemental effects, environment beats).
2. Train a **style LoRA** on those renders in Kohya_ss (SDXL base to match your existing pipeline).
3. Load the LoRA into CardForge for all card illustration generation. Prompt with the palette hexes and "dark violet shadows, jewel-tone rim light, toon shaded" descriptors.
4. Card illustrations are painterly *scenes*, not sprite reproductions — the creature performing the card's action, cropped dynamically.

Until the LoRA exists, card art stays deferred (P3/P4 per the production brief) — do not generate card art in a mismatched style as a stopgap.

---

## 7. Style Checklist (test every asset against this)

- [ ] Shadows are violet, not grey/black
- [ ] 2–3 hard cel bands, no smooth gradients on body surfaces
- [ ] Colored outline (dark body-color, never pure black)
- [ ] Rim light in archetype glow color is clearly visible
- [ ] Eyes glow
- [ ] Accent/glow area is 15–25% of surface — the asset is mostly dark
- [ ] Silhouette reads instantly at 64px
- [ ] Corruption Violet absent (unless this is Hollow Pulse content)
- [ ] Feels: would a kid want to pet it? Would they also glance over their shoulder afterward?

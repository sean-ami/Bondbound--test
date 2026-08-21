"""
kindlpup.py — BondBound: Kindlpup, a small fire wolf puppy.

Built to the character turnaround (2026-08): lean wolf-pup standing on real
legs with light grey socks, charcoal-grey coat, light chest/belly, brow dots,
protruding muzzle with black nose, amber structured eyes, one upright ear and
one tip-folded ear, spitz tail curling over the back, and flame anklets
ringing each leg above the paw.

Run headless via Blender CLI:
    blender -b -P pipeline/kindlpup.py -- --output renders/kindlpup/ --mode still
or via the pip `bpy` module:
    python3 pipeline/kindlpup.py --output renders/kindlpup/ --mode still
"""

import argparse
import math
import os
import random
import sys

import bpy
from mathutils import Euler, Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import style_core as sc

# ── Palette (turnaround reference: grey-charcoal coat, light grey-tan
#    chest/socks/muzzle, amber eyes, orange flame anklets) ────────────────────

BODY_LIT     = "#3A383C"   # dark neutral-grey coat
BODY_SHADOW  = "#221C28"   # near-black, violet-shifted
MARKING_LIT  = "#A89A8C"   # light grey-tan chest / belly / socks / chin / brows
INNER_EAR    = "#8E6E72"   # muted pink-grey inner ear
OUTLINE      = "#16121A"
GLOW         = "#FF6B1A"   # rim light + rim emission
EYE_COLOR    = "#FFA226"   # amber iris
EYE_STRENGTH = 3.0         # soft glow, not a lamp — structure carries the eye
CATCHLIGHT   = "#FFEFC0"   # near-white sparkle
FLAME_COLOR  = "#FFC24B"
FLAME_STRENGTH = 8.0


# ── Construction helpers ─────────────────────────────────────────────────────

HEAD_CENTER = Vector((0.0, -0.10, 0.74))

def _head_tilted(p: Vector, tilt: float) -> Vector:
    """Rotate a point around the head center about the Y (front) axis —
    the slight curious-puppy head tilt (hero shots only, kept subtle)."""
    rot = Matrix.Rotation(tilt, 4, "Y")
    return HEAD_CENTER + rot @ (Vector(p) - HEAD_CENTER)


def _link(obj: bpy.types.Object) -> bpy.types.Object:
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _sphere(name, location, radius, scale=(1, 1, 1)) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24, ring_count=16, radius=radius, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.shade_smooth()
    return obj


def _mball_to_mesh(mb_obj, name):
    bpy.ops.object.select_all(action="DESELECT")
    mb_obj.select_set(True)
    bpy.context.view_layer.objects.active = mb_obj
    bpy.ops.object.convert(target="MESH")
    mesh = bpy.context.active_object
    mesh.name = name
    return mesh


# Leg anchor points (x, y): front pair then hind pair
LEGS = [(0.13, -0.13), (-0.13, -0.13), (0.14, 0.24), (-0.14, 0.24)]


def build_kindlpup(seed: int = 7) -> dict:
    """Procedural Kindlpup per the character turnaround. Returns root empty,
    body mesh, and glow materials."""
    rng = random.Random(seed)
    head_tilt = math.radians(5.0 + rng.uniform(-2.0, 2.0))
    ear_jitter = math.radians(rng.uniform(-4.0, 4.0))
    print(f"[kindlpup] seed {seed}: head tilt {math.degrees(head_tilt):.1f}°, "
          f"ear jitter {math.degrees(ear_jitter):.1f}°")

    # Materials
    # Low rim strength keeps the coat dark (fire lives at the anklets/eyes)
    body_mat = sc.make_toon_material("KindlpupBody", BODY_LIT, BODY_SHADOW,
                                     OUTLINE, GLOW, rim_strength=0.5)
    marking_mat = sc.make_toon_material(
        "KindlpupMarking", MARKING_LIT,
        sc.violet_shift(sc.hex_to_rgba(MARKING_LIT)), OUTLINE, GLOW,
        rim_strength=0.5)
    inner_mat = sc.make_toon_material(
        "KindlpupInnerEar", INNER_EAR,
        sc.violet_shift(sc.hex_to_rgba(INNER_EAR)), OUTLINE, GLOW)
    nose_mat = sc.make_toon_material("KindlpupNose", "#1E1418", "#120C12",
                                     OUTLINE, GLOW, rim_strength=0.6)
    eye_mat = sc.make_glow_material("KindlpupEyes", EYE_COLOR, EYE_STRENGTH)
    catch_mat = sc.make_glow_material("KindlpupCatchlight", CATCHLIGHT, 5.0)
    flame_mat = sc.make_glow_material("KindlpupFlame", FLAME_COLOR, FLAME_STRENGTH)

    # ── Dark coat mass (metaballs; front = -Y, ground = z 0) ─────────────────
    mb_dark = bpy.data.metaballs.new("KindlpupDarkMB")
    mb_dark.resolution = 0.045
    dark_obj = _link(bpy.data.objects.new("KindlpupDarkMB", mb_dark))

    def dark(co, r, tilt_head=False):
        el = mb_dark.elements.new()
        el.co = _head_tilted(co, head_tilt) if tilt_head else Vector(co)
        el.radius = r

    # Torso standing at leg height, fluffy chest ruff, slimmer rump
    dark((0.00,  0.10, 0.42), 0.20)            # torso
    dark((0.00,  0.22, 0.44), 0.18)            # rump
    dark((0.00, -0.10, 0.46), 0.20)            # chest ruff
    dark((0.13, -0.08, 0.44), 0.12)            # ruff side R
    dark((-0.13, -0.08, 0.44), 0.12)           # ruff side L
    dark((0.00, -0.08, 0.58), 0.16, True)      # neck
    # Wolf-pup head with a real protruding muzzle
    dark((0.00, -0.10, 0.74), 0.22, True)      # head
    dark((0.14, -0.10, 0.68), 0.10, True)      # cheek R
    dark((-0.14, -0.10, 0.68), 0.10, True)     # cheek L
    dark((0.00, -0.16, 0.80), 0.12, True)      # forehead crown
    dark((0.00, -0.28, 0.70), 0.095, True)     # muzzle base
    dark((0.00, -0.36, 0.67), 0.070, True)     # muzzle tip (slight droop)
    # Upper legs (dark, down past the knee — light socks take over below,
    # interpenetrating so the leg reads as one continuous limb)
    for fx, fy in LEGS:
        dark((fx * 0.92, fy * 0.92, 0.40), 0.100)   # shoulder/hip blend
        dark((fx, fy, 0.32), 0.090)                 # upper leg
        dark((fx, fy, 0.25), 0.075)                 # knee
    # Spitz tail: thick fluffy curl hugging the back, tip pointing forward
    dark((0.00, 0.30, 0.48), 0.110)
    dark((0.02, 0.34, 0.60), 0.100)
    dark((0.04, 0.28, 0.68), 0.090)
    dark((0.05, 0.19, 0.68), 0.080)
    dark((0.06, 0.13, 0.62), 0.065)

    body = _mball_to_mesh(dark_obj, "KindlpupBodyMesh")

    # ── Ears: one fully upright (far side), one with a folded tip (camera
    #    side, +X) — joined into the body for a single outline shell ─────────
    ear_objs = []

    up_loc = _head_tilted((-0.145, -0.05, 0.94), head_tilt)
    bpy.ops.mesh.primitive_cone_add(
        vertices=16, radius1=0.10, radius2=0.012, depth=0.30, location=up_loc)
    ear_up = bpy.context.active_object
    ear_up.name = "KindlpupEarUp"
    ear_up.rotation_euler = Euler(
        (math.radians(-6), math.radians(-10) - ear_jitter + head_tilt, 0.0))
    bpy.ops.object.shade_smooth()
    ear_objs.append(ear_up)

    tip_loc = _head_tilted((0.15, -0.05, 0.90), head_tilt)
    bpy.ops.mesh.primitive_cone_add(
        vertices=16, radius1=0.10, radius2=0.030, depth=0.22, location=tip_loc)
    ear_tip = bpy.context.active_object
    ear_tip.name = "KindlpupEarTipped"
    ear_tip.rotation_euler = Euler(
        (math.radians(-6), math.radians(10) + ear_jitter + head_tilt, 0.0))
    bpy.ops.object.shade_smooth()
    ear_objs.append(ear_tip)

    fold_loc = _head_tilted((0.17, -0.05, 0.975), head_tilt)
    bpy.ops.mesh.primitive_cone_add(
        vertices=12, radius1=0.06, radius2=0.012, depth=0.09, location=fold_loc)
    ear_fold = bpy.context.active_object
    ear_fold.name = "KindlpupEarFold"
    ear_fold.rotation_euler = Euler(
        (math.radians(4), math.radians(125) + ear_jitter + head_tilt, 0.0))
    bpy.ops.object.shade_smooth()
    ear_objs.append(ear_fold)

    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    for e in ear_objs:
        e.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()

    subsurf = body.modifiers.new("Round", "SUBSURF")
    subsurf.levels = 1
    subsurf.render_levels = 1
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    except AttributeError:
        bpy.ops.object.shade_smooth()

    body.data.materials.append(body_mat)
    sc.add_outline(body, OUTLINE, thickness_pct=0.018)

    # ── Light grey-tan mass: chest/belly, chin, socks + paws, tail tip ───────
    mb_light = bpy.data.metaballs.new("KindlpupLightMB")
    mb_light.resolution = 0.04
    light_obj = _link(bpy.data.objects.new("KindlpupLightMB", mb_light))

    def light(co, r, tilt_head=False):
        el = mb_light.elements.new()
        el.co = _head_tilted(co, head_tilt) if tilt_head else Vector(co)
        el.radius = r

    light((0.00, -0.22, 0.40), 0.130)          # chest patch
    light((0.00, -0.14, 0.28), 0.100)          # lower chest
    light((0.00,  0.02, 0.26), 0.090)          # belly
    light((0.00, -0.345, 0.635), 0.045, True)  # chin / muzzle underside
    for fx, fy in LEGS:                        # socks: knee -> paw, continuous
        light((fx, fy, 0.26), 0.060)           # overlaps the dark knee
        light((fx, fy, 0.19), 0.066)
        light((fx, fy, 0.12), 0.062)
        light((fx, fy - (0.012 if fy < 0 else -0.012), 0.065), 0.080)  # paw
    light((0.065, 0.11, 0.58), 0.050)          # tail tip

    light_mesh = _mball_to_mesh(light_obj, "KindlpupLightMesh")
    light_sub = light_mesh.modifiers.new("Round", "SUBSURF")
    light_sub.levels = 1
    light_sub.render_levels = 1
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    except AttributeError:
        bpy.ops.object.shade_smooth()
    light_mesh.data.materials.append(marking_mat)
    sc.add_outline(light_mesh, OUTLINE, thickness_pct=0.015)

    # ── Face details ─────────────────────────────────────────────────────────
    accent_objs = [light_mesh]

    # Inner ear on the upright ear
    loc = _head_tilted((-0.145, -0.105, 0.93), head_tilt)
    bpy.ops.mesh.primitive_cone_add(
        vertices=12, radius1=0.055, radius2=0.009, depth=0.16, location=loc)
    inner = bpy.context.active_object
    inner.name = "KindlpupInnerEar"
    inner.rotation_euler = Euler(
        (math.radians(-8), math.radians(-10) - ear_jitter + head_tilt, 0.0))
    bpy.ops.object.shade_smooth()
    inner.data.materials.append(inner_mat)
    accent_objs.append(inner)

    # Brow dots (light, mostly flush with the forehead)
    for sx in (1, -1):
        brow = _sphere(f"KindlpupBrow{'R' if sx > 0 else 'L'}",
                       _head_tilted((sx * 0.085, -0.275, 0.825), head_tilt),
                       0.024)
        brow.data.materials.append(marking_mat)
        accent_objs.append(brow)

    # Black nose on the muzzle tip
    nose = _sphere("KindlpupNose",
                   _head_tilted((0.0, -0.425, 0.665), head_tilt), 0.035,
                   (1.2, 0.7, 0.8))
    nose.data.materials.append(nose_mat)
    accent_objs.append(nose)

    # Structured puppy eyes: dark rim -> amber iris (soft glow) -> dark pupil
    # -> near-white catchlight (upper-outer on the iris)
    glow_objs = []
    for sx in (1, -1):
        side = "R" if sx > 0 else "L"
        # Buried in the head surface so only a lens-cap shows — embedded
        # almond read, not googly stalks
        pos = Vector((sx * 0.088, -0.235, 0.76))

        rim = _sphere(f"KindlpupEyeRim{side}", _head_tilted(pos, head_tilt), 0.046)
        rim.data.materials.append(nose_mat)
        accent_objs.append(rim)

        iris = _sphere(f"KindlpupIris{side}",
                       _head_tilted(pos + Vector((0, -0.016, 0)), head_tilt), 0.040)
        iris.data.materials.append(eye_mat)
        glow_objs.append(iris)

        pupil = _sphere(f"KindlpupPupil{side}",
                        _head_tilted(pos + Vector((0, -0.048, -0.003)), head_tilt),
                        0.014)
        pupil.data.materials.append(nose_mat)
        accent_objs.append(pupil)

        catch = _sphere(
            f"KindlpupCatch{side}",
            _head_tilted(pos + Vector((sx * -0.011, -0.042, 0.013)), head_tilt),
            0.008)
        catch.data.materials.append(catch_mat)
        accent_objs.append(catch)

    # ── Flame anklets: a fire ring above each paw + small licks ──────────────
    for i, (fx, fy) in enumerate(LEGS):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.062, minor_radius=0.012, location=(fx, fy, 0.15),
            major_segments=20, minor_segments=8)
        ring = bpy.context.active_object
        ring.name = f"KindlpupAnklet{i}"
        bpy.ops.object.shade_smooth()
        ring.data.materials.append(flame_mat)
        glow_objs.append(ring)

        for j in range(2):
            ang = j * 2.8 + i * 1.1
            lx = fx + 0.062 * math.cos(ang)
            ly = fy + 0.062 * math.sin(ang)
            bpy.ops.mesh.primitive_cone_add(
                vertices=8, radius1=0.014, radius2=0.003, depth=0.055,
                location=(lx, ly, 0.18 + rng.uniform(0.0, 0.012)))
            lick = bpy.context.active_object
            lick.name = f"KindlpupAnkletLick{i}{j}"
            lick.rotation_euler = Euler((rng.uniform(-0.2, 0.2),
                                         rng.uniform(-0.2, 0.2), 0.0))
            bpy.ops.object.shade_smooth()
            lick.data.materials.append(flame_mat)
            glow_objs.append(lick)

    # ── Root: neutral standing pose (matches the turnaround) ─────────────────
    root = _link(bpy.data.objects.new("KindlpupRoot", None))
    for obj in [body] + accent_objs + glow_objs:
        obj.parent = root
    bpy.context.view_layer.update()

    print("[kindlpup] build complete")
    return {
        "root": root,
        "body": body,
        "glow_materials": [eye_mat, flame_mat],
    }


# ── Entry point ──────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    # Blender CLI passes script args after "--"; plain python passes them directly
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser(description="Render Kindlpup (BondBound)")
    parser.add_argument("--output", default="renders/kindlpup/", help="output directory")
    parser.add_argument("--mode", choices=["still", "idle", "back", "overworld", "all"],
                        default="still")
    parser.add_argument("--resolution", type=int, default=512)
    parser.add_argument("--seed", type=int, default=7,
                        help="drives small variation in ear/head tilt")
    return parser.parse_args(argv)


def main() -> None:
    args = parse_args()
    out_dir = os.path.abspath(args.output)
    os.makedirs(out_dir, exist_ok=True)
    print(f"[kindlpup] Blender {bpy.app.version_string} | mode={args.mode} "
          f"| res={args.resolution} | seed={args.seed}")
    print(f"[kindlpup] output dir: {out_dir}")

    sc.reset_scene()
    parts = build_kindlpup(seed=args.seed)
    root = parts["root"]

    sc.setup_lighting(GLOW)
    sc.setup_render(os.path.join(out_dir, "kindlpup_s0_still.png"),
                    resolution=args.resolution)

    outputs = []
    mode = args.mode

    # Battle front (3/4-front hero shot)
    if mode in ("still", "all"):
        sc.setup_camera(root, mode="hero")
        outputs.append(sc.render_still(os.path.join(out_dir, "kindlpup_s0_still.png")))

    # Battle back (3/4 from behind, as seen over the player's shoulder)
    if mode in ("back", "all"):
        sc.setup_camera(root, mode="hero", azimuth_deg=215.0)
        outputs.append(sc.render_still(os.path.join(out_dir, "kindlpup_s0_back.png")))

    # Overworld: 4 directions x 3 hop frames from a top-down-ish angle
    if mode in ("overworld", "all"):
        directions = {"down": 0.0, "left": -90.0, "right": 90.0, "up": 180.0}
        height = sc.bbox_height(root)
        base_z = root.location.z
        base_yaw = root.rotation_euler.z

        # One shared ortho scale so every direction renders at the same size
        shared_scale = 0.0
        for az in directions.values():
            cam = sc.setup_camera(root, azimuth_deg=az, elevation_deg=25.0)
            shared_scale = max(shared_scale, cam.data.ortho_scale)

        for dname, az in directions.items():
            cam = sc.setup_camera(root, azimuth_deg=az, elevation_deg=25.0)
            cam.data.ortho_scale = shared_scale
            for f in range(3):
                # Classic 3-frame walk: neutral / hop-left / hop-right
                root.location.z = base_z + (0.02 * height if f > 0 else 0.0)
                root.rotation_euler.z = base_yaw + math.radians(
                    0.0 if f == 0 else (4.0 if f == 1 else -4.0))
                bpy.context.view_layer.update()
                outputs.append(sc.render_still(os.path.join(
                    out_dir, f"kindlpup_s0_ow{dname}_{f:02d}.png")))

        root.location.z = base_z
        root.rotation_euler.z = base_yaw

    # Idle loop last (it keyframes the root, so stills must come first)
    if mode in ("idle", "all"):
        sc.setup_camera(root, mode="hero")
        sc.animate_idle(root, parts["glow_materials"], frames=8)
        outputs.extend(sc.render_frames(
            out_dir, "kindlpup_s0_idle_{frame:02d}.png", frames=8))

    print(f"[kindlpup] DONE — {len(outputs)} files:")
    for p in outputs:
        print(f"  {p}")


if __name__ == "__main__":
    main()

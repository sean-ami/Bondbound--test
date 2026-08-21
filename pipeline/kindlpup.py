"""
kindlpup.py — BondBound style test: Kindlpup, a small fire wolf puppy.

Builds the creature procedurally (metaballs + primitives), applies the
Dark Menagerie style from style_core, and renders a hero still and/or an
8-frame idle loop.

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

# ── Palette (Primal/Ember family, dark-first per art-direction reference:
#    charcoal body, grey-tan markings, rust inner ear, amber eyes,
#    flame-wreathed paws and tail) ─────────────────────────────────────────────

BODY_LIT     = "#3A2C2C"   # charcoal with a warm tint
BODY_SHADOW  = "#1E1622"   # near-black, violet-shifted
MARKING_LIT  = "#96826E"   # grey-tan muzzle / brows / chest / toes
INNER_EAR    = "#C2542E"   # rust inner ear
OUTLINE      = "#140A0E"
GLOW         = "#FF6B1A"   # rim light + rim emission
EYE_COLOR    = "#FFA226"   # amber
EYE_STRENGTH = 6.0
FLAME_COLOR  = "#FFC24B"
FLAME_STRENGTH = 8.0


# ── Construction helpers ─────────────────────────────────────────────────────

HEAD_CENTER = Vector((0.0, -0.16, 0.66))

def _head_tilted(p: Vector, tilt: float) -> Vector:
    """Rotate a point around the head center about the Y (front) axis —
    the ~10° curious-puppy head tilt."""
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


def build_kindlpup(seed: int = 7) -> dict:
    """Procedural Kindlpup. Returns root empty, body mesh, and glow materials."""
    rng = random.Random(seed)
    head_tilt = math.radians(10.0 + rng.uniform(-3.0, 3.0))
    ear_jitter = math.radians(rng.uniform(-5.0, 5.0))
    print(f"[kindlpup] seed {seed}: head tilt {math.degrees(head_tilt):.1f}°, "
          f"ear jitter {math.degrees(ear_jitter):.1f}°")

    scene = bpy.context.scene

    # Materials
    body_mat = sc.make_toon_material("KindlpupBody", BODY_LIT, BODY_SHADOW, OUTLINE, GLOW)
    marking_mat = sc.make_toon_material(
        "KindlpupMarking", MARKING_LIT,
        sc.violet_shift(sc.hex_to_rgba(MARKING_LIT)), OUTLINE, GLOW)
    inner_mat = sc.make_toon_material(
        "KindlpupInnerEar", INNER_EAR,
        sc.violet_shift(sc.hex_to_rgba(INNER_EAR)), OUTLINE, GLOW)
    eye_mat = sc.make_glow_material("KindlpupEyes", EYE_COLOR, EYE_STRENGTH)
    flame_mat = sc.make_glow_material("KindlpupFlame", FLAME_COLOR, FLAME_STRENGTH)

    # ── Body mass: metaballs for organic blob-blending (front = -Y) ──────────
    mb_data = bpy.data.metaballs.new("KindlpupMB")
    mb_data.resolution = 0.045
    mb_obj = _link(bpy.data.objects.new("KindlpupMB", mb_data))

    def ball(co, r, tilt_head=False):
        el = mb_data.elements.new()
        el.co = _head_tilted(co, head_tilt) if tilt_head else Vector(co)
        el.radius = r

    # Round body, big head (~40% of mass), short muzzle, chest fluff mass.
    # Metaball iso-surfaces sit at ~75% of element radius, so neighbouring
    # elements overlap generously to blend into one connected mass.
    ball((0.00,  0.05, 0.36), 0.30)            # body core
    ball((0.00,  0.18, 0.38), 0.24)            # rump
    ball((0.00, -0.08, 0.34), 0.24)            # chest
    ball((0.00, -0.20, 0.44), 0.14)            # chest fluff mass
    ball((0.00, -0.12, 0.52), 0.18, True)      # neck (bridges body -> head)
    ball((0.00, -0.16, 0.70), 0.28, True)      # head (big!)
    ball((0.00, -0.36, 0.62), 0.12, True)      # short muzzle
    ball((0.10, -0.28, 0.64), 0.10, True)      # cheek R
    ball((-0.10, -0.28, 0.64), 0.10, True)     # cheek L
    # Stubby legs + oversized paws (cute-factor anchor)
    for sx in (1, -1):
        ball((sx * 0.13, -0.12, 0.18), 0.095)  # front leg
        ball((sx * 0.13, -0.15, 0.09), 0.115)  # front paw (oversized)
        ball((sx * 0.14,  0.18, 0.18), 0.095)  # hind leg
        ball((sx * 0.14,  0.20, 0.09), 0.105)  # hind paw
    # Bushy tail curling upward (chained overlap so it reads as one curl)
    ball((0.00, 0.33, 0.42), 0.115)
    ball((0.00, 0.40, 0.52), 0.100)
    ball((0.00, 0.43, 0.63), 0.090)
    ball((0.00, 0.40, 0.73), 0.075)

    # Convert metaballs -> mesh
    bpy.ops.object.select_all(action="DESELECT")
    mb_obj.select_set(True)
    bpy.context.view_layer.objects.active = mb_obj
    bpy.ops.object.convert(target="MESH")
    body = bpy.context.active_object
    body.name = "KindlpupBodyMesh"

    # ── Ears: large pointed cones, slightly too big for the head ─────────────
    # Asymmetric ears (reference: one upright pointed ear, one floppy)
    ear_objs = []

    up_loc = _head_tilted((0.14, -0.13, 0.96), head_tilt)
    bpy.ops.mesh.primitive_cone_add(
        vertices=16, radius1=0.095, radius2=0.012, depth=0.32, location=up_loc)
    ear_up = bpy.context.active_object
    ear_up.name = "KindlpupEarUp"
    ear_up.rotation_euler = Euler(
        (math.radians(-8), math.radians(12) + ear_jitter + head_tilt, 0.0))
    bpy.ops.object.shade_smooth()
    ear_objs.append(ear_up)

    flop_loc = _head_tilted((-0.20, -0.12, 0.82), head_tilt)
    bpy.ops.mesh.primitive_cone_add(
        vertices=16, radius1=0.085, radius2=0.015, depth=0.28, location=flop_loc)
    ear_flop = bpy.context.active_object
    ear_flop.name = "KindlpupEarFlop"
    ear_flop.rotation_euler = Euler(
        (math.radians(10), math.radians(-105) + ear_jitter + head_tilt, 0.0))
    bpy.ops.object.shade_smooth()
    ear_objs.append(ear_flop)

    # Join ears into the body so one outline shell covers the silhouette
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    for e in ear_objs:
        e.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()

    # Organic rounding + smooth normals
    subsurf = body.modifiers.new("Round", "SUBSURF")
    subsurf.levels = 1
    subsurf.render_levels = 1
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    except AttributeError:
        bpy.ops.object.shade_smooth()

    body.data.materials.append(body_mat)
    sc.add_outline(body, OUTLINE, thickness_pct=0.02)

    # ── Overlays: rust inner ear + grey-tan markings ─────────────────────────
    accent_objs = []

    # Inner ear on the upright ear only
    loc = _head_tilted((0.14, -0.185, 0.945), head_tilt)
    bpy.ops.mesh.primitive_cone_add(
        vertices=12, radius1=0.050, radius2=0.008, depth=0.18, location=loc)
    inner = bpy.context.active_object
    inner.name = "KindlpupInnerEar"
    inner.rotation_euler = Euler(
        (math.radians(-10), math.radians(12) + ear_jitter + head_tilt, 0.0))
    bpy.ops.object.shade_smooth()
    inner.data.materials.append(inner_mat)
    accent_objs.append(inner)

    # Grey-tan markings: chest, muzzle patch, brow dots, toe caps
    marking_objs = []
    marking_objs.append(_sphere(
        "KindlpupChestFluff", (0.0, -0.265, 0.42), 0.105, (1.0, 0.6, 1.1)))
    marking_objs.append(_sphere(
        "KindlpupMuzzlePatch",
        _head_tilted((0.0, -0.43, 0.62), head_tilt), 0.075, (1.0, 0.45, 0.85)))
    for sx in (1, -1):
        marking_objs.append(_sphere(
            f"KindlpupBrow{'R' if sx > 0 else 'L'}",
            _head_tilted((sx * 0.075, -0.36, 0.79), head_tilt), 0.026))
        marking_objs.append(_sphere(
            f"KindlpupToes{'R' if sx > 0 else 'L'}",
            (sx * 0.13, -0.25, 0.09), 0.05, (1.0, 0.55, 0.85)))
    for obj in marking_objs:
        obj.data.materials.append(marking_mat)
    accent_objs.extend(marking_objs)

    # ── Glow parts: big round eyes, ear embers, tail-tip ember ───────────────
    glow_objs = []
    for sx in (1, -1):
        eye = _sphere(f"KindlpupEye{'R' if sx > 0 else 'L'}",
                      _head_tilted((sx * 0.075, -0.35, 0.72), head_tilt), 0.045)
        eye.data.materials.append(eye_mat)
        glow_objs.append(eye)

    def flame(name, x, y, z, r, depth):
        bpy.ops.mesh.primitive_cone_add(
            vertices=8, radius1=r, radius2=0.004, depth=depth, location=(x, y, z))
        fl = bpy.context.active_object
        fl.name = name
        fl.rotation_euler = Euler((rng.uniform(-0.25, 0.25),
                                   rng.uniform(-0.25, 0.25), 0.0))
        bpy.ops.object.shade_smooth()
        fl.data.materials.append(flame_mat)
        glow_objs.append(fl)

    # Flame wreaths around each paw (reference: paws alight)
    paw_spots = [(0.13, -0.15), (-0.13, -0.15), (0.14, 0.20), (-0.14, 0.20)]
    for i, (px, py) in enumerate(paw_spots):
        for j in range(3):
            ang = j * 2.1 + i
            fx = px + 0.085 * math.cos(ang)
            fy = py + 0.085 * math.sin(ang)
            flame(f"KindlpupPawFlame{i}{j}", fx, fy,
                  0.10 + rng.uniform(0.0, 0.02), 0.024, 0.10)

    # Tail tip burning
    flame("KindlpupTailFlameA", 0.00, 0.41, 0.80, 0.045, 0.16)
    flame("KindlpupTailFlameB", 0.03, 0.37, 0.78, 0.028, 0.10)
    flame("KindlpupTailFlameC", -0.03, 0.43, 0.76, 0.025, 0.09)

    # ── Root: parent everything; lean forward onto the front paws ────────────
    root = _link(bpy.data.objects.new("KindlpupRoot", None))
    for obj in [body] + accent_objs + glow_objs:
        obj.parent = root
    root.rotation_euler = Euler((math.radians(6), 0.0, 0.0))  # about to pounce
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
    parser = argparse.ArgumentParser(description="Render Kindlpup (BondBound style test)")
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

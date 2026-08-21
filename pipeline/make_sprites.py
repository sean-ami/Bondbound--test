"""
make_sprites.py — one-command sprite sheet generation for a creature.

Runs the creature's Blender render script (all views/animations), then
pixelates everything into Godot-ready sprite sheets under
assets/sprites/{creature}/:

  {creature}_s0_battle_front.png        64x64 battle sprite (front)
  {creature}_s0_battle_back.png         64x64 battle sprite (back)
  {creature}_s0_idle_sheet.png          8 x 64x64 idle loop (1 row)
  {creature}_s0_overworld_sheet.png     3 x 32x32 walk frames x 4 rows
                                        (row order: down, left, right, up)

Usage:
  python3 pipeline/make_sprites.py                 # kindlpup, render + pixelate
  python3 pipeline/make_sprites.py --skip-render   # reuse existing renders
"""

import argparse
import os
import subprocess
import sys

PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(PIPELINE_DIR)
sys.path.insert(0, PIPELINE_DIR)
import pixelate  # noqa: E402

# Per-creature sprite palettes (GBA-style, derived from the style bible
# archetype families). Order does not matter — nearest-color snapping.
CREATURES = {
    "kindlpup": {
        "script": "kindlpup.py",
        "palette": [
            "#140A0E",  # outline
            "#1E1622",  # shadow band (near-black, violet-shifted)
            "#3A2C2C",  # charcoal body lit band
            "#5C4038",  # rim-warmed charcoal
            "#96826E",  # grey-tan markings
            "#C2542E",  # rust inner ear / deep flame
            "#FF6B1A",  # core glow
            "#FFC24B",  # hot flame highlight
            "#FFEFC0",  # near-white glow core
        ],
        "outline": "#140A0E",
    },
}

OW_DIRECTIONS = ["down", "left", "right", "up"]


def main() -> None:
    ap = argparse.ArgumentParser(description="Render + pixelate a creature's sprites")
    ap.add_argument("--creature", default="kindlpup", choices=sorted(CREATURES))
    ap.add_argument("--skip-render", action="store_true",
                    help="reuse renders already on disk")
    ap.add_argument("--battle-size", type=int, default=64)
    ap.add_argument("--overworld-size", type=int, default=32)
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    cfg = CREATURES[args.creature]
    render_dir = os.path.join(PROJECT_ROOT, "renders", args.creature)
    sprite_dir = os.path.join(PROJECT_ROOT, "assets", "sprites", args.creature)
    os.makedirs(sprite_dir, exist_ok=True)

    if not args.skip_render:
        cmd = [sys.executable, os.path.join(PIPELINE_DIR, cfg["script"]),
               "--output", render_dir, "--mode", "all", "--seed", str(args.seed)]
        print(f"[make_sprites] rendering: {' '.join(cmd)}")
        subprocess.run(cmd, check=True, cwd=PROJECT_ROOT)

    name = args.creature
    pal, outline = cfg["palette"], cfg["outline"]

    # Battle set: front still + 8 idle frames + back, processed together so
    # they share one anchor box and one palette.
    battle_paths = (
        [os.path.join(render_dir, f"{name}_s0_still.png")]
        + [os.path.join(render_dir, f"{name}_s0_idle_{i:02d}.png") for i in range(8)]
        + [os.path.join(render_dir, f"{name}_s0_back.png")]
    )
    battle = pixelate.process_set(battle_paths, args.battle_size, pal,
                                  outline_hex=outline)
    front, idle_frames, back = battle[0], battle[1:9], battle[9]

    front.save(os.path.join(sprite_dir, f"{name}_s0_battle_front.png"))
    back.save(os.path.join(sprite_dir, f"{name}_s0_battle_back.png"))
    pixelate.pack_sheet(idle_frames, cols=8).save(
        os.path.join(sprite_dir, f"{name}_s0_idle_sheet.png"))

    # Overworld set: 4 directions x 3 walk frames, one sheet row per direction
    ow_paths = [os.path.join(render_dir, f"{name}_s0_ow{d}_{f:02d}.png")
                for d in OW_DIRECTIONS for f in range(3)]
    ow = pixelate.process_set(ow_paths, args.overworld_size, pal,
                              outline_hex=outline)
    pixelate.pack_sheet(ow, cols=3).save(
        os.path.join(sprite_dir, f"{name}_s0_overworld_sheet.png"))

    print(f"[make_sprites] DONE — sprites in {sprite_dir}:")
    for f in sorted(os.listdir(sprite_dir)):
        print(f"  {f}")


if __name__ == "__main__":
    main()

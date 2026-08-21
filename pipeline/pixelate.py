"""
pixelate.py — convert 3D renders into GBA-style pixel sprites.

Pre-rendered 2.5D workflow: the Blender pipeline outputs 512px transparent
renders; this module downscales them to sprite size, snaps colors to a fixed
per-creature palette (crisp cel bands, no adaptive-quantize mud), hardens the
alpha, reinforces the outline, and packs sprite sheets.

Frame sets are processed together: one union bounding box (stable anchor —
animation bob survives) and one shared palette across every frame.

Plain Python + Pillow; independent of Blender so it also runs against renders
produced on another machine.
"""

import argparse
import glob
import math
import os

from PIL import Image


def hex_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ── Frame preparation ────────────────────────────────────────────────────────

def _union_bbox(imgs: list) -> tuple:
    boxes = [im.getbbox() for im in imgs if im.getbbox()]
    return (min(b[0] for b in boxes), min(b[1] for b in boxes),
            max(b[2] for b in boxes), max(b[3] for b in boxes))


def prep_set(paths: list, size: int, alpha_thresh: int = 96,
             margin: float = 0.04) -> list:
    """Load a frame set, crop all frames to their shared content bbox
    (consistent anchor/scale), pad square, downscale to `size`, harden alpha."""
    imgs = [Image.open(p).convert("RGBA") for p in paths]
    l, t, r, b = _union_bbox(imgs)
    w, h = r - l, b - t
    side = max(w, h)
    pad = int(side * margin)
    side += 2 * pad

    out = []
    for im in imgs:
        crop = im.crop((l, t, r, b))
        sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        sq.paste(crop, (pad + (side - 2 * pad - w) // 2,
                        pad + (side - 2 * pad - h) // 2))
        small = sq.resize((size, size), Image.BOX)
        a = small.getchannel("A").point(lambda v: 255 if v >= alpha_thresh else 0)
        small.putalpha(a)
        out.append(small)
    return out


# ── Palette snapping ─────────────────────────────────────────────────────────

def snap_palette(img: Image.Image, palette: list) -> Image.Image:
    """Snap every opaque pixel to its nearest palette color (no dithering) —
    this is what produces hard, GBA-style color bands."""
    px = img.load()
    w, h = img.size
    cache = {}
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                px[x, y] = (0, 0, 0, 0)
                continue
            key = (r, g, b)
            best = cache.get(key)
            if best is None:
                best = min(palette, key=lambda c: (c[0] - r) ** 2
                           + (c[1] - g) ** 2 + (c[2] - b) ** 2)
                cache[key] = best
            px[x, y] = (*best, 255)
    return img


def quantize_set(imgs: list, colors: int) -> list:
    """Fallback when no fixed palette is given: adaptive quantize with one
    shared palette across the whole frame set."""
    size = imgs[0].size[0]
    strip = Image.new("RGB", (size * len(imgs), size), (255, 0, 255))
    for i, f in enumerate(imgs):
        strip.paste(f.convert("RGB"), (i * size, 0), f.getchannel("A"))
    pal = strip.quantize(colors=colors, method=Image.MAXCOVERAGE, dither=Image.NONE)
    out = []
    for i, f in enumerate(imgs):
        region = pal.crop((i * size, 0, (i + 1) * size, size)).convert("RGB")
        out.append(Image.merge("RGBA", (*region.split(), f.getchannel("A"))))
    return out


# ── Outline reinforcement ────────────────────────────────────────────────────

def outline_pass(img: Image.Image, outline_rgb: tuple) -> Image.Image:
    """Force every silhouette-edge pixel to the outline color so the sprite
    keeps a continuous colored contour after downscaling."""
    px = img.load()
    w, h = img.size
    edges = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if nx < 0 or ny < 0 or nx >= w or ny >= h or px[nx, ny][3] == 0:
                    edges.append((x, y))
                    break
    for x, y in edges:
        px[x, y] = (*outline_rgb, 255)
    return img


# ── Public API ───────────────────────────────────────────────────────────────

def process_set(paths: list, size: int, palette_hexes: list = None,
                colors: int = 15, outline_hex: str = "#241012") -> list:
    """Full pipeline for one coherent frame set -> list of RGBA sprites."""
    imgs = prep_set(paths, size)
    if palette_hexes:
        pal = [hex_rgb(h) for h in palette_hexes]
        imgs = [snap_palette(im, pal) for im in imgs]
    else:
        imgs = quantize_set(imgs, colors)
    outline = hex_rgb(outline_hex)
    return [outline_pass(im, outline) for im in imgs]


def pack_sheet(images: list, cols: int) -> Image.Image:
    """Pack equally-sized sprites into a sheet, row-major, `cols` per row."""
    size = images[0].size[0]
    rows = math.ceil(len(images) / cols)
    sheet = Image.new("RGBA", (size * cols, size * rows), (0, 0, 0, 0))
    for i, im in enumerate(images):
        sheet.paste(im, ((i % cols) * size, (i // cols) * size))
    return sheet


def upscale(img: Image.Image, factor: int = 4) -> Image.Image:
    return img.resize((img.size[0] * factor, img.size[1] * factor), Image.NEAREST)


# ── CLI ──────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(description="3D renders -> pixel sprite sheet")
    ap.add_argument("--input", required=True,
                    help="glob of source renders (processed as one frame set)")
    ap.add_argument("--out", required=True, help="output sheet PNG path")
    ap.add_argument("--size", type=int, default=64, help="sprite size in px")
    ap.add_argument("--cols", type=int, default=8, help="sheet columns")
    ap.add_argument("--palette", default=None,
                    help="comma-separated hex colors to snap to "
                         "(default: adaptive quantize)")
    ap.add_argument("--colors", type=int, default=15,
                    help="adaptive palette size when --palette is not given")
    ap.add_argument("--outline", default="#241012", help="outline hex color")
    args = ap.parse_args()

    paths = sorted(glob.glob(args.input))
    if not paths:
        raise SystemExit(f"no files match {args.input}")
    palette = args.palette.split(",") if args.palette else None

    sprites = process_set(paths, args.size, palette, args.colors, args.outline)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    pack_sheet(sprites, args.cols).save(args.out)
    print(f"[pixelate] {len(paths)} frames -> {args.out} "
          f"({args.size}px, {'fixed' if palette else 'adaptive'} palette)")


if __name__ == "__main__":
    main()

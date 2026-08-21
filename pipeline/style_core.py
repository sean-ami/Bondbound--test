"""
style_core.py — BondBound "Dark Menagerie" reusable style module.

Implements the Blender side of docs/BondBound_ArtStyle_v1.0.md:
toon materials (2 hard cel bands + Fresnel rim emission), glow materials,
inverted-hull outlines, the standard 3-light rig, orthographic hero camera,
Eevee render settings with bloom, and the 8-frame idle animation helper.

Every creature script imports this module; the style is enforced in code.
Target: Blender 4.2+ (Eevee Next). Falls back to legacy Eevee on older builds.
"""

import math
import bpy
from mathutils import Vector

# ── Palette constants (style bible §2.1) ─────────────────────────────────────

SHADOW_VIOLET_HEX = "#1A1430"   # primary shadow color across ALL assets
KEY_LIGHT_HEX     = "#FFF4E0"   # warm white key


# ── Color helpers ─────────────────────────────────────────────────────────────

def srgb_to_linear(c: float) -> float:
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def hex_to_rgba(hex_str: str, alpha: float = 1.0) -> tuple:
    """Hex sRGB color -> linear RGBA tuple (Blender sockets expect linear)."""
    h = hex_str.lstrip("#")
    return (
        srgb_to_linear(int(h[0:2], 16) / 255.0),
        srgb_to_linear(int(h[2:4], 16) / 255.0),
        srgb_to_linear(int(h[4:6], 16) / 255.0),
        alpha,
    )


def violet_shift(color_rgba: tuple, amount: float = 0.5) -> tuple:
    """Mix Shadow Violet #1A1430 into a color (style rule 2.3.1:
    shadows are violet-shifted, never darkened grey/black)."""
    sv = hex_to_rgba(SHADOW_VIOLET_HEX)
    r, g, b = (c * (1.0 - amount) + s * amount for c, s in zip(color_rgba[:3], sv[:3]))
    return (r, g, b, 1.0)


# ── Scene reset ───────────────────────────────────────────────────────────────

def reset_scene() -> None:
    """Start from a completely empty scene."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    print("[style_core] scene reset (factory, empty)")


# ── Toon material factory (style bible §3.1, §3.3) ───────────────────────────

def make_toon_material(name: str, body_color, shadow_color, outline_color,
                       glow_color) -> bpy.types.Material:
    """2 hard cel bands via Shader-to-RGB -> ColorRamp (constant), plus a
    Fresnel-driven rim emission in the archetype glow color.

    Color args are hex strings or linear RGBA tuples.
    The outline color is stashed on the material for add_outline() callers.
    """
    body_color    = hex_to_rgba(body_color)    if isinstance(body_color, str)    else body_color
    shadow_color  = hex_to_rgba(shadow_color)  if isinstance(shadow_color, str)  else shadow_color
    outline_color = hex_to_rgba(outline_color) if isinstance(outline_color, str) else outline_color
    glow_color    = hex_to_rgba(glow_color)    if isinstance(glow_color, str)    else glow_color

    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (700, 0)

    # Cel banding: white Diffuse -> Shader-to-RGB -> constant ColorRamp.
    # Shader-to-RGB is supported by Eevee Next from Blender 4.2; on engines
    # where it silently returns black the render would lose banding, so we
    # sanity-check the version here rather than crash mid-render.
    if bpy.app.version < (4, 2):
        print("[style_core] WARNING: Blender < 4.2 — Shader-to-RGB requires "
              "legacy Eevee; setup_render() will select it automatically.")

    diffuse = nt.nodes.new("ShaderNodeBsdfDiffuse")
    diffuse.location = (-600, 0)
    diffuse.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)

    to_rgb = nt.nodes.new("ShaderNodeShaderToRGB")
    to_rgb.location = (-400, 0)

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.location = (-200, 0)
    ramp.color_ramp.interpolation = "CONSTANT"   # hard band boundary
    e0 = ramp.color_ramp.elements[0]
    e0.position = 0.0
    e0.color = shadow_color
    e1 = ramp.color_ramp.elements[1]
    e1.position = 0.36                            # lit/shadow split
    e1.color = body_color

    # Display the bands exactly (no re-lighting of the ramp output).
    cel_emit = nt.nodes.new("ShaderNodeEmission")
    cel_emit.name = "CelEmission"
    cel_emit.location = (100, 60)
    cel_emit.inputs["Strength"].default_value = 1.0

    # Rim: Fresnel (IOR 1.8) -> multiply -> emission in glow color (§3.3).
    fresnel = nt.nodes.new("ShaderNodeFresnel")
    fresnel.location = (-200, -220)
    fresnel.inputs["IOR"].default_value = 1.8

    rim_mul = nt.nodes.new("ShaderNodeMath")
    rim_mul.location = (0, -220)
    rim_mul.operation = "MULTIPLY"
    rim_mul.inputs[1].default_value = 2.0         # rim strength ~2.0

    rim_emit = nt.nodes.new("ShaderNodeEmission")
    rim_emit.name = "RimEmission"
    rim_emit.location = (200, -220)
    rim_emit.inputs["Color"].default_value = glow_color

    add = nt.nodes.new("ShaderNodeAddShader")
    add.location = (450, 0)

    nt.links.new(diffuse.outputs["BSDF"], to_rgb.inputs["Shader"])
    nt.links.new(to_rgb.outputs["Color"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], cel_emit.inputs["Color"])
    nt.links.new(fresnel.outputs["Fac"], rim_mul.inputs[0])
    nt.links.new(rim_mul.outputs["Value"], rim_emit.inputs["Strength"])
    nt.links.new(cel_emit.outputs["Emission"], add.inputs[0])
    nt.links.new(rim_emit.outputs["Emission"], add.inputs[1])
    nt.links.new(add.outputs["Shader"], out.inputs["Surface"])

    mat["outline_color"] = outline_color
    print(f"[style_core] toon material '{name}' created")
    return mat


# ── Emission material factory (style bible §3.4) ─────────────────────────────

def make_glow_material(name: str, color, strength: float = 5.0) -> bpy.types.Material:
    """Pure emission for eyes/embers — bright enough to trip Bloom."""
    color = hex_to_rgba(color) if isinstance(color, str) else color
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.name = "GlowEmission"                    # animate_idle() looks this up
    emit.location = (0, 0)
    emit.inputs["Color"].default_value = color
    emit.inputs["Strength"].default_value = strength
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    mat["base_strength"] = strength
    print(f"[style_core] glow material '{name}' created (strength {strength})")
    return mat


# ── Outline system (style bible §3.2 — inverted hull, NOT Freestyle) ─────────

def add_outline(obj: bpy.types.Object, color, thickness_pct: float = 0.02) -> None:
    """Solidify modifier, flipped normals, backface-culled emission shell.
    Thickness = thickness_pct × object bounding-box height."""
    color = hex_to_rgba(color) if isinstance(color, str) else color

    mat = bpy.data.materials.new(f"{obj.name}_Outline")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = color
    emit.inputs["Strength"].default_value = 1.0
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    mat.use_backface_culling = True

    obj.data.materials.append(mat)
    outline_index = len(obj.data.materials) - 1

    thickness = thickness_pct * obj.dimensions.z
    mod = obj.modifiers.new("Outline", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = 1.0                  # extrude outward
    mod.use_flip_normals = True       # shell faces inward -> silhouette only
    mod.use_rim = False
    mod.material_offset = outline_index
    print(f"[style_core] outline on '{obj.name}': {thickness:.4f} units "
          f"({thickness_pct*100:.1f}% of height)")


# ── Lighting rig (style bible §3.5) ──────────────────────────────────────────

def setup_lighting(glow_color) -> None:
    """Key (warm white, upper-left 45°) + rim (glow color, behind-above)
    + Shadow Violet world ambient at very low strength."""
    glow_color = hex_to_rgba(glow_color) if isinstance(glow_color, str) else glow_color
    scene = bpy.context.scene

    # Aim target roughly at creature chest height
    target = bpy.data.objects.new("StyleLightTarget", None)
    target.location = (0.0, 0.0, 0.5)
    scene.collection.objects.link(target)

    def area_light(name, loc, color, energy, size):
        data = bpy.data.lights.new(name, "AREA")
        data.color = color[:3]
        data.energy = energy
        data.size = size
        light = bpy.data.objects.new(name, data)
        light.location = loc
        scene.collection.objects.link(light)
        con = light.constraints.new("TRACK_TO")
        con.target = target
        con.track_axis = "TRACK_NEGATIVE_Z"
        con.up_axis = "UP_Y"
        return light

    # Key: upper-left 45°, warm white, moderate power (defines the lit band)
    area_light("KeyLight", (-2.4, -2.4, 2.8), hex_to_rgba(KEY_LIGHT_HEX), 400.0, 2.0)

    # Rim: behind-above, archetype glow color, strong (the signature edge)
    area_light("RimLight", (0.8, 2.2, 2.4), glow_color, 900.0, 2.0)

    # World: Shadow Violet at very low strength so shadows violet-shift
    world = bpy.data.worlds.new("DarkMenagerieWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = hex_to_rgba(SHADOW_VIOLET_HEX)
    bg.inputs["Strength"].default_value = 0.08
    scene.world = world

    scene.render.film_transparent = True
    print("[style_core] lighting rig: key #FFF4E0 / rim glow / world #1A1430 @ 0.08")


# ── Camera (style bible §3.5) ────────────────────────────────────────────────

def _world_bbox(root: bpy.types.Object):
    """Combined world-space bounding box of a root object and all descendants."""
    lo = Vector((math.inf,) * 3)
    hi = Vector((-math.inf,) * 3)
    stack = [root]
    while stack:
        ob = stack.pop()
        stack.extend(ob.children)
        if ob.type == "MESH":
            for corner in ob.bound_box:
                w = ob.matrix_world @ Vector(corner)
                lo = Vector(map(min, lo, w))
                hi = Vector(map(max, hi, w))
    return lo, hi


def bbox_height(obj: bpy.types.Object) -> float:
    """World-space height of an object + descendants (for animation amplitudes)."""
    lo, hi = _world_bbox(obj)
    return hi.z - lo.z


def setup_camera(target: bpy.types.Object, mode: str = "hero",
                 azimuth_deg: float = None,
                 elevation_deg: float = None) -> bpy.types.Object:
    """Orthographic camera framing the subject (target + children) with ~10%
    padding. Default is the 3/4-front hero shot (az 35°, el −8°); pass
    azimuth_deg / elevation_deg to override for back views, overworld
    top-down angles, etc. Safe to call repeatedly — replaces its own camera."""
    scene = bpy.context.scene

    # Replace any camera from a previous call
    for name in ("StyleCamera", "StyleCameraTarget"):
        old = bpy.data.objects.get(name)
        if old:
            bpy.data.objects.remove(old, do_unlink=True)

    lo, hi = _world_bbox(target)
    center = (lo + hi) / 2.0

    cam_data = bpy.data.cameras.new("StyleCamera")
    cam_data.type = "ORTHO"
    cam = bpy.data.objects.new("StyleCamera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # 3/4 front (front = -Y), slight low angle for hero shots
    azimuth = math.radians(35.0 if azimuth_deg is None else azimuth_deg)
    default_el = -8.0 if mode == "hero" else 14.0
    elevation = math.radians(default_el if elevation_deg is None else elevation_deg)
    dist = 8.0
    direction = Vector((
        math.sin(azimuth) * math.cos(elevation),
        -math.cos(azimuth) * math.cos(elevation),
        math.sin(elevation),
    ))
    cam.location = center + direction * dist

    aim = bpy.data.objects.new("StyleCameraTarget", None)
    aim.location = center
    scene.collection.objects.link(aim)
    con = cam.constraints.new("TRACK_TO")
    con.target = aim
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"

    # Fit ortho scale: project bbox corners into camera space, pad 10%
    bpy.context.view_layer.update()
    inv = cam.matrix_world.inverted()
    ext_x = ext_y = 0.0
    for cx in (lo.x, hi.x):
        for cy in (lo.y, hi.y):
            for cz in (lo.z, hi.z):
                local = inv @ Vector((cx, cy, cz))
                ext_x = max(ext_x, abs(local.x))
                ext_y = max(ext_y, abs(local.y))
    cam_data.ortho_scale = 2.0 * max(ext_x, ext_y) * 1.10
    print(f"[style_core] camera: ortho 3/4 front ({mode}), scale {cam_data.ortho_scale:.3f}")
    return cam


# ── Render settings (style bible §5) ─────────────────────────────────────────

def setup_render(output_path: str, resolution: int = 512) -> None:
    """Eevee (Next), bloom, transparent RGBA PNG at resolution².

    Eevee Next (Blender 4.2+) removed the built-in bloom toggle; bloom is
    reproduced in the compositor with a Fog Glow glare node (threshold 0.9,
    ~6% mix), including an alpha lift so halos survive the transparent film.
    On legacy Eevee the native bloom settings are used instead.
    """
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
        engine = "Eevee Next"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
        engine = "Eevee (legacy)"

    if hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 16   # toon shading needs few samples

    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = output_path

    # Exact palette colors: no filmic/AgX tone remapping
    scene.view_settings.view_transform = "Standard"

    if scene.render.engine != "BLENDER_EEVEE_NEXT" and hasattr(scene.eevee, "use_bloom"):
        # Legacy Eevee only: native bloom. (4.2+ still exposes the deprecated
        # use_bloom flag but Eevee Next ignores it — hence the engine check.)
        scene.eevee.use_bloom = True
        scene.eevee.bloom_threshold = 0.9
        scene.eevee.bloom_intensity = 0.06
        print(f"[style_core] render: {engine}, native bloom, {resolution}px RGBA")
        return

    # Eevee Next: compositor bloom (Fog Glow glare)
    scene.use_nodes = True
    tree = scene.node_tree
    tree.nodes.clear()

    rl = tree.nodes.new("CompositorNodeRLayers")
    rl.location = (-500, 0)

    glare = tree.nodes.new("CompositorNodeGlare")
    glare.location = (-200, 0)
    glare.glare_type = "FOG_GLOW"
    glare.threshold = 0.9
    glare.size = 8
    glare.quality = "HIGH"
    glare.mix = -0.88            # ≈ 6% glare contribution (spec intensity 0.06)

    # Halos land on alpha-0 pixels; lift alpha where the glare adds light
    bw = tree.nodes.new("CompositorNodeRGBToBW")
    bw.location = (0, -180)

    boost = tree.nodes.new("CompositorNodeMath")
    boost.location = (180, -180)
    boost.operation = "MULTIPLY"
    boost.inputs[1].default_value = 4.0
    boost.use_clamp = True

    amax = tree.nodes.new("CompositorNodeMath")
    amax.location = (360, -120)
    amax.operation = "MAXIMUM"
    amax.use_clamp = True

    set_alpha = tree.nodes.new("CompositorNodeSetAlpha")
    set_alpha.location = (540, 0)
    set_alpha.mode = "REPLACE_ALPHA"

    comp = tree.nodes.new("CompositorNodeComposite")
    comp.location = (720, 0)

    tree.links.new(rl.outputs["Image"], glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], bw.inputs["Image"])
    tree.links.new(bw.outputs["Val"], boost.inputs[0])
    tree.links.new(rl.outputs["Alpha"], amax.inputs[0])
    tree.links.new(boost.outputs["Value"], amax.inputs[1])
    tree.links.new(glare.outputs["Image"], set_alpha.inputs["Image"])
    tree.links.new(amax.outputs["Value"], set_alpha.inputs["Alpha"])
    tree.links.new(set_alpha.outputs["Image"], comp.inputs["Image"])
    scene.render.use_compositing = True
    print(f"[style_core] render: {engine}, compositor bloom (fog glow), {resolution}px RGBA")


# ── Idle animation (style bible §5) ──────────────────────────────────────────

def animate_idle(obj: bpy.types.Object, glow_materials: list, frames: int = 8) -> None:
    """Seamless {frames}-frame loop on frames 0..frames-1:
    vertical bob (2.5% of height), breathe scale (1.5%), glow pulse (±20%).
    Frame `frames` would equal frame 0, so 7 -> 0 has no pop."""
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end = frames - 1

    lo, hi = _world_bbox(obj)
    height = hi.z - lo.z
    bob_amp = 0.025 * height
    breathe_amp = 0.015
    base_z = obj.location.z
    base_scale = obj.scale.copy()

    glow_sockets = []
    for mat in glow_materials:
        node = mat.node_tree.nodes.get("GlowEmission")
        if node:
            glow_sockets.append((node.inputs["Strength"],
                                 mat.get("base_strength",
                                         node.inputs["Strength"].default_value)))

    for f in range(frames):
        scene.frame_set(f)
        phase = 2.0 * math.pi * f / frames
        s = math.sin(phase)

        obj.location.z = base_z + bob_amp * s
        obj.keyframe_insert("location", index=2, frame=f)

        factor = 1.0 + breathe_amp * s
        obj.scale = (base_scale.x * factor, base_scale.y * factor, base_scale.z * factor)
        obj.keyframe_insert("scale", frame=f)

        for socket, base_strength in glow_sockets:
            socket.default_value = base_strength * (1.0 + 0.20 * s)
            socket.keyframe_insert("default_value", frame=f)

    scene.frame_set(0)
    print(f"[style_core] idle loop: {frames} frames, bob {bob_amp:.4f}u, "
          f"breathe ±{breathe_amp*100:.1f}%, glow ±20%")


# ── Render execution helpers ─────────────────────────────────────────────────

def render_still(filepath: str) -> str:
    scene = bpy.context.scene
    scene.render.filepath = filepath
    bpy.ops.render.render(write_still=True)
    print(f"[style_core] wrote {filepath}")
    return filepath


def render_frames(directory: str, name_pattern: str, frames: int = 8) -> list:
    """Render frames 0..frames-1 to name_pattern.format(frame=NN)."""
    import os
    scene = bpy.context.scene
    paths = []
    for f in range(frames):
        scene.frame_set(f)
        path = os.path.join(directory, name_pattern.format(frame=f))
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        print(f"[style_core] wrote {path}")
        paths.append(path)
    return paths

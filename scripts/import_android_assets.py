#!/usr/bin/env python3
"""Import the current Android artwork without redrawing its geometry.

Run from the PWA project: python3 scripts/import_android_assets.py --write
Without --write, conversion and structural validation run entirely in memory.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET

ANDROID = "{http://schemas.android.com/apk/res/android}"
SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)

def tag(name):
    return "{" + SVG + "}" + name

def attr(node, name, default=None):
    return node.get(ANDROID + name, default)

def number(value):
    return format(float(value), ".12g")

def element(name, attrs=None):
    return ET.Element(tag(name), attrs or {})

def encode(root):
    return ET.tostring(root, encoding="utf-8", xml_declaration=True) + b"\n"

def check_attributes(node, allowed):
    unknown = {key[len(ANDROID):] for key in node.attrib if key.startswith(ANDROID)} - set(allowed.split())
    if unknown:
        raise ValueError(f"Unsupported attributes on {node.tag}: {sorted(unknown)}")

def color(value):
    if value == "@android:color/transparent":
        return "#000000", 0.0
    if value == "@android:color/black":
        return "#000000", 1.0
    if re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        return value, 1.0
    if re.fullmatch(r"#[0-9a-fA-F]{8}", value):
        return "#" + value[3:], int(value[1:3], 16) / 255
    raise ValueError(f"Unsupported color: {value}")

def convert_node(node):
    if node.tag == "path":
        check_attributes(node, "pathData fillColor fillAlpha fillType strokeColor strokeAlpha strokeWidth strokeLineCap strokeLineJoin strokeMiterLimit")
        out = element("path", {"d": attr(node, "pathData")})
        for paint in ("fill", "stroke"):
            value = attr(node, paint + "Color")
            if value is None:
                out.set(paint, "none")
            else:
                rgb, alpha = color(value)
                out.set(paint, rgb)
                alpha *= float(attr(node, paint + "Alpha", "1"))
                if alpha != 1:
                    out.set(paint + "-opacity", number(alpha))
        out.set("fill-rule", {"nonZero": "nonzero", "evenOdd": "evenodd"}[attr(node, "fillType", "nonZero")])
        if attr(node, "strokeColor") is not None:
            out.set("stroke-width", attr(node, "strokeWidth", "0"))
        for source, target in (
            ("strokeLineCap", "stroke-linecap"),
            ("strokeLineJoin", "stroke-linejoin"),
            ("strokeMiterLimit", "stroke-miterlimit"),
        ):
            if attr(node, source) is not None:
                out.set(target, attr(node, source))
        if len(node):
            raise ValueError("Nested path resources need an explicit converter")
        return out
    if node.tag == "group":
        check_attributes(node, "pivotX pivotY rotation scaleX scaleY translateX translateY")
        px, py = (float(attr(node, key, "0")) for key in ("pivotX", "pivotY"))
        tx, ty = (float(attr(node, key, "0")) for key in ("translateX", "translateY"))
        sx, sy = (float(attr(node, key, "1")) for key in ("scaleX", "scaleY"))
        rotation = float(attr(node, "rotation", "0"))
        # Android: translate(-pivot), scale, rotate, translate(pivot + translation).
        transform = (
            f"translate({number(px + tx)} {number(py + ty)}) "
            f"rotate({number(rotation)}) scale({number(sx)} {number(sy)}) "
            f"translate({number(-px)} {number(-py)})"
        )
        out = element("g", {"transform": transform})
        out.extend(convert_node(child) for child in node)
        return out
    raise ValueError(f"Unsupported vector element: {node.tag}")

def vector(root):
    check_attributes(root, "width height viewportWidth viewportHeight")
    out = element("svg", {
        "width": re.sub(r"dp$", "", attr(root, "width")),
        "height": re.sub(r"dp$", "", attr(root, "height")),
        "viewBox": f"0 0 {attr(root, 'viewportWidth')} {attr(root, 'viewportHeight')}",
    })
    out.extend(convert_node(child) for child in root)
    source_paths = [attr(p, "pathData") for p in root.iter("path")]
    svg_paths = [p.get("d") for p in out.iter(tag("path"))]
    assert source_paths == svg_paths, "Path geometry changed during conversion"
    return out

def build(source):
    res = source / "app/src/main/res"
    outputs = {}
    vectors = {}
    drawables = {}
    for path in sorted((res / "drawable").glob("*.xml")):
        node = ET.parse(path).getroot()
        drawables[path.stem] = node
        if node.tag == "vector":
            converted = vector(node)
            vectors[path.stem] = converted
            outputs[f"public/assets/drawable/{path.stem}.svg"] = encode(converted)
        outputs[f"reference/android/res/drawable/{path.name}"] = path.read_bytes()

    animation = drawables["construction_loading_animation"]
    assert animation.tag == "animation-list"
    frames = [(attr(item, "drawable").split("/")[-1], int(attr(item, "duration"))) for item in animation]
    duration = sum(ms for _, ms in frames)
    first = vectors[frames[0][0]]
    animated = element("svg", dict(first.attrib))
    elapsed = 0
    for index, (name, ms) in enumerate(frames):
        assert vectors[name].attrib == first.attrib
        start, end = elapsed / duration, (elapsed + ms) / duration
        times, values = [0.0], ["1" if index == 0 else "0"]
        if start > 0:
            times.append(start)
            values.append("1")
        if end < 1:
            times.append(end)
            values.append("0")
        times.append(1.0)
        values.append(values[-1])
        group = element("g", {"opacity": "1" if index == 0 else "0"})
        group.append(element("animate", {
            "attributeName": "opacity", "calcMode": "discrete",
            "dur": f"{duration}ms",
            "repeatCount": "1" if attr(animation, "oneshot") == "true" else "indefinite",
            "values": ";".join(values), "keyTimes": ";".join(number(t) for t in times),
        }))
        group.extend(copy.deepcopy(child) for child in vectors[name])
        animated.append(group)
        elapsed += ms
    outputs["public/assets/drawable/construction_loading_animation.svg"] = encode(animated)
    outputs["public/assets/drawable/construction_loading_animation.json"] = (
        json.dumps({"durationMs": duration, "loop": attr(animation, "oneshot") != "true",
                    "frames": [{"src": name + ".svg", "durationMs": ms} for name, ms in frames]}, indent=2) + "\n"
    ).encode()

    splash = drawables["splash_screen_background"]
    assert splash.tag == "layer-list" and len(splash) == 2
    assert attr(splash[0], "drawable") == "@android:color/black"
    item = splash[1]
    assert attr(item, "gravity") == "center"
    width = float(attr(item, "width")[:-2])
    height = float(attr(item, "height")[:-2])
    out = element("svg", {"width": "100%", "height": "100%"})
    out.append(element("rect", {"width": "100%", "height": "100%", "fill": "#000000"}))
    logo = copy.deepcopy(vectors[attr(item, "drawable").split("/")[-1]])
    logo.attrib.update({"x": "50%", "y": "50%", "width": number(width), "height": number(height)})
    group = element("g", {"transform": f"translate({number(-width / 2)} {number(-height / 2)})"})
    group.append(logo)
    out.append(group)
    outputs["public/assets/drawable/splash_screen_background.svg"] = encode(out)

    for path in sorted((res / "mipmap-anydpi-v26").glob("*.xml")):
        root = ET.parse(path).getroot()
        assert root.tag == "adaptive-icon"
        out = element("svg", {"width": "108", "height": "108", "viewBox": "0 0 108 108"})
        # The browser/iOS applies its own icon mask; retain the Android artwork layers.
        for kind in ("background", "foreground"):
            name = attr(root.find(kind), "drawable").split("/")[-1]
            assert vectors[name].get("viewBox") == "0 0 108 108"
            out.extend(copy.deepcopy(child) for child in vectors[name])
        outputs[f"public/assets/icons/{path.stem}.svg"] = encode(out)
        outputs[f"reference/android/res/mipmap-anydpi-v26/{path.name}"] = path.read_bytes()

    # Legacy WebP launcher images are Android placeholders, retained only as references.
    for path in sorted(res.glob("mipmap-*/*.webp")):
        outputs["reference/android/res/" + path.relative_to(res).as_posix()] = path.read_bytes()
    strings_path = res / "values/strings.xml"
    strings = {item.get("name"): "".join(item.itertext()) for item in ET.parse(strings_path).getroot()}
    outputs["public/assets/values/strings.json"] = (json.dumps(strings, ensure_ascii=False, indent=2) + "\n").encode()
    outputs["reference/android/res/values/strings.xml"] = strings_path.read_bytes()
    for path in sorted((source / "design").iterdir()):
        if path.is_file():
            outputs["reference/android/design/" + path.name] = path.read_bytes()
    commit = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()
    manifest = {
        "sourceProject": source.name,
        "sourceCommit": commit,
        "vectorCount": len(vectors),
        "notes": [
            "SVG path geometry is copied verbatim from Android VectorDrawables.",
            "ARGB colors are converted to RGB plus opacity; group transforms preserve pivot order.",
            "System icon masks and raster edge smoothing can differ across platforms.",
            "Legacy WebP launcher images are placeholders and are not published as app assets.",
            "Design references are separate from runtime assets; current Android code remains the baseline.",
            "Compose Material icons and Canvas drawings must be ported with their screens."
        ],
        "assets": {p[len("public/"):]: hashlib.sha256(data).hexdigest()
                   for p, data in sorted(outputs.items()) if p.startswith("public/")},
    }
    outputs["reference/android/asset-manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    for name, data in outputs.items():
        if name.endswith(".svg"):
            ET.fromstring(data)
    return outputs, manifest

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path.cwd().parent / "Radulovic")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    outputs, manifest = build(args.source.resolve())
    # Refuse to silently overwrite manually edited assets.
    for name, data in outputs.items():
        path = Path(name)
        if path.exists() and path.read_bytes() != data:
            raise SystemExit(f"Existing file differs: {path}; review it before replacing.")
    if args.write:
        for name, data in outputs.items():
            path = Path(name)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    print(json.dumps({"mode": "written" if args.write else "validated dry run",
                      "sourceCommit": manifest["sourceCommit"], "vectors": manifest["vectorCount"],
                      "svgFiles": sum(p.endswith(".svg") for p in outputs),
                      "files": len(outputs), "bytes": sum(map(len, outputs.values()))}, indent=2))

if __name__ == "__main__":
    main()

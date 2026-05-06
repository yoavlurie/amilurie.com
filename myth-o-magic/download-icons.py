#!/usr/bin/env python3
"""
Download SVG icons from game-icons.net and convert them to metallic gold PNGs
for the Myth-o-Magic card game.

Requirements (install before running):
    brew install cairo
    pip3 install cairosvg Pillow requests

Usage:
    python3 download-icons.py
"""

import os
import sys
import io
import requests
import traceback

try:
    import cairosvg
except OSError:
    print("ERROR: cairo C library not found.")
    print("Install it with:  brew install cairo")
    print("Then retry:        python3 download-icons.py")
    sys.exit(1)

from PIL import Image, ImageFilter, ImageEnhance, ImageChops
import numpy as np

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CORNER_DIR = os.path.join(SCRIPT_DIR, "Card-Art", "icons")
STATUS_DIR = os.path.join(SCRIPT_DIR, "Card-Art", "icons", "status")

ICON_SIZE = 128

# game-icons.net SVG endpoint: white foreground (#fff) on black bg (#000)
# We strip the background rect to get white-on-transparent
SITE_BASE = "https://game-icons.net/icons/ffffff/000000/1x1"

# ---------------------------------------------------------------------------
# Icon mappings: output filename -> game-icons path (author/icon-name)
# ---------------------------------------------------------------------------

# Status icons (character type badges)
STATUS_ICONS = {
    "god":        "lorc/zeus-sword",
    "goddess":    "delapouite/female",
    "demigod":    "lorc/angel-outfit",
    "titan":      "delapouite/giant",
    "giant":      "lorc/strong",
    "monster":    "lorc/bestial-fangs",
    "hero":       "lorc/winged-sword",
    "human":      "delapouite/person",
    "primordial": "lorc/vortex",
    "dragon":     "lorc/dragon-head",
    "beast":      "lorc/wolf-howl",
    "cyclops":    "lorc/one-eyed",
    "satyr":      "lorc/imp-laugh",
    "hunter":     "lorc/bowman",
    "oracle":     "lorc/crystal-ball",
    "sorceress":  "lorc/witch-flight",
    "manticore":  "lorc/wyvern",
    "villain":    "lorc/evil-minion",
}

# Corner icons (character-specific symbols)
CORNER_ICONS = {
    "lightning-bolt":    "lorc/lightning-frequency",
    "trident":           "lorc/trident",
    "skull":             "lorc/skull-crossed-bones",
    "owl":               "lorc/owl",
    "flame":             "lorc/fire-zone",
    "heart":             "lorc/heart-inside",
    "bow":               "lorc/pocket-bow",
    "bow-and-moon":      "lorc/high-shot",
    "crossed-swords":    "lorc/crossed-swords",
    "sword":             "lorc/pointy-sword",
    "hammer":            "lorc/hammer-drop",
    "hammer-and-anvil":  "lorc/anvil-impact",
    "lyre":              "lorc/lyre",
    "sun":               "lorc/sun",
    "eagle":             "lorc/eagle-emblem",
    "paw-print":         "lorc/paw-print",
    "spear":             "lorc/spear-hook",
    "baseball-bat":      "delapouite/baseball-bat",
    "reed-pipes":        "lorc/music-spell",
    "gem":               "lorc/gem-pendant",
    "crown":             "lorc/crown",
    "crystal-ball":      "lorc/crystal-ball",
    "scythe":            "lorc/scythe",
    "tree":              "lorc/oak",
    "star":              "lorc/star-swirl",
    "cat":               "lorc/cat",
    "seashell":          "lorc/spiral-shell",
    "twin-stars":        "lorc/double-diaphragm",
    "spider":            "lorc/spider-web",
    "chains":            "lorc/manacles",
    "fury-wings":        "lorc/angel-wings",
    "wolf-head":         "lorc/wolf-head",
    "eye":               "lorc/surrounded-eye",
    "glowing-eyes":      "lorc/semi-closed-eye",
    "blind-eye":         "lorc/ninja-mask",
    "eye-of-prophecy":   "lorc/third-eye",
    "scales":            "lorc/scales",
    "triple-moon":       "lorc/moon-claws",
    "snowflake":         "lorc/snowflake-1",
    "two-faces":         "lorc/drama-masks",
    "gorgon-head":       "lorc/snake-bite",
    "gorgon-mask":       "lorc/snake",
    "bull-head":         "lorc/bull-horns",
    "lion-head":         "lorc/lion",
    "scorpion-tail":     "lorc/scorpion-tail",
    "gear-cog":          "lorc/gears",
    "gear-hammer":       "lorc/anvil-impact",
    "earth-globe":       "delapouite/earth-africa-europe",
    "dark-flame":        "lorc/fire-ring",
    "hooded-spirits":    "lorc/spectre",
    "hearth-flame":      "lorc/campfire",
    "wheat-trident":     "lorc/wheat",
    "peacock":           "lorc/feathered-wing",
    "helm-of-darkness":  "lorc/visored-helm",
    "gold-coins":        "delapouite/coins",
    "scroll":            "lorc/scroll-unfurled",
    "compass":           "lorc/compass",
    "crossed-axes":      "lorc/crossed-axes",
    "dagger":            "lorc/plain-dagger",
    "laurel-wreath":     "lorc/laurels",
    "vine":              "lorc/vine-whip",
    "nightmare-flame":   "lorc/fire-dash",
    "golden-hand":       "lorc/hand",
    "three-headed-dog":  "lorc/hound",
    "caduceus":          "delapouite/caduceus",
    "wheat":             "lorc/wheat",
}

# ---------------------------------------------------------------------------
# Download & conversion helpers
# ---------------------------------------------------------------------------

def download_svg(icon_path: str):
    """Download an SVG from game-icons.net and strip the background rect."""
    import re

    url = f"{SITE_BASE}/{icon_path}.svg"

    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code != 200 or b"<svg" not in resp.content.lower():
            return None
    except requests.RequestException:
        return None

    svg_text = resp.content.decode("utf-8", errors="replace")

    # Remove the background rectangle (first <path> that fills the entire 512x512)
    # Pattern: <path d="M0 0h512v512H0z"/> (with optional fill attr)
    svg_text = re.sub(
        r'<path[^>]*d="M0 0h512v512H0z"[^/]*/>', "", svg_text, count=1
    )

    return svg_text.encode("utf-8")


def svg_to_gold_png(svg_data: bytes, output_path: str, size: int = ICON_SIZE) -> bool:
    """Convert SVG bytes to a metallic gold embossed PNG.

    The input SVG has white (#fff) icon paths on a transparent background
    (after we stripped the black background rect).  We use the rendered
    luminance/alpha to derive the icon shape, then recolor it with a
    gold metallic tint and emboss effect.
    """
    try:
        # Render SVG to PNG at target size
        png_data = cairosvg.svg2png(
            bytestring=svg_data,
            output_width=size,
            output_height=size,
        )

        img = Image.open(io.BytesIO(png_data)).convert("RGBA")
        arr = np.array(img)

        # Derive icon shape mask.
        # After stripping the bg rect we have white paths on transparent.
        # The alpha channel gives us the shape.  If alpha is mostly empty
        # (some SVGs render differently), fall back to luminance.
        alpha = arr[:, :, 3].astype(float) / 255.0

        if alpha.max() < 0.05:
            # Derive from luminance instead
            lum = (
                0.299 * arr[:, :, 0]
                + 0.587 * arr[:, :, 1]
                + 0.114 * arr[:, :, 2]
            )
            alpha = lum.astype(float) / 255.0

        if alpha.max() < 0.05:
            return False

        # --- Gold color palette ---
        gold    = (196, 162, 69)   # base  #c4a245
        hilite  = (235, 210, 130)  # highlight
        shadow  = (130, 100, 35)   # shadow

        # Base gold image
        base = np.zeros((*alpha.shape, 4), dtype=float)
        for c in range(3):
            base[:, :, c] = gold[c]
        base[:, :, 3] = alpha * 255

        # --- Emboss for 3D relief ---
        gray = Image.fromarray((alpha * 255).astype(np.uint8), "L")
        embossed = gray.filter(ImageFilter.EMBOSS)
        embossed = embossed.filter(ImageFilter.SMOOTH)
        emb = np.array(embossed).astype(float) / 255.0

        # Blend emboss lighting into gold channels
        for c in range(3):
            hi_blend = np.clip((emb - 0.5) * 2.0, 0, 1)   # 0..1 for highlights
            sh_blend = np.clip((0.5 - emb) * 2.0, 0, 1)    # 0..1 for shadows
            base[:, :, c] = (
                gold[c]
                + (hilite[c] - gold[c]) * hi_blend * 0.7
                - (gold[c] - shadow[c]) * sh_blend * 0.5
            )

        # Keep alpha
        base[:, :, 3] = alpha * 255
        base = np.clip(base, 0, 255).astype(np.uint8)
        result_img = Image.fromarray(base, "RGBA")

        # --- Subtle inner glow for depth ---
        glow = gray.filter(ImageFilter.GaussianBlur(radius=2))
        glow_arr = np.array(glow).astype(float) / 255.0
        edge = np.clip(glow_arr - alpha, 0, 1)

        final = np.array(result_img).astype(float)
        for c in range(3):
            final[:, :, c] = np.clip(final[:, :, c] + edge * 40, 0, 255)
        final[:, :, 3] = np.clip(alpha * 255, 0, 255)

        out = Image.fromarray(final.astype(np.uint8), "RGBA")
        out = out.filter(ImageFilter.SHARPEN)
        out.save(output_path, "PNG")
        return True

    except Exception as e:
        print(f"  ERROR converting SVG: {e}")
        traceback.print_exc()
        return False


def process_icon(name: str, icon_path: str, output_dir: str) -> bool:
    """Download and process a single icon. Returns True on success."""
    output_file = os.path.join(output_dir, f"{name}.png")

    print(f"  [{name}] downloading {icon_path} ...", end=" ", flush=True)
    svg_data = download_svg(icon_path)

    if svg_data is None:
        print("FAILED (download)")
        return False

    ok = svg_to_gold_png(svg_data, output_file)
    if ok:
        print("OK")
    else:
        print("FAILED (conversion)")
    return ok


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Ensure output dirs exist
    os.makedirs(CORNER_DIR, exist_ok=True)
    os.makedirs(STATUS_DIR, exist_ok=True)

    successes = 0
    failures = []

    # --- Status icons ---
    print("=== Downloading STATUS icons ===")
    for name, path in STATUS_ICONS.items():
        if process_icon(name, path, STATUS_DIR):
            successes += 1
        else:
            failures.append(f"status/{name}")

    # --- Corner icons ---
    print("\n=== Downloading CORNER icons ===")
    for name, path in CORNER_ICONS.items():
        if process_icon(name, path, CORNER_DIR):
            successes += 1
        else:
            failures.append(f"corner/{name}")

    # --- Summary ---
    total = len(STATUS_ICONS) + len(CORNER_ICONS)
    print(f"\n{'='*50}")
    print(f"Done: {successes}/{total} icons processed successfully.")
    if failures:
        print(f"\nFailed ({len(failures)}):")
        for f in failures:
            print(f"  - {f}")
    else:
        print("All icons downloaded and converted!")


if __name__ == "__main__":
    main()

"""Generate PWA manifest icons with white background and safe-zone logo sizing."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "logo_icon.png"

# W3C maskable safe zone: central circle radius = 40% of icon width (80% diameter).
# Target logo at ~62% of canvas so it stays inside safe zone with breathing room.
LOGO_SCALE = 0.62
BACKGROUND = (255, 255, 255, 255)

SIZES = {
    "logo_manifest_48.png": 48,
    "logo_manifest_192.png": 192,
    "logo_manifest_512.png": 512,
}


def prepare_logo(source: Image.Image) -> Image.Image:
    logo = source.convert("RGBA")
    pixels = logo.load()
    width, height = logo.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r < 32 and g < 32 and b < 32:
                pixels[x, y] = (255, 255, 255, 0)

    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)

    return logo


def compose_icon(source: Image.Image, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BACKGROUND)
    logo_max = max(1, round(size * LOGO_SCALE))

    logo = prepare_logo(source)
    logo.thumbnail((logo_max, logo_max), Image.Resampling.LANCZOS)

    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    canvas.paste(logo, (x, y), logo)
    return canvas.convert("RGB")


def main() -> None:
    source = Image.open(SOURCE)
    for filename, size in SIZES.items():
        icon = compose_icon(source, size)
        out = PUBLIC / filename
        icon.save(out, format="PNG", optimize=True)
        print(f"Wrote {out.name} ({size}x{size}, logo ~{round(size * LOGO_SCALE)}px)")


if __name__ == "__main__":
    main()

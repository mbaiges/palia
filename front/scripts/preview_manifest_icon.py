"""Draw safe-zone overlay on the 512 manifest icon for review."""

from pathlib import Path

from PIL import Image, ImageDraw

PUBLIC = Path(__file__).resolve().parents[1] / "public"
ICON = PUBLIC / "logo_manifest_512.png"
OUT = PUBLIC / "logo_manifest_512_preview.png"

size = 512
center = size / 2
safe_radius = size * 0.4

img = Image.open(ICON).convert("RGBA")
overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)
draw.ellipse(
    (center - safe_radius, center - safe_radius, center + safe_radius, center + safe_radius),
    outline=(0, 90, 113, 180),
    width=4,
)
draw.rectangle((0, 0, size - 1, size - 1), outline=(186, 26, 26, 120), width=2)

preview = Image.alpha_composite(img.convert("RGBA"), overlay)
preview.save(OUT)
print(f"Wrote {OUT.name}")

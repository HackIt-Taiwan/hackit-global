"""Compose the maintained page template, country geometry and wall markup."""
from pathlib import Path

root = Path(__file__).resolve().parent
page = (root / "page.html").read_text(encoding="utf-8")
for marker, name in {"__MAP__": "world-map.svg", "__WALL__": "wall.html"}.items():
    if marker not in page:
        raise ValueError(f"Missing template marker: {marker}")
    page = page.replace(marker, (root / name).read_text(encoding="utf-8"))
output = root / "static" / "index.html"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(page, encoding="utf-8")

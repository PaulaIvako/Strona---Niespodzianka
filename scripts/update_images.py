#!/usr/bin/env python3
"""Aktualizuje spis obrazków strony na podstawie folderów z porami dnia."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOLDERS = ("Morning", "Midday", "After Work", "Evening", "Night")
EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}

pools = {}
for name in FOLDERS:
    folder = ROOT / "obrazki" / name
    if not folder.is_dir():
        raise SystemExit(f"Brakuje folderu: {folder}")
    paths = sorted((p for p in folder.iterdir() if p.is_file() and not p.name.startswith('.') and p.suffix.lower() in EXTENSIONS), key=lambda p: p.name.casefold())
    pools[name] = [p.relative_to(ROOT).as_posix() for p in paths]
    print(f"{name}: {len(paths)}")

(ROOT / "data.js").write_text("const IMAGE_POOLS = " + json.dumps(pools, ensure_ascii=False, separators=(',', ':')) + ";\n", encoding="utf-8")

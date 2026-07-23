"""Extract AM/NS MTC reference HTML and ISI SVG from agent transcript."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT = Path(
    r"C:\Users\Vraj Patel\.cursor\projects\d-j\agent-transcripts"
    r"\459ec277-d733-4956-9add-5168b1bce0db"
    r"\459ec277-d733-4956-9add-5168b1bce0db.jsonl"
)
REF = ROOT / "anms-mtc-reference.html"
ASSETS = ROOT / "src" / "projects" / "profile" / "assets" / "anms-isi-mark.svg"
PUBLIC = ROOT / "public" / "amns-isi-mark.svg"


def extract_html() -> str:
    for line in TRANSCRIPT.open(encoding="utf-8"):
        if "crispEdges" not in line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        content = obj.get("message", {}).get("content", [])
        if not isinstance(content, list):
            continue
        for part in content:
            if part.get("type") != "text":
                continue
            text = part.get("text", "")
            if '<svg width="52"' not in text:
                continue
            if text.startswith("<user_query>"):
                text = text[len("<user_query>") :]
            if text.endswith("</user_query>"):
                text = text[: -len("</user_query>")]
            return text.strip()
    raise SystemExit("HTML with ISI SVG not found in transcript")


def main() -> None:
    html = extract_html()
    REF.write_text(html, encoding="utf-8")
    print(f"Wrote {REF} ({len(html)} bytes)")

    match = re.search(r'<svg width="52"[^>]*>.*?</svg>', html, re.DOTALL)
    if not match:
        print("ISI SVG not found in HTML", file=sys.stderr)
        sys.exit(1)
    svg = match.group(0)
    ASSETS.parent.mkdir(parents=True, exist_ok=True)
    ASSETS.write_text(svg, encoding="utf-8")
    PUBLIC.write_text(svg, encoding="utf-8")
    print(f"Wrote {ASSETS} ({len(svg)} bytes)")


if __name__ == "__main__":
    main()

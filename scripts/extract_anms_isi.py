"""Extract ISI mark SVG from AM/NS MTC reference HTML."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'anms-mtc-reference.html'
OUT = ROOT / 'public' / 'amns-isi-mark.svg'


def main() -> None:
    html = REF.read_text(encoding='utf-8')
    match = re.search(r'<svg width="52"[^>]*>.*?</svg>', html, re.DOTALL)
    if not match:
        print('ISI SVG not found in reference HTML', file=sys.stderr)
        sys.exit(1)
    svg = match.group(0)
    OUT.write_text(svg, encoding='utf-8')
    print(f'Wrote {OUT} ({len(svg)} bytes)')


if __name__ == '__main__':
    main()

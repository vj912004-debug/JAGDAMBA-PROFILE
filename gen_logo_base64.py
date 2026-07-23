import base64
import pathlib

src = pathlib.Path(r"d:\j\public\logo.png")
raw = src.read_bytes()
mime = "image/jpeg" if raw[:2] == b"\xff\xd8" else "image/png"
data = base64.b64encode(raw).decode("ascii")
out = pathlib.Path(r"d:\j\src\projects\profile\utils\logoBase64.ts")
out.write_text(f'export const LOGO_BASE64 = "data:{mime};base64,{data}";\n', encoding="utf-8")
print(f"Wrote {out} ({mime}, {len(data)} chars)")

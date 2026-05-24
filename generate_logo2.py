from PIL import Image
import base64
import io

img = Image.open(r'd:\j\public\logo2.png')
img.thumbnail((400, 400), Image.Resampling.LANCZOS)
buffer = io.BytesIO()
img.save(buffer, format='PNG', optimize=True)
img_data = buffer.getvalue()

b64 = base64.b64encode(img_data).decode('ascii')

with open(r'd:\j\src\projects\profile\utils\logo2Base64.ts', 'w', encoding='utf-8') as f:
    f.write('export const LOGO2_BASE64 = "data:image/png;base64,' + b64 + '";\n')

print(f'Regenerated logo2Base64.ts. Original size: 4.8MB. New base64 size: {len(b64)} bytes')

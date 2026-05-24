import base64

with open(r'd:\j\public\logo.png', 'rb') as f:
    img_data = f.read()

b64 = base64.b64encode(img_data).decode('ascii')

with open(r'd:\j\src\projects\profile\utils\logoBase64.ts', 'w', encoding='utf-8') as f:
    f.write('export const LOGO_BASE64 = "data:image/png;base64,' + b64 + '";\n')

print('Regenerated logoBase64.ts directly from logo.png')

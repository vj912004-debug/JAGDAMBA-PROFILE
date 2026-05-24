import re

with open(r'd:\j\new_logo_base64.txt', 'r') as f:
    b64 = f.read().replace('\n', '').replace('\r', '').strip()

with open(r'd:\j\src\projects\profile\utils\logoBase64.ts', 'w', encoding='utf-8') as f:
    f.write('export const LOGO_BASE64 = "data:image/png;base64,' + b64 + '";\n')

print('Fixed logoBase64.ts')

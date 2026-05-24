import re

filepath = r'd:\j\src\projects\profile\utils\pdfGenerator.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the import at the top
if 'import { LOGO_BASE64 }' not in content:
    content = "import { LOGO_BASE64 } from './logoBase64';\n" + content

# We have tags like <img src="data:image/png;base64,..."
pattern = re.compile(r'data:image/[a-zA-Z0-9+;/=]+')

def replacer(match):
    return '${LOGO_BASE64}'

# Replace `src="data:image..."` with `src="${LOGO_BASE64}"` since it's inside template literals
new_content = re.sub(r'src="data:image[^"]+"', r'src="${LOGO_BASE64}"', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated pdfGenerator.ts')

import re

# Update pdfGenerator.ts
pdf_path = r'd:\j\src\projects\profile\utils\pdfGenerator.ts'
with open(pdf_path, 'r', encoding='utf-8') as f:
    pdf_content = f.read()

if 'LOGO2_BASE64' not in pdf_content:
    pdf_content = "import { LOGO2_BASE64 } from './logo2Base64';\n" + pdf_content

# We only replace the one with alt="Shree Jagdamba Steel Profiles"
pdf_content = pdf_content.replace(
    'src="${LOGO_BASE64}" alt="Shree Jagdamba Steel Profiles"',
    'src="${LOGO2_BASE64}" alt="Shree Jagdamba Steel Profiles"'
)

with open(pdf_path, 'w', encoding='utf-8') as f:
    f.write(pdf_content)

# Update ChallanPrint.tsx
challan_path = r'd:\j\src\projects\profile\components\ChallanPrint.tsx'
with open(challan_path, 'r', encoding='utf-8') as f:
    challan_content = f.read()

if 'LOGO2_BASE64' not in challan_content:
    # Add import below LOGO_BASE64
    challan_content = challan_content.replace(
        "import { LOGO_BASE64 } from '../utils/logoBase64';",
        "import { LOGO_BASE64 } from '../utils/logoBase64';\nimport { LOGO2_BASE64 } from '../utils/logo2Base64';"
    )

challan_content = challan_content.replace(
    'src={LOGO_BASE64} alt="Shree Jagdamba Steel Profiles"',
    'src={LOGO2_BASE64} alt="Shree Jagdamba Steel Profiles"'
)

with open(challan_path, 'w', encoding='utf-8') as f:
    f.write(challan_content)

print("Updated pdfGenerator.ts and ChallanPrint.tsx")

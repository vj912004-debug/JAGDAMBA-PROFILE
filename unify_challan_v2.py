import re

# 1. Update ChallanPrint.tsx
challan_path = r'd:\j\src\projects\profile\components\ChallanPrint.tsx'
with open(challan_path, 'r', encoding='utf-8') as f:
    challan_content = f.read()

# Extract Duplicate body
dup_match = re.search(r'function ChallanDuplicateCopy\(\) \{(.*?)\n  \}\n\}', challan_content, re.DOTALL)
if dup_match:
    dup_body = dup_match.group(1) + '\n  }'
    
    # Create new Original body from it
    new_orig = 'function ChallanOriginalCopy() {' + dup_body
    
    # Now replace the old Original body
    challan_content = re.sub(r'function ChallanOriginalCopy\(\) \{(.*?)\n  \}', new_orig, challan_content, flags=re.DOTALL)
    
    # Remove ' | DUPLICATE COPY' from both
    challan_content = challan_content.replace('DELIVERY CHALLAN | DUPLICATE COPY', 'DELIVERY CHALLAN')
    
    # We no longer need LOGO_BASE64 if it's not used, but to avoid TS errors let's make sure it's kept or we replace its import.
    # Actually, we replaced it so it's not used.
    # We will remove the import of LOGO_BASE64
    challan_content = challan_content.replace("import { LOGO_BASE64 } from '../utils/logoBase64';\n", "")
    
    # Since tcVal, utVal etc might be unused now in the top scope, let's remove them from the top scope if they cause issues.
    # Actually, they ARE used in the Duplicate Copy body! (tcVal, utVal, loadingVal, transportVal).
    # Wait, the Duplicate copy HTML doesn't use `tcVal`. Let's check.
    # In ChallanDuplicateCopy, it was: {order?.tc === 'Yes' ? 'YES' : ''}
    # Ah! So `tcVal` was only used in the OLD Original Copy.
    # Let's remove the unused vars:
    challan_content = re.sub(r'const tcVal =.*?\n', '', challan_content)
    challan_content = re.sub(r'const utVal =.*?\n', '', challan_content)
    challan_content = re.sub(r'const loadingVal =.*?\:\s*\'NO\';\n', '', challan_content, flags=re.DOTALL)
    challan_content = re.sub(r'const transportVal =.*?\:\s*\'NO\';\n', '', challan_content, flags=re.DOTALL)
    
    with open(challan_path, 'w', encoding='utf-8') as f:
        f.write(challan_content)
    print("Updated ChallanPrint.tsx")
else:
    print("Failed to match duplicate body in ChallanPrint")

# 2. Update pdfGenerator.ts
pdf_path = r'd:\j\src\projects\profile\utils\pdfGenerator.ts'
with open(pdf_path, 'r', encoding='utf-8') as f:
    pdf_content = f.read()

# Extract Duplicate HTML
dup_html_match = re.search(r'<div class="challan-container-dl">(.*?)</div>\n            </div>', pdf_content, re.DOTALL)
if dup_html_match:
    dup_html = '<div class="challan-container-dl">' + dup_html_match.group(1) + '</div>\n            </div>'
    
    # Create new Original HTML
    new_orig_html = dup_html.replace('class="challan-container-dl"', 'class="challan-container-orig"')
    # Replace DUPLICATE COPY text with nothing
    new_orig_html = new_orig_html.replace('DELIVERY CHALLAN &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#f26522;">DUPLICATE COPY</span>', 'DELIVERY CHALLAN')
    
    # Replace the old Original HTML
    pdf_content = re.sub(r'<div class="challan-container-orig">.*?<!-- END ORIGINAL COPY -->', new_orig_html + '\n            <!-- END ORIGINAL COPY -->', pdf_content, flags=re.DOTALL)
    
    # Replace Duplicate copy title too
    pdf_content = pdf_content.replace('DELIVERY CHALLAN &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#f26522;">DUPLICATE COPY</span>', 'DELIVERY CHALLAN')
    
    # Remove unused vars from pdfGenerator if any (tcVal, utVal)
    pdf_content = re.sub(r'const tcVal =.*?\n', '', pdf_content)
    pdf_content = re.sub(r'const utVal =.*?\n', '', pdf_content)
    pdf_content = re.sub(r'const loadingVal =.*?\:\s*\'NO\';\n', '', pdf_content, flags=re.DOTALL)
    pdf_content = re.sub(r'const transportVal =.*?\:\s*\'NO\';\n', '', pdf_content, flags=re.DOTALL)
    
    with open(pdf_path, 'w', encoding='utf-8') as f:
        f.write(pdf_content)
    print("Updated pdfGenerator.ts")
else:
    print("Failed to match duplicate HTML in pdfGenerator")


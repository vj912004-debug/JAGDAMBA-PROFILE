import re

# 1. Update ChallanPrint.tsx
challan_path = r'd:\j\src\projects\profile\components\ChallanPrint.tsx'
with open(challan_path, 'r', encoding='utf-8') as f:
    challan_content = f.read()

dup_match = re.search(r'function ChallanDuplicateCopy\(\) \{(.*?)\n  \}\n\}', challan_content, re.DOTALL)
if dup_match:
    dup_body = dup_match.group(1) + '\n  }'
    new_orig = 'function ChallanOriginalCopy() {' + dup_body
    challan_content = re.sub(r'function ChallanOriginalCopy\(\) \{(.*?)\n  \}', new_orig, challan_content, flags=re.DOTALL)
    challan_content = challan_content.replace('DELIVERY CHALLAN | DUPLICATE COPY', 'DELIVERY CHALLAN')
    with open(challan_path, 'w', encoding='utf-8') as f:
        f.write(challan_content)
    print("Updated ChallanPrint.tsx")

# 2. Update pdfGenerator.ts
pdf_path = r'd:\j\src\projects\profile\utils\pdfGenerator.ts'
with open(pdf_path, 'r', encoding='utf-8') as f:
    pdf_content = f.read()

dup_html_match = re.search(r'<div class="challan-container-dl">(.*?)</div>\n            </div>', pdf_content, re.DOTALL)
if dup_html_match:
    dup_html = '<div class="challan-container-dl">' + dup_html_match.group(1) + '</div>\n            </div>'
    new_orig_html = dup_html.replace('class="challan-container-dl"', 'class="challan-container-orig"')
    
    # Replace the old Original HTML
    pdf_content = re.sub(r'<div class="challan-container-orig">.*?<!-- END ORIGINAL COPY -->', new_orig_html + '\n            <!-- END ORIGINAL COPY -->', pdf_content, flags=re.DOTALL)
    
    # Replace DUPLICATE COPY text everywhere
    pdf_content = pdf_content.replace('DELIVERY CHALLAN &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#f26522;">DUPLICATE COPY</span>', 'DELIVERY CHALLAN')
    
    with open(pdf_path, 'w', encoding='utf-8') as f:
        f.write(pdf_content)
    print("Updated pdfGenerator.ts")


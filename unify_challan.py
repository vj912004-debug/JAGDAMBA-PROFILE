import re
import os

challan_path = r'd:\j\src\projects\profile\components\ChallanPrint.tsx'
with open(challan_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find ChallanDuplicateCopy function body
dup_start = content.find('function ChallanDuplicateCopy() {')
if dup_start == -1:
    print("Could not find ChallanDuplicateCopy")
    exit(1)

dup_body = content[dup_start:content.find('}\n};', dup_start) + 1]

# We want to replace ChallanOriginalCopy with this body, but maybe we just replace both with a parameterized function.
# Let's just do a simple string replace for now.
orig_start = content.find('function ChallanOriginalCopy() {')
orig_end = content.find('function ChallanDuplicateCopy() {')

if orig_start != -1 and orig_end != -1:
    # Get the duplicate body but change the function name
    new_orig_body = dup_body.replace('function ChallanDuplicateCopy() {', 'function ChallanOriginalCopy() {')
    
    # Optional: Change title if we want to differentiate
    new_orig_body = new_orig_body.replace('DELIVERY CHALLAN | DUPLICATE COPY', 'DELIVERY CHALLAN')
    new_dup_body = dup_body.replace('DELIVERY CHALLAN | DUPLICATE COPY', 'DELIVERY CHALLAN')
    
    new_content = content[:orig_start] + new_orig_body + '\n\n  ' + new_dup_body + '\n};\n'
    
    with open(challan_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated ChallanPrint.tsx")

pdf_path = r'd:\j\src\projects\profile\utils\pdfGenerator.ts'
with open(pdf_path, 'r', encoding='utf-8') as f:
    pdf_content = f.read()

# pdfGenerator has a huge string. We need to replace the original copy HTML with the duplicate copy HTML.
dup_html_start = pdf_content.find('<div class="challan-container-dl">')
dup_html_end = pdf_content.find('</div>\n            </div>', dup_html_start)

if dup_html_start != -1 and dup_html_end != -1:
    dup_html = pdf_content[dup_html_start:dup_html_end+6] # include </div>
    
    # The original copy HTML starts with <div class="challan-container-orig">
    orig_html_start = pdf_content.find('<div class="challan-container-orig">')
    orig_html_end = pdf_content.find('<!-- END ORIGINAL COPY -->', orig_html_start)
    
    if orig_html_end == -1:
         # Try finding the end of the original copy by looking for the next specific element or just before the duplicate check
         orig_html_end = pdf_content.find('${copies === \'both\' ? `', orig_html_start)
         
    if orig_html_start != -1 and orig_html_end != -1:
         # Replace the original HTML block
         # We'll use the dup_html but change its title to just 'DELIVERY CHALLAN'
         new_orig_html = dup_html.replace('DELIVERY CHALLAN &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#f26522;">DUPLICATE COPY</span>', 'DELIVERY CHALLAN')
         
         # Also update the actual duplicate html to match the image
         new_dup_html = dup_html.replace('DELIVERY CHALLAN &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#f26522;">DUPLICATE COPY</span>', 'DELIVERY CHALLAN')
         
         # Now construct the new pdf_content
         # First, replace the duplicate one
         pdf_content = pdf_content[:dup_html_start] + new_dup_html + pdf_content[dup_html_end+6:]
         
         # Then replace the original one
         # Re-find the positions because they might have shifted
         orig_html_start = pdf_content.find('<div class="challan-container-orig">')
         orig_html_end = pdf_content.find('${copies === \'both\' ? `', orig_html_start)
         
         if orig_html_start != -1 and orig_html_end != -1:
             pdf_content = pdf_content[:orig_html_start] + new_orig_html + '\n            ' + pdf_content[orig_html_end:]
             
             with open(pdf_path, 'w', encoding='utf-8') as f:
                 f.write(pdf_content)
             print("Updated pdfGenerator.ts")


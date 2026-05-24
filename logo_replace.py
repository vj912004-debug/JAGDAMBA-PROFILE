import re
import sys

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    with open(r'd:\j\logo_base64.txt', 'r') as f:
        new_base64 = f.read().strip()

    # The pattern matches data:image/png;base64, followed by any characters until the double quote
    pattern = re.compile(r'data:image/png;base64,[^\"]+\"')
    
    # We replace it with the new base64 string
    new_content = pattern.sub(f'data:image/png;base64,{new_base64}\"', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Replaced in {filepath}")

replace_in_file(r'd:\j\JAGDAMBA PROFILE\src\utils\pdfGenerator.ts')
replace_in_file(r'd:\j\src\projects\profile\utils\pdfGenerator.ts')
replace_in_file(r'd:\j\JAGDAMBA PROFILE\src\components\ChallanPrint.tsx')
replace_in_file(r'd:\j\JAGDAMBA PROFILE CLIENT\src\utils\pdfGenerator.ts')

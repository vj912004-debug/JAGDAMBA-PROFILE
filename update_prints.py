import os
import re

files = [
    r'd:\j\src\projects\profile\components\OrderEntryPrint.tsx',
    r'd:\j\src\projects\profile\components\PurchaseOrderPrint.tsx',
    r'd:\j\src\projects\profile\components\SalesOrderPrint.tsx',
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'import { LOGO_BASE64 }' not in content:
        content = "import { LOGO_BASE64 } from '../utils/logoBase64';\n" + content
        
    new_content = content.replace('"/logo.png"', '{LOGO_BASE64}')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
print('Updated Print components')

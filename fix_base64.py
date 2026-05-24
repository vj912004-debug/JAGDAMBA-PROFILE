import re
import codecs

with open(r'd:\j\logo_base64.txt', 'rb') as f:
    raw = f.read()

correct_base64 = raw.decode('utf-16le').strip()
correct_base64 = ''.join(correct_base64.split())

files = [
    r'd:\j\JAGDAMBA PROFILE\src\utils\pdfGenerator.ts',
    r'd:\j\src\projects\profile\utils\pdfGenerator.ts',
    r'd:\j\JAGDAMBA PROFILE\src\components\ChallanPrint.tsx'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # match data:image/png;base64, followed by anything up to the next double quote
    pattern = re.compile(r'data:image/png;base64,[^"]+"')
    
    new_content = pattern.sub('data:image/png;base64,' + correct_base64 + '"', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Fixed', filepath)

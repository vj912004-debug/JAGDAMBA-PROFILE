import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    replacements = {
        r'bg-slate-50 dark:bg-slate-800/50/60': 'bg-slate-50/60 dark:bg-slate-800/60',
        r'bg-slate-50 dark:bg-slate-800/50/30': 'bg-slate-50/30 dark:bg-slate-800/30',
        r'bg-blue-50 dark:bg-blue-900/30/30': 'bg-blue-50/30 dark:bg-blue-900/30',
        r'dark:hover:bg-blue-900/50 dark:bg-blue-900/50': 'dark:hover:bg-blue-900/50',
    }

    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned up: {filepath}")

def main():
    target_dir = r"d:\j\src\projects\profile"
    for root, _, files in os.walk(target_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()

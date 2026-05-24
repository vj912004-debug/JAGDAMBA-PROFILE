import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Dictionary of replacements
    replacements = {
        r'\bbg-white\b(?! dark:bg-)': 'bg-white dark:bg-slate-900',
        r'\bbg-slate-50\b(?! dark:bg-)': 'bg-slate-50 dark:bg-slate-800/50',
        r'\bbg-slate-100\b(?! dark:bg-)': 'bg-slate-100 dark:bg-slate-800',
        r'\btext-slate-900\b(?! dark:text-)': 'text-slate-900 dark:text-slate-50',
        r'\btext-slate-800\b(?! dark:text-)': 'text-slate-800 dark:text-slate-100',
        r'\btext-slate-700\b(?! dark:text-)': 'text-slate-700 dark:text-slate-200',
        r'\btext-slate-600\b(?! dark:text-)': 'text-slate-600 dark:text-slate-300',
        r'\bborder-slate-100\b(?! dark:border-)': 'border-slate-100 dark:border-slate-800',
        r'\bborder-slate-200\b(?! dark:border-)': 'border-slate-200 dark:border-slate-700',
    }

    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

def main():
    target_dir = r"d:\j\src\projects\profile"
    for root, _, files in os.walk(target_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()

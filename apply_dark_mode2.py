import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Dictionary of replacements
    replacements = {
        # bg colors
        r'\bbg-white\b(?! dark:bg-)': 'bg-white dark:bg-slate-900',
        r'\bbg-slate-50\b(?!/)(?! dark:bg-)': 'bg-slate-50 dark:bg-slate-800/50',
        r'\bbg-slate-50/60\b(?! dark:bg-)': 'bg-slate-50/60 dark:bg-slate-800/60',
        r'\bbg-slate-50/50\b(?! dark:bg-)': 'bg-slate-50/50 dark:bg-slate-800/50',
        r'\bbg-slate-50/30\b(?! dark:bg-)': 'bg-slate-50/30 dark:bg-slate-800/30',
        r'\bbg-slate-100\b(?! dark:bg-)': 'bg-slate-100 dark:bg-slate-800',
        r'\bbg-slate-200\b(?! dark:bg-)': 'bg-slate-200 dark:bg-slate-700',
        r'\bbg-blue-50\b(?!/)(?! dark:bg-)': 'bg-blue-50 dark:bg-blue-900/30',
        r'\bbg-blue-50/30\b(?! dark:bg-)': 'bg-blue-50/30 dark:bg-blue-900/30',
        r'\bbg-blue-100\b(?! dark:bg-)': 'bg-blue-100 dark:bg-blue-900/50',
        r'\bbg-amber-50\b(?! dark:bg-)': 'bg-amber-50 dark:bg-amber-900/30',
        r'\bbg-emerald-50\b(?! dark:bg-)': 'bg-emerald-50 dark:bg-emerald-900/30',
        r'\bbg-red-50\b(?! dark:bg-)': 'bg-red-50 dark:bg-red-900/30',
        
        # hover bg colors
        r'\bhover:bg-slate-50\b(?! dark:hover:bg-)': 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
        r'\bhover:bg-slate-100\b(?! dark:hover:bg-)': 'hover:bg-slate-100 dark:hover:bg-slate-800',
        r'\bhover:bg-blue-50\b(?!/)(?! dark:hover:bg-)': 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
        r'\bhover:bg-blue-50/30\b(?! dark:hover:bg-)': 'hover:bg-blue-50/30 dark:hover:bg-blue-900/30',
        r'\bhover:bg-blue-100\b(?! dark:hover:bg-)': 'hover:bg-blue-100 dark:hover:bg-blue-900/50',
        r'\bhover:bg-red-50\b(?! dark:hover:bg-)': 'hover:bg-red-50 dark:hover:bg-red-900/30',
        
        # text colors
        r'\btext-slate-900\b(?! dark:text-)': 'text-slate-900 dark:text-slate-50',
        r'\btext-slate-800\b(?! dark:text-)': 'text-slate-800 dark:text-slate-100',
        r'\btext-slate-700\b(?! dark:text-)': 'text-slate-700 dark:text-slate-200',
        r'\btext-slate-600\b(?! dark:text-)': 'text-slate-600 dark:text-slate-300',
        r'\btext-slate-500\b(?! dark:text-)': 'text-slate-500 dark:text-slate-400',
        r'\btext-blue-700\b(?! dark:text-)': 'text-blue-700 dark:text-blue-300',
        r'\btext-blue-600\b(?! dark:text-)': 'text-blue-600 dark:text-blue-400',
        r'\btext-emerald-700\b(?! dark:text-)': 'text-emerald-700 dark:text-emerald-400',
        r'\btext-emerald-600\b(?! dark:text-)': 'text-emerald-600 dark:text-emerald-400',
        r'\btext-amber-800\b(?! dark:text-)': 'text-amber-800 dark:text-amber-200',
        r'\btext-red-600\b(?! dark:text-)': 'text-red-600 dark:text-red-400',
        
        # border colors
        r'\bborder-slate-100\b(?! dark:border-)': 'border-slate-100 dark:border-slate-800',
        r'\bborder-slate-200\b(?! dark:border-)': 'border-slate-200 dark:border-slate-700',
        r'\bborder-slate-300\b(?! dark:border-)': 'border-slate-300 dark:border-slate-600',
        r'\bborder-blue-100\b(?! dark:border-)': 'border-blue-100 dark:border-blue-800',
        r'\bborder-blue-200\b(?! dark:border-)': 'border-blue-200 dark:border-blue-700',
        r'\bborder-emerald-100\b(?! dark:border-)': 'border-emerald-100 dark:border-emerald-800',
        r'\bborder-amber-200\b(?! dark:border-)': 'border-amber-200 dark:border-amber-800',
        r'\bborder-red-100\b(?! dark:border-)': 'border-red-100 dark:border-red-800',
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

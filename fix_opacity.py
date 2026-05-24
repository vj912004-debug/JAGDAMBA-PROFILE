import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix: bg-slate-50 dark:bg-slate-800/50/50 -> bg-slate-50/50 dark:bg-slate-800/50
    content = re.sub(r'bg-([a-z]+)-(\d+) dark:bg-([a-z]+)-(\d+)/\d+/(\d+)', r'bg-\1-\2/\5 dark:bg-\3-\4/\5', content)
    
    # Fix hover variants
    content = re.sub(r'hover:bg-([a-z]+)-(\d+) dark:hover:bg-([a-z]+)-(\d+)/\d+/(\d+)', r'hover:bg-\1-\2/\5 dark:hover:bg-\3-\4/\5', content)

    # Some might be separated by a space or another class:
    # We can also just replace any dark:bg-xxx-yyy/A/B with dark:bg-xxx-yyy/B
    # But we also need to fix the missing /B on the light class if it's adjacent
    # Actually, let's just do a blanket fix for any word ending with /A/B:
    # "bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/30"
    content = re.sub(r'bg-([a-z]+)-(\d+)\s+(dark:hover:bg-[a-z]+-\d+/\d+)\s+dark:bg-([a-z]+)-(\d+)/\d+/(\d+)',
                     r'bg-\1-\2/\6 \3 dark:bg-\4-\5/\6', content)

    # Fallback: if there is any remaining dark:bg-xyz/A/B or dark:hover:bg-xyz/A/B, just fix it
    # We might have orphaned light classes but at least dark mode will work.
    content = re.sub(r'(dark:(?:hover:)?bg-[a-z]+-\d+)/\d+/(\d+)', r'\1/\2', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned up: {filepath}")

def main():
    target_dirs = [r"d:\j\src\projects\profile", r"d:\j\JAGDAMBA PROFILE\src"]
    for d in target_dirs:
        for root, _, files in os.walk(d):
            for file in files:
                if file.endswith(('.tsx', '.ts')):
                    process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()

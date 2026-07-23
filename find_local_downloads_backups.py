import os
import fnmatch

search_dirs = [
    r"C:\Users\Vraj Patel\Desktop",
    r"C:\Users\Vraj Patel\Documents",
    r"C:\Users\Vraj Patel"
]

print("Searching folders for jagdamba backup JSON files...")
found = []

for base_dir in search_dirs:
    if not os.path.exists(base_dir):
        continue
    print(f"Scanning: {base_dir} (up to 3 levels deep)")
    
    # Walk with depth limit
    base_depth = base_dir.count(os.sep)
    for root, dirs, files in os.walk(base_dir):
        depth = root.count(os.sep) - base_depth
        if depth > 2:
            # clear dirs to prevent deeper traversal
            dirs.clear()
        
        for file in files:
            if file.endswith('.json') and 'jagdamba' in file.lower() and 'package' not in file.lower():
                full_path = os.path.join(root, file)
                found.append(full_path)

if found:
    print(f"\nFound {len(found)} file(s):")
    for f in sorted(list(set(found))):
        size = os.path.getsize(f)
        import datetime
        dt = datetime.datetime.fromtimestamp(os.path.getmtime(f))
        print(f" - {f} ({size} bytes, Modified: {dt})")
else:
    print("\nNo backup files found.")

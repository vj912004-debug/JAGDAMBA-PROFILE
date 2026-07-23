import os

search_dir = r"d:\j"
exclude_dirs = {"node_modules", ".git", ".vscode", "__pycache__", "dist"}
extensions = {".zip", ".rar", ".tar", ".gz", ".7z", ".db", ".sqlite", ".sqlite3"}

print("Searching for archive or DB files locally...")
found = []
for root, dirs, files in os.walk(search_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        ext = os.path.splitext(file)[1].lower()
        if ext in extensions or 'backup' in file.lower() or 'export' in file.lower() or 'erp' in file.lower():
            full_path = os.path.join(root, file)
            size = os.path.getsize(full_path)
            print(f"Found: {full_path} ({size} bytes)")
            found.append(full_path)

if not found:
    print("No archive or DB files found locally.")

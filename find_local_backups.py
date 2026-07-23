import os

search_dir = r"d:\j"
exclude_dirs = {"node_modules", ".git", ".vscode", "__pycache__", "dist"}
extensions = {".sql", ".bak", ".dump"}

print("Searching for backup files...")
found = []
for root, dirs, files in os.walk(search_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        ext = os.path.splitext(file)[1].lower()
        if ext in extensions or "backup" in file.lower() or "export" in file.lower() or "erp_data" in file.lower():
            full_path = os.path.join(root, file)
            print(f"Found: {full_path} ({os.path.getsize(full_path)} bytes)")
            found.append(full_path)

if not found:
    print("No backup files found.")

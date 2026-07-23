import os

search_dir = r"d:\j"
exclude_dirs = {"node_modules", ".git", ".vscode", "__pycache__", "dist"}

print("Searching for JSON files...")
for root, dirs, files in os.walk(search_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if file.endswith('.json'):
            full_path = os.path.join(root, file)
            size = os.path.getsize(full_path)
            # print first 100 characters of small files, or just path for big files
            if size > 1000:
                print(f"JSON: {full_path} ({size} bytes)")

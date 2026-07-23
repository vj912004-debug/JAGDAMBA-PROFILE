import os

search_dir = r"d:\j\src\projects\client"
if not os.path.exists(search_dir):
    print("projects/client directory does not exist.")
    sys.exit(0)

found = []
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".jsx")):
            full_path = os.path.join(root, file)
            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
                if "erp/data" in content or "saveErpData" in content or "fetchErpData" in content or "saveToStorage" in content:
                    print(f"Match found in: {full_path}")
                    found.append(full_path)

if not found:
    print("No references to ERP APIs found in Client project.")

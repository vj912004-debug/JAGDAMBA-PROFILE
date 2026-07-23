import os

brain_dir = r"C:\Users\Vraj Patel\.gemini\antigravity-ide\brain"

print("Searching past files/transcripts for OID '17197'...")
for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file.endswith(('.md', '.json', '.jsonl', '.py')):
            full_path = os.path.join(root, file)
            try:
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if '17197' in content:
                        print(f"Match in: {full_path} (size {os.path.getsize(full_path)} bytes)")
                        # Print surrounding context
                        idx = content.find('17197')
                        print("Context:", content[max(0, idx-200):min(len(content), idx+300)].strip())
                        print("-" * 50)
            except Exception as e:
                pass

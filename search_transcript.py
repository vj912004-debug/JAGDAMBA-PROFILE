import os

brain_dir = r"C:\Users\Vraj Patel\.gemini\antigravity-ide\brain"
print("Listing folders in:", brain_dir)
try:
    for name in os.listdir(brain_dir):
        full_path = os.path.join(brain_dir, name)
        if os.path.isdir(full_path):
            print(f"Directory: {name}")
except Exception as e:
    print("Error:", e)

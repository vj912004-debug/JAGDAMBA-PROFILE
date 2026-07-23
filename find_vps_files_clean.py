import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmd = (
    "find /root/JAGDAMBA-PROFILE -type f "
    "-not -path '*/node_modules/*' "
    "-not -path '*/.git/*' "
    "-not -path '*/dist/*' "
    "-not -path '*/src/*' "
    "-not -path '*/.wwebjs_auth/*' "
    "-not -path '*/.wwebjs_cache/*'"
)
print(">>>", cmd)
_, o, _ = c.exec_command(cmd)
files = o.read().decode('utf-8', errors='replace').strip().split('\n')
for f in sorted(files):
    if f.strip():
        # run ls -lh to show size
        _, size_o, _ = c.exec_command(f"ls -lh '{f}'")
        print(size_o.read().decode().strip())

c.close()

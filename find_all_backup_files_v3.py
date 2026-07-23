import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Search entire disk excluding typical system folders
cmd = (
    "find / -type f \\( -name \"*jagdamba*\" -o -name \"*backup*\" -o -name \"*erp*\" -o -name \"*.sql*\" \\) "
    "-not -path \"/proc/*\" -not -path \"/sys/*\" -not -path \"/dev/*\" -not -path \"/run/*\" -not -path \"/var/lib/docker/*\" "
    "-not -path \"/usr/*\" -not -path \"/lib/*\" -not -path \"/boot/*\" -not -path \"/snap/*\" 2>/dev/null"
)
print(">>>", cmd)
_, o, _ = c.exec_command(cmd, timeout=180)
files = o.read().decode('utf-8', errors='replace').strip().split('\n')

print("\nAll matching backup files found on VPS:")
for f in sorted(files):
    f = f.strip()
    if f:
        # Run ls -lh to show date and size
        _, size_o, _ = c.exec_command(f"ls -lh '{f}'")
        print(size_o.read().decode().strip())

c.close()

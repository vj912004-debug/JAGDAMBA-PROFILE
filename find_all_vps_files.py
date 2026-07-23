import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Search entire VPS excluding system directories
cmd = 'find / -type f \\( -name "*.sql" -o -name "*.dump" -o -name "*.bak" -o -name "*.backup" \\) ' \
      '-not -path "/proc/*" -not -path "/sys/*" -not -path "/dev/*" -not -path "/run/*" -not -path "/var/lib/docker/*" 2>/dev/null'

print(">>>", cmd)
_, o, e = c.exec_command(cmd, timeout=120)
out = o.read().decode('utf-8', errors='replace')
if out.strip():
    print(out.strip())

c.close()

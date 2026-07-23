import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    'ls -la /var/lib/postgresql/16/main/base/',
    'find /var/lib/postgresql/16/main/base/ -type f -mtime -10 -exec ls -la {} \\; | head -n 50 || true',
]

for cmd in cmds:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd, timeout=90)
    out = o.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip())

c.close()

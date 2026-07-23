import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    'find /root /home /var/lib/postgresql /tmp -type f -name "*.sql" 2>/dev/null',
    'find /root /home /var/lib/postgresql /tmp -type f -name "*.dump" 2>/dev/null',
    'find /root /home /var/lib/postgresql /tmp -type f -name "*backup*" 2>/dev/null',
    'find /root /home /var/lib/postgresql /tmp -type f -name "*json" -size +10k 2>/dev/null | grep -i -E "erp|jagdamba|data|db" || true',
]

for cmd in cmds:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd, timeout=90)
    out = o.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip())

c.close()

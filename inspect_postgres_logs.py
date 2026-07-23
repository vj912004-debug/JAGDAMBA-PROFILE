import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    'ls -la /var/log/postgresql/',
    'tail -n 150 /var/log/postgresql/postgresql-16-main.log 2>/dev/null || tail -n 150 /var/log/postgresql/postgresql-15-main.log 2>/dev/null || tail -n 150 /var/log/postgresql/postgresql-14-main.log 2>/dev/null || echo "No postgresql log found"',
]

for cmd in cmds:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd, timeout=90)
    out = o.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip())

c.close()

import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    # Find active access logs
    'ls -la /var/log/nginx/',
    # Search for erp/data requests in the active access log
    'grep -E "PUT /api/erp/data|GET /api/erp/data" /var/log/nginx/access.log | tail -n 50 || true',
    # Search for PUT requests specifically to see when saves occurred
    'grep "PUT /api/erp/data" /var/log/nginx/access.log | tail -n 50 || true',
    # Check if there are any references in the archived/rotated logs
    'zgrep "PUT /api/erp/data" /var/log/nginx/access.log.*.gz 2>/dev/null | tail -n 20 || true',
]

for cmd in cmds:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd, timeout=90)
    out = o.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip())

c.close()

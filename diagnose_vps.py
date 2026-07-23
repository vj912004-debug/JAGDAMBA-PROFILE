import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    'pm2 status',
    'pm2 jlist',
    'pm2 logs frontend --lines 25 --nostream',
    'pm2 logs api --lines 15 --nostream',
    'systemctl is-active nginx',
    'df -h /',
    'free -m',
    'ss -tlnp | grep -E "4173|3001|5173|80|443" || netstat -tlnp | grep -E "4173|3001|5173|80|443"',
    'curl -sI http://127.0.0.1:4173/ | head -5',
    'curl -sI http://127.0.0.1:3001/api/erp/data | head -5',
    'head -20 /root/JAGDAMBA-PROFILE/dist/index.html',
    'ls /root/JAGDAMBA-PROFILE/dist/assets/ProfileApp*.js 2>&1',
    'cat /root/.pm2/dump.pm2 2>/dev/null | head -c 2000',
]

for cmd in cmds:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd, timeout=90)
    out = o.read().decode('utf-8', errors='replace')
    err = e.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip()[:6000])
    if err.strip():
        print('ERR:', err.strip()[:2000])

c.close()

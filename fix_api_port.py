import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=45)

cmds = [
    'fuser -k 5000/tcp || true',
    'pm2 delete api || true',
    'cd /root/JAGDAMBA-PROFILE/backend && pm2 start src/index.js --name api --update-env',
    'pm2 save',
    'sleep 2',
    'curl -s http://127.0.0.1:5000/api/erp/gst-captcha',
]

results = []
for cmd in cmds:
    _, o, e = c.exec_command(cmd)
    time.sleep(3 if 'sleep' in cmd else 2)
    results.append(o.read().decode('utf-8', errors='replace'))

open('d:/j/gst_fix_out.txt', 'w', encoding='utf-8').write('\n'.join(results))
c.close()

import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmd = 'tail -n 100 /root/.pm2/logs/api-out.log'
_, o, e = c.exec_command(cmd, timeout=90)
out = o.read().decode('utf-8', errors='replace')
if out.strip():
    print(out.strip())

c.close()

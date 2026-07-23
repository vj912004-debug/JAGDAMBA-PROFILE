import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=45)
_, o, e = c.exec_command('cd /root/JAGDAMBA-PROFILE/backend && node src/index.js 2>&1', get_pty=True)
import time
time.sleep(3)
out = o.read(4096).decode('utf-8', errors='replace')
err = e.read(4096).decode('utf-8', errors='replace')
open('d:/j/api_start_test.txt', 'w', encoding='utf-8').write(out + '\n' + err)
c.close()

import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=45)
_, o, e = c.exec_command('cd /root/JAGDAMBA-PROFILE/backend && pm2 logs api --lines 30 --nostream')
out = o.read().decode('utf-8', errors='replace')
err = e.read().decode('utf-8', errors='replace')
open('d:/j/pm2_api_logs_gst.txt', 'w', encoding='utf-8').write(out + '\n' + err)
c.close()
print('written')

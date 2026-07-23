import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=45)

cmds = [
    'cd /root/JAGDAMBA-PROFILE/backend && pm2 delete api',
    'cd /root/JAGDAMBA-PROFILE/backend && pm2 start src/index.js --name api --update-env',
    'pm2 save',
    'pm2 status',
    'curl -sI https://jagdambaprofile.tech/api/health | head -3',
    'curl -s https://jagdambaprofile.tech/api/erp/gst-captcha | head -c 120',
]

for cmd in cmds:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd)
    out = o.read().decode('utf-8', errors='replace')
    err = e.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip())
    if err.strip():
        print(err.strip())

c.close()
